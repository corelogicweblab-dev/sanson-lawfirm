from datetime import date, datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.documents import (
    Document,
    DocumentAnalysis,
    DocumentCategory,
    DocumentLink,
    DocumentLinkTypeEnum,
    DocumentReviewStatusEnum,
    DocumentVersion,
    DocumentVisibilityEnum,
    EvidenceItem,
    EvidenceStatusEnum,
    EvidenceTimeline,
    EvidenceTypeEnum,
    OcrResult,
    OcrStatusEnum,
    TimelineSourceTypeEnum,
)
from app.services.audit_service import AuditService
from app.services.document_ai_service import DocumentAiService
from app.services.ocr_service import OcrService
from app.services.document_file_storage import DocumentFileStorage


class DocumentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.audit = AuditService(db)
        self.storage = DocumentFileStorage()
        self.ocr = OcrService()
        self.ai = DocumentAiService()

    async def list_categories(self) -> list[DocumentCategory]:
        result = await self.db.execute(
            select(DocumentCategory)
            .where(DocumentCategory.deleted_at.is_(None))
            .order_by(DocumentCategory.sort_order)
        )
        return list(result.scalars().all())

    async def create_document_from_upload(
        self,
        user_id: UUID,
        filename: str,
        mime_type: str,
        file_data: bytes,
        category_id: UUID | None = None,
        case_id: UUID | None = None,
        legal_request_id: UUID | None = None,
        visibility: str = "CLIENT",
        ip: str | None = None,
        ua: str | None = None,
    ) -> Document:
        self.storage.validate_file(filename, mime_type, len(file_data))
        relative_path = self.storage.build_storage_path(user_id, filename)
        storage_path = await self.storage.upload_bytes(relative_path, file_data, mime_type)

        doc = Document(
            file_name=filename,
            original_file_name=filename,
            file_size=len(file_data),
            mime_type=mime_type,
            storage_path=storage_path,
            uploaded_by=user_id,
            category_id=category_id,
            case_id=case_id,
            legal_request_id=legal_request_id,
            visibility=DocumentVisibilityEnum[visibility],
            review_status=DocumentReviewStatusEnum.PENDING,
            version_number=1,
        )
        self.db.add(doc)
        await self.db.flush()

        version = DocumentVersion(
            document_id=doc.id,
            version_number=1,
            file_name=filename,
            file_size=len(file_data),
            mime_type=mime_type,
            storage_path=storage_path,
            uploaded_by=user_id,
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(version)
        await self.db.flush()

        await self.audit.log(
            "document.upload", "documents", doc.id, user_id, ip, ua,
            new_values={"file_name": filename, "size": len(file_data)},
        )
        return doc

    async def create_document_after_presigned(
        self,
        user_id: UUID,
        storage_path: str,
        filename: str,
        mime_type: str,
        file_size: int,
        category_id: UUID | None = None,
        case_id: UUID | None = None,
        legal_request_id: UUID | None = None,
        visibility: str = "CLIENT",
        ip: str | None = None,
        ua: str | None = None,
    ) -> Document:
        from app.services.supabase_storage import SupabaseStorageService

        if storage_path.startswith(SupabaseStorageService.PREFIX):
            if not self.storage.supabase.configured:
                raise ValueError("Supabase Storage is not configured on the server")
        else:
            expected_prefix = f"documents/{user_id}/"
            if not storage_path.startswith(expected_prefix) and not storage_path.startswith(
                "local-fallback/"
            ):
                raise ValueError("Invalid storage path for this user")
        self.storage.validate_file(filename, mime_type, file_size)
        if not await self.storage.object_exists(storage_path):
            raise ValueError("File not found in storage — upload may have failed")

        doc = Document(
            file_name=filename,
            original_file_name=filename,
            file_size=file_size,
            mime_type=mime_type,
            storage_path=storage_path,
            uploaded_by=user_id,
            category_id=category_id,
            case_id=case_id,
            legal_request_id=legal_request_id,
            visibility=DocumentVisibilityEnum[visibility],
            review_status=DocumentReviewStatusEnum.PENDING,
            version_number=1,
        )
        self.db.add(doc)
        await self.db.flush()

        version = DocumentVersion(
            document_id=doc.id,
            version_number=1,
            file_name=filename,
            file_size=file_size,
            mime_type=mime_type,
            storage_path=storage_path,
            uploaded_by=user_id,
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(version)
        await self.db.flush()

        await self.audit.log(
            "document.upload", "documents", doc.id, user_id, ip, ua,
            new_values={"file_name": filename, "size": file_size, "presigned": True},
        )
        return doc

    async def get_document(
        self, document_id: UUID, user_id: UUID | None = None, is_staff: bool = False
    ) -> Document | None:
        query = (
            select(Document)
            .where(Document.id == document_id, Document.deleted_at.is_(None))
            .options(selectinload(Document.versions), selectinload(Document.category))
        )
        result = await self.db.execute(query)
        doc = result.scalar_one_or_none()
        if not doc:
            return None
        if not is_staff and user_id and doc.uploaded_by != user_id:
            if doc.visibility == DocumentVisibilityEnum.PRIVATE:
                return None
        return doc

    async def list_documents(
        self,
        offset: int,
        limit: int,
        user_id: UUID | None = None,
        case_id: UUID | None = None,
        legal_request_id: UUID | None = None,
        is_staff: bool = False,
    ) -> tuple[list[Document], int]:
        query = select(Document).where(Document.deleted_at.is_(None))
        count_q = select(func.count(Document.id)).where(Document.deleted_at.is_(None))

        if not is_staff and user_id:
            query = query.where(Document.uploaded_by == user_id)
            count_q = count_q.where(Document.uploaded_by == user_id)
        if case_id:
            query = query.where(Document.case_id == case_id)
            count_q = count_q.where(Document.case_id == case_id)
        if legal_request_id:
            query = query.where(Document.legal_request_id == legal_request_id)
            count_q = count_q.where(Document.legal_request_id == legal_request_id)

        total = (await self.db.execute(count_q)).scalar() or 0
        result = await self.db.execute(
            query.order_by(Document.created_at.desc()).offset(offset).limit(limit)
        )
        return list(result.scalars().all()), total

    async def get_download_url(self, doc: Document) -> str | None:
        try:
            return await self.storage.download_url(doc.storage_path)
        except ValueError:
            return None

    async def soft_delete(
        self, doc: Document, performed_by: UUID, ip: str | None = None, ua: str | None = None
    ) -> Document:
        doc.deleted_at = datetime.now(timezone.utc)
        await self.audit.log("document.delete", "documents", doc.id, performed_by, ip, ua)
        return doc

    async def create_version(
        self,
        doc: Document,
        user_id: UUID,
        filename: str,
        mime_type: str,
        file_data: bytes,
        change_notes: str | None = None,
        ip: str | None = None,
        ua: str | None = None,
    ) -> DocumentVersion:
        self.storage.validate_file(filename, mime_type, len(file_data))
        relative_path = self.storage.build_storage_path(user_id, filename)
        storage_path = await self.storage.upload_bytes(relative_path, file_data, mime_type)

        new_ver = doc.version_number + 1
        version = DocumentVersion(
            document_id=doc.id,
            version_number=new_ver,
            file_name=filename,
            file_size=len(file_data),
            mime_type=mime_type,
            storage_path=storage_path,
            uploaded_by=user_id,
            change_notes=change_notes,
            created_at=datetime.now(timezone.utc),
        )
        doc.version_number = new_ver
        doc.file_name = filename
        doc.file_size = len(file_data)
        doc.mime_type = mime_type
        doc.storage_path = storage_path
        doc.updated_at = datetime.now(timezone.utc)
        self.db.add(version)
        await self.db.flush()
        await self.audit.log(
            "document.version_create", "document_versions", version.id, user_id, ip, ua,
            new_values={"version": new_ver},
        )
        return version

    async def run_ocr(
        self, doc: Document, performed_by: UUID, ip: str | None = None, ua: str | None = None
    ) -> OcrResult:
        row = OcrResult(
            document_id=doc.id,
            status=OcrStatusEnum.PROCESSING,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        self.db.add(row)
        await self.db.flush()

        try:
            if self.storage.configured and not doc.storage_path.startswith("local-fallback/"):
                data = await self.storage.download_bytes(doc.storage_path)
            else:
                data = b""
            text, confidence, meta = self.ocr.extract_text(data, doc.mime_type, doc.file_name)
            row.raw_text = text
            row.confidence_score = OcrService.to_decimal_confidence(confidence)
            row.page_count = meta.get("page_count")
            row.processing_meta = meta
            row.status = OcrStatusEnum.COMPLETED if text else OcrStatusEnum.FAILED
        except Exception as exc:
            row.status = OcrStatusEnum.FAILED
            row.processing_meta = {"error": str(exc)}

        row.updated_at = datetime.now(timezone.utc)
        await self.db.flush()
        await self.audit.log("document.ocr", "ocr_results", row.id, performed_by, ip, ua)
        return row

    async def run_analysis(
        self, doc: Document, ocr_text: str | None, performed_by: UUID,
        ip: str | None = None, ua: str | None = None,
    ) -> DocumentAnalysis:
        text = ocr_text or ""
        if not text and self.storage.configured and not doc.storage_path.startswith("local-fallback/"):
            try:
                data = await self.storage.download_bytes(doc.storage_path)
                text, _, _ = self.ocr.extract_text(data, doc.mime_type, doc.file_name)
            except Exception:
                text = ""

        data = await self.ai.analyze_document(text)
        row = DocumentAnalysis(
            document_id=doc.id,
            summary_text=data.get("summary_text"),
            important_findings=data.get("important_findings"),
            parties=data.get("parties"),
            dates_found=data.get("dates_found"),
            legal_significance=data.get("legal_significance"),
            risk_indicators=data.get("risk_indicators"),
            missing_attachments=data.get("missing_attachments"),
            extracted_entities=data.get("extracted_entities"),
            keywords=data.get("keywords"),
            embedding_text=data.get("embedding_text") or text[:8000],
            generated_at=datetime.now(timezone.utc),
            created_at=datetime.now(timezone.utc),
        )
        doc.keywords = data.get("keywords") or []
        doc.entities = data.get("extracted_entities") or {}
        doc.embedding_ready = bool(text.strip())
        self.db.add(row)
        await self.db.flush()
        await self.audit.log("document.analysis", "document_analyses", row.id, performed_by, ip, ua)
        return row

    async def generate_evidence_timeline(
        self,
        doc: Document,
        ocr_text: str,
        performed_by: UUID,
        ip: str | None = None,
        ua: str | None = None,
    ) -> list[EvidenceTimeline]:
        data = await self.ai.extract_timeline(ocr_text)
        events = data.get("events", [])
        rows = []
        for i, ev in enumerate(events):
            date_str = ev.get("event_date", "")
            try:
                event_date = date.fromisoformat(date_str[:10])
            except ValueError:
                continue
            row = EvidenceTimeline(
                case_id=doc.case_id,
                legal_request_id=doc.legal_request_id,
                document_id=doc.id,
                event_date=event_date,
                event_title=ev.get("event_title", "Event")[:255],
                event_description=ev.get("event_description"),
                location=ev.get("location"),
                people=ev.get("people", []),
                organizations=ev.get("organizations", []),
                source_type=TimelineSourceTypeEnum.AI_EXTRACTION,
                confidence_score=data.get("confidence_score"),
                sort_order=i,
                created_by=performed_by,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            self.db.add(row)
            rows.append(row)
        await self.db.flush()
        await self.audit.log(
            "evidence.timeline_generated", "evidence_timelines", doc.id, performed_by, ip, ua,
            new_values={"count": len(rows)},
        )
        return rows

    async def create_evidence(
        self,
        owner_id: UUID,
        title: str,
        evidence_type: str,
        document_id: UUID | None = None,
        case_id: UUID | None = None,
        legal_request_id: UUID | None = None,
        description: str | None = None,
        ip: str | None = None,
        ua: str | None = None,
    ) -> EvidenceItem:
        item = EvidenceItem(
            document_id=document_id,
            case_id=case_id,
            legal_request_id=legal_request_id,
            evidence_type=EvidenceTypeEnum[evidence_type],
            title=title,
            description=description,
            status=EvidenceStatusEnum.UPLOADED,
            owner_id=owner_id,
        )
        self.db.add(item)
        await self.db.flush()
        if document_id:
            link = DocumentLink(
                document_id=document_id,
                link_type=DocumentLinkTypeEnum.EVIDENCE,
                link_id=item.id,
                created_by=owner_id,
                created_at=datetime.now(timezone.utc),
            )
            self.db.add(link)
        await self.audit.log("evidence.create", "evidence_items", item.id, owner_id, ip, ua)
        return item

    async def list_evidence(
        self,
        offset: int,
        limit: int,
        owner_id: UUID | None = None,
        case_id: UUID | None = None,
        is_staff: bool = False,
    ) -> tuple[list[EvidenceItem], int]:
        query = select(EvidenceItem).where(EvidenceItem.deleted_at.is_(None))
        count_q = select(func.count(EvidenceItem.id)).where(EvidenceItem.deleted_at.is_(None))
        if not is_staff and owner_id:
            query = query.where(EvidenceItem.owner_id == owner_id)
            count_q = count_q.where(EvidenceItem.owner_id == owner_id)
        if case_id:
            query = query.where(EvidenceItem.case_id == case_id)
            count_q = count_q.where(EvidenceItem.case_id == case_id)
        total = (await self.db.execute(count_q)).scalar() or 0
        result = await self.db.execute(
            query.order_by(EvidenceItem.created_at.desc()).offset(offset).limit(limit)
        )
        return list(result.scalars().all()), total

    async def list_evidence_timelines(
        self,
        case_id: UUID | None = None,
        legal_request_id: UUID | None = None,
        document_id: UUID | None = None,
    ) -> list[EvidenceTimeline]:
        query = select(EvidenceTimeline)
        if case_id:
            query = query.where(EvidenceTimeline.case_id == case_id)
        if legal_request_id:
            query = query.where(EvidenceTimeline.legal_request_id == legal_request_id)
        if document_id:
            query = query.where(EvidenceTimeline.document_id == document_id)
        result = await self.db.execute(query.order_by(EvidenceTimeline.event_date.asc()))
        return list(result.scalars().all())

    async def update_review_status(
        self,
        doc: Document,
        status: str,
        performed_by: UUID,
        ip: str | None = None,
        ua: str | None = None,
    ) -> Document:
        doc.review_status = DocumentReviewStatusEnum[status]
        doc.updated_at = datetime.now(timezone.utc)
        await self.audit.log(
            "document.review", "documents", doc.id, performed_by, ip, ua,
            new_values={"status": status},
        )
        return doc

    async def get_presigned_upload(
        self, user_id: UUID, filename: str, mime_type: str, size: int
    ) -> dict:
        return await self.storage.presigned_upload(user_id, filename, mime_type, size)

    async def process_document_pipeline(
        self, doc: Document, performed_by: UUID, ip: str | None = None, ua: str | None = None
    ) -> dict:
        ocr_row = await self.run_ocr(doc, performed_by, ip, ua)
        analysis = await self.run_analysis(doc, ocr_row.raw_text, performed_by, ip, ua)
        timelines = await self.generate_evidence_timeline(
            doc, ocr_row.raw_text or "", performed_by, ip, ua
        )
        doc.review_status = DocumentReviewStatusEnum.IN_REVIEW

        chunks_indexed = 0
        try:
            from app.services.embedding_service import EmbeddingService

            emb_svc = EmbeddingService(self.db)
            chunks_indexed = await emb_svc.index_document(
                doc.id, ocr_row.raw_text or "", performed_by
            )
            if analysis.summary_text:
                await emb_svc.index_summary(doc.id, analysis.summary_text, performed_by)
        except Exception:
            pass

        return {
            "ocr": ocr_row,
            "analysis": analysis,
            "timelines": timelines,
            "chunksIndexed": chunks_indexed,
        }
