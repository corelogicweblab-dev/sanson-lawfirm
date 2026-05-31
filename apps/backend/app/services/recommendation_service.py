from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.documents import Document, DocumentReviewStatusEnum
from app.models.legal import Case
from app.services.audit_service import AuditService
from app.services.context_engine import ContextEngine
from app.services.search_service import SearchService


class RecommendationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.search = SearchService(db)
        self.context = ContextEngine(db)
        self.audit = AuditService(db)

    async def get_for_user(self, user_id: UUID, role: str) -> dict:
        recommendations = []

        if role in ("LAWYER", "PARALEGAL", "ADMIN"):
            cases = await self.db.execute(
                select(Case).where(Case.deleted_at.is_(None)).order_by(Case.updated_at.desc()).limit(3)
            )
            for case in cases.scalars().all():
                related = await self.search.semantic_search(
                    user_id, case.title, limit=3
                )
                recommendations.append({
                    "type": "RELATED_TO_CASE",
                    "caseId": str(case.id),
                    "caseTitle": case.title,
                    "relatedDocuments": related,
                    "message": f"Related materials for {case.case_number}",
                })

            pending_docs = await self.db.execute(
                select(Document)
                .where(
                    Document.review_status == DocumentReviewStatusEnum.PENDING,
                    Document.deleted_at.is_(None),
                )
                .limit(5)
            )
            for doc in pending_docs.scalars().all():
                recommendations.append({
                    "type": "PENDING_REVIEW",
                    "documentId": str(doc.id),
                    "title": doc.file_name,
                    "message": "Document awaiting review",
                })

        await self.audit.log(
            "recommendation.generated", "recommendations", None, user_id,
            new_values={"count": len(recommendations)},
        )
        return {
            "recommendations": recommendations[:10],
            "recentSearches": [
                {"query": h.query_text, "mode": h.search_mode.value, "at": h.created_at.isoformat()}
                for h in await self.search.get_history(user_id, 5)
            ],
        }

    async def get_related_to_entity(
        self, user_id: UUID, entity_type: str, entity_id: UUID
    ) -> list[dict]:
        if entity_type == "case":
            ctx = await self.context.build_case_context(entity_id, user_id)
            return ctx.get("relatedSearchResults", [])
        if entity_type == "document":
            ctx = await self.context.build_document_context(entity_id, user_id)
            return ctx.get("relatedSearchResults", [])
        if entity_type == "evidence":
            ctx = await self.context.build_evidence_context(entity_id, user_id)
            return ctx.get("relatedSearchResults", [])
        if entity_type == "timeline":
            ctx = await self.context.build_timeline_context(entity_id, user_id)
            return ctx.get("relatedSearchResults", [])
        if entity_type == "knowledge":
            ctx = await self.context.build_knowledge_context(entity_id, user_id)
            return ctx.get("relatedSearchResults", [])
        query = f"{entity_type} {entity_id}"
        return await self.search.semantic_search(user_id, query, limit=8)
