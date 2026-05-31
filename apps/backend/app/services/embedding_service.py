import re
from datetime import datetime, timezone
from uuid import UUID

from openai import AsyncOpenAI
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.documents import Document, DocumentAnalysis, EvidenceItem, OcrResult
from app.models.knowledge import (
    COLLECTIONS,
    CaseEmbedding,
    DocumentChunk,
    DocumentEmbedding,
    EmbeddingStatusEnum,
    EvidenceEmbedding,
)
from app.models.legal import Case
from app.services.audit_service import AuditService
from app.services.qdrant_service import QdrantService


class EmbeddingService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.settings = get_settings()
        self.qdrant = QdrantService()
        self.audit = AuditService(db)

    @property
    def enabled(self) -> bool:
        return self.qdrant.configured

    async def _embed_texts(self, texts: list[str]) -> list[list[float]]:
        if not self.settings.openai_configured:
            raise RuntimeError("OpenAI required for embeddings")
        client = AsyncOpenAI(api_key=self.settings.openai_api_key)
        resp = await client.embeddings.create(
            model=self.settings.openai_embedding_model,
            input=texts,
        )
        return [d.embedding for d in resp.data]

    def chunk_text(self, text: str) -> list[tuple[int, int, str]]:
        size = self.settings.embedding_chunk_size
        overlap = self.settings.embedding_chunk_overlap
        text = re.sub(r"\s+", " ", text).strip()
        if not text:
            return []
        chunks = []
        start = 0
        idx = 0
        while start < len(text):
            end = min(start + size, len(text))
            chunk = text[start:end].strip()
            if chunk:
                chunks.append((idx, start, chunk))
                idx += 1
            if end >= len(text):
                break
            start = max(0, end - overlap)
        return chunks

    async def index_document(
        self,
        document_id: UUID,
        text: str,
        performed_by: UUID,
        metadata: dict | None = None,
    ) -> int:
        if not self.enabled:
            return 0

        self.qdrant.ensure_collections()
        doc_result = await self.db.execute(select(Document).where(Document.id == document_id))
        doc = doc_result.scalar_one_or_none()
        if not doc:
            return 0

        meta = metadata or {}
        meta.update({
            "document_id": str(document_id),
            "file_name": doc.file_name,
            "case_id": str(doc.case_id) if doc.case_id else None,
            "type": "document",
        })

        chunks_data = self.chunk_text(text)
        if not chunks_data:
            return 0

        texts = [c[2] for c in chunks_data]
        vectors = await self._embed_texts(texts)
        indexed = 0

        for (chunk_index, char_start, chunk_text), vector in zip(chunks_data, vectors):
            point_id = QdrantService.new_point_id()
            chunk_row = DocumentChunk(
                document_id=document_id,
                chunk_index=chunk_index,
                chunk_text=chunk_text,
                char_start=char_start,
                char_end=char_start + len(chunk_text),
                embedding_status=EmbeddingStatusEnum.INDEXED,
                qdrant_point_id=point_id,
                version_number=doc.version_number,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            self.db.add(chunk_row)
            await self.db.flush()

            payload = {**meta, "chunk_index": chunk_index, "chunk_text": chunk_text[:500]}
            self.qdrant.upsert(COLLECTIONS["documents"], point_id, vector, payload)

            emb = DocumentEmbedding(
                document_id=document_id,
                chunk_id=chunk_row.id,
                collection_name=COLLECTIONS["documents"],
                qdrant_point_id=point_id,
                embedding_model=self.settings.openai_embedding_model,
                status=EmbeddingStatusEnum.INDEXED,
                metadata_=payload,
                created_at=datetime.now(timezone.utc),
            )
            self.db.add(emb)
            indexed += 1

        doc.embedding_ready = True
        await self.db.flush()
        await self.audit.log(
            "embedding.document_indexed",
            "document_embeddings",
            document_id,
            performed_by,
            new_values={"chunks": indexed},
        )
        return indexed

    async def index_document_from_db(
        self, document_id: UUID, performed_by: UUID
    ) -> int:
        ocr = await self.db.execute(
            select(OcrResult)
            .where(OcrResult.document_id == document_id)
            .order_by(OcrResult.created_at.desc())
            .limit(1)
        )
        ocr_row = ocr.scalar_one_or_none()
        text = ocr_row.raw_text if ocr_row else ""

        if not text:
            analysis = await self.db.execute(
                select(DocumentAnalysis)
                .where(DocumentAnalysis.document_id == document_id)
                .order_by(DocumentAnalysis.generated_at.desc())
                .limit(1)
            )
            a = analysis.scalar_one_or_none()
            text = a.embedding_text if a else ""

        return await self.index_document(document_id, text or "", performed_by)

    async def index_case(self, case_id: UUID, performed_by: UUID) -> bool:
        if not self.enabled:
            return False
        result = await self.db.execute(select(Case).where(Case.id == case_id))
        case = result.scalar_one_or_none()
        if not case:
            return False

        text = f"{case.title}\n{case.description or ''}\nCategory: {case.case_category.value}"
        vector = (await self._embed_texts([text]))[0]
        point_id = QdrantService.new_point_id()
        payload = {
            "type": "case",
            "case_id": str(case_id),
            "case_number": case.case_number,
            "title": case.title,
        }
        self.qdrant.upsert(COLLECTIONS["cases"], point_id, vector, payload)
        row = CaseEmbedding(
            case_id=case_id,
            collection_name=COLLECTIONS["cases"],
            qdrant_point_id=point_id,
            source_text=text[:4000],
            embedding_model=self.settings.openai_embedding_model,
            status=EmbeddingStatusEnum.INDEXED,
            metadata_=payload,
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(row)
        await self.db.flush()
        await self.audit.log("embedding.case_indexed", "case_embeddings", case_id, performed_by)
        return True

    async def index_evidence(self, evidence_id: UUID, performed_by: UUID) -> bool:
        if not self.enabled:
            return False
        result = await self.db.execute(
            select(EvidenceItem).where(EvidenceItem.id == evidence_id)
        )
        ev = result.scalar_one_or_none()
        if not ev:
            return False

        text = f"{ev.title}\n{ev.description or ''}\nType: {ev.evidence_type.value}"
        vector = (await self._embed_texts([text]))[0]
        point_id = QdrantService.new_point_id()
        payload = {
            "type": "evidence",
            "evidence_id": str(evidence_id),
            "title": ev.title,
            "case_id": str(ev.case_id) if ev.case_id else None,
        }
        self.qdrant.upsert(COLLECTIONS["evidence"], point_id, vector, payload)
        row = EvidenceEmbedding(
            evidence_id=evidence_id,
            collection_name=COLLECTIONS["evidence"],
            qdrant_point_id=point_id,
            source_text=text[:4000],
            embedding_model=self.settings.openai_embedding_model,
            status=EmbeddingStatusEnum.INDEXED,
            metadata_=payload,
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(row)
        await self.db.flush()
        await self.audit.log("embedding.evidence_indexed", "evidence_embeddings", evidence_id, performed_by)
        return True

    async def index_knowledge_article(
        self, article_id: UUID, title: str, content: str, summary: str | None, performed_by: UUID
    ) -> bool:
        if not self.enabled:
            return False
        text = f"{title}\n{summary or ''}\n{content}"
        vector = (await self._embed_texts([text[:8000]]))[0]
        point_id = QdrantService.new_point_id()
        payload = {"type": "knowledge", "article_id": str(article_id), "title": title}
        self.qdrant.upsert(COLLECTIONS["knowledge"], point_id, vector, payload)
        await self.audit.log("embedding.knowledge_indexed", "knowledge_articles", article_id, performed_by)
        return True

    async def index_summary(self, document_id: UUID, summary_text: str, performed_by: UUID) -> bool:
        if not self.enabled or not summary_text.strip():
            return False
        vector = (await self._embed_texts([summary_text[:8000]]))[0]
        point_id = QdrantService.new_point_id()
        payload = {"type": "summary", "document_id": str(document_id), "summary": summary_text[:1000]}
        self.qdrant.upsert(COLLECTIONS["summaries"], point_id, vector, payload)
        return True
