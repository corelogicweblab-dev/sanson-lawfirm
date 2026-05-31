from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.documents import Document, DocumentAnalysis, EvidenceItem, EvidenceTimeline
from app.models.knowledge import KnowledgeArticle, KnowledgeStatusEnum
from app.models.legal import Case, LegalRequest
from app.services.audit_service import AuditService
from app.services.search_service import SearchService


class ContextEngine:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.search = SearchService(db)
        self.audit = AuditService(db)

    async def build_case_context(self, case_id: UUID, user_id: UUID) -> dict:
        case_r = await self.db.execute(select(Case).where(Case.id == case_id))
        case = case_r.scalar_one_or_none()
        if not case:
            return {"error": "Case not found"}

        docs = await self.db.execute(
            select(Document).where(Document.case_id == case_id, Document.deleted_at.is_(None)).limit(10)
        )
        documents = list(docs.scalars().all())

        evidence = await self.db.execute(
            select(EvidenceItem).where(EvidenceItem.case_id == case_id, EvidenceItem.deleted_at.is_(None)).limit(10)
        )
        evidence_items = list(evidence.scalars().all())

        timelines = await self.db.execute(
            select(EvidenceTimeline).where(EvidenceTimeline.case_id == case_id).order_by(EvidenceTimeline.event_date)
        )
        timeline_events = list(timelines.scalars().all())

        related = await self.search.semantic_search(
            user_id, f"{case.title} {case.description or ''}", limit=5
        )

        context = {
            "case": {
                "id": str(case.id),
                "caseNumber": case.case_number,
                "title": case.title,
                "description": case.description,
                "category": case.case_category.value,
            },
            "documents": [
                {"id": str(d.id), "fileName": d.file_name, "reviewStatus": d.review_status.value}
                for d in documents
            ],
            "evidence": [{"id": str(e.id), "title": e.title, "type": e.evidence_type.value} for e in evidence_items],
            "timeline": [
                {
                    "date": t.event_date.isoformat(),
                    "title": t.event_title,
                    "description": t.event_description,
                }
                for t in timeline_events
            ],
            "relatedSearchResults": related,
            "knowledgeSuggestions": await self._knowledge_for_query(case.title),
        }

        await self.audit.log("context.case_generated", "cases", case_id, user_id)
        return context

    async def build_evidence_context(self, evidence_id: UUID, user_id: UUID) -> dict:
        ev_r = await self.db.execute(
            select(EvidenceItem).where(EvidenceItem.id == evidence_id, EvidenceItem.deleted_at.is_(None))
        )
        ev = ev_r.scalar_one_or_none()
        if not ev:
            return {"error": "Evidence not found"}
        related = await self.search.semantic_search(user_id, f"{ev.title} {ev.description or ''}", limit=5)
        ctx = {
            "evidence": {
                "id": str(ev.id),
                "title": ev.title,
                "type": ev.evidence_type.value,
                "description": ev.description,
            },
            "relatedSearchResults": related,
            "knowledgeSuggestions": await self._knowledge_for_query(ev.title),
        }
        await self.audit.log("context.evidence_generated", "evidence", evidence_id, user_id)
        return ctx

    async def build_timeline_context(self, case_id: UUID, user_id: UUID) -> dict:
        timelines = await self.db.execute(
            select(EvidenceTimeline)
            .where(EvidenceTimeline.case_id == case_id)
            .order_by(EvidenceTimeline.event_date)
        )
        events = list(timelines.scalars().all())
        related = await self.search.semantic_search(user_id, "timeline events", limit=5)
        ctx = {
            "caseId": str(case_id),
            "timeline": [
                {
                    "date": t.event_date.isoformat(),
                    "title": t.event_title,
                    "description": t.event_description,
                }
                for t in events
            ],
            "relatedSearchResults": related,
        }
        await self.audit.log("context.timeline_generated", "evidence_timelines", case_id, user_id)
        return ctx

    async def build_knowledge_context(self, article_id: UUID, user_id: UUID) -> dict:
        art_r = await self.db.execute(
            select(KnowledgeArticle).where(
                KnowledgeArticle.id == article_id,
                KnowledgeArticle.deleted_at.is_(None),
            )
        )
        art = art_r.scalar_one_or_none()
        if not art:
            return {"error": "Article not found"}
        related = await self.search.semantic_search(user_id, art.title, limit=5)
        ctx = {
            "article": {
                "id": str(art.id),
                "title": art.title,
                "slug": art.slug,
                "summary": art.summary,
            },
            "relatedSearchResults": related,
        }
        await self.audit.log("context.knowledge_generated", "knowledge_articles", article_id, user_id)
        return ctx

    async def build_document_context(self, document_id: UUID, user_id: UUID) -> dict:
        doc_r = await self.db.execute(select(Document).where(Document.id == document_id))
        doc = doc_r.scalar_one_or_none()
        if not doc:
            return {"error": "Document not found"}

        analysis_r = await self.db.execute(
            select(DocumentAnalysis)
            .where(DocumentAnalysis.document_id == document_id)
            .order_by(DocumentAnalysis.generated_at.desc())
            .limit(1)
        )
        analysis = analysis_r.scalar_one_or_none()

        related = await self.search.semantic_search(user_id, doc.file_name, limit=5)

        await self.audit.log("context.document_generated", "documents", document_id, user_id)
        return {
            "document": {
                "id": str(doc.id),
                "fileName": doc.file_name,
                "mimeType": doc.mime_type,
                "reviewStatus": doc.review_status.value,
            },
            "analysis": {
                "summary": analysis.summary_text if analysis else None,
                "parties": analysis.parties if analysis else [],
                "findings": analysis.important_findings if analysis else [],
            },
            "relatedSearchResults": related,
            "knowledgeSuggestions": await self._knowledge_for_query(doc.file_name),
        }

    async def _knowledge_for_query(self, query: str) -> list[dict]:
        result = await self.db.execute(
            select(KnowledgeArticle)
            .where(
                KnowledgeArticle.deleted_at.is_(None),
                KnowledgeArticle.status == KnowledgeStatusEnum.PUBLISHED,
            )
            .limit(5)
        )
        return [
            {"title": a.title, "slug": a.slug, "summary": a.summary}
            for a in result.scalars().all()
        ]
