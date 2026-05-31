import time
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.documents import Document, EvidenceItem
from app.models.knowledge import (
    COLLECTIONS,
    SearchHistory,
    SearchModeEnum,
    SearchQuery,
    KnowledgeArticle,
    KnowledgeStatusEnum,
)
from app.models.legal import Case
from app.models.documents import DocumentReviewStatusEnum
from app.services.audit_service import AuditService
from app.services.embedding_service import EmbeddingService
from app.services.qdrant_service import QdrantService


class SearchService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.settings = get_settings()
        self.qdrant = QdrantService()
        self.embeddings = EmbeddingService(db)
        self.audit = AuditService(db)
        self._cache: dict[str, tuple[float, list]] = {}

    async def _query_vector(self, query: str) -> list[float]:
        return (await self.embeddings._embed_texts([query]))[0]

    def _rank_score(self, similarity: float, result_type: str) -> float:
        weights = {
            "case": 1.1,
            "document": 1.0,
            "evidence": 0.95,
            "summary": 0.9,
            "knowledge": 0.85,
        }
        return min(100.0, similarity * 100 * weights.get(result_type, 1.0))

    def _hit_to_result(self, collection: str, hit) -> dict:
        payload = hit.payload or {}
        rtype = payload.get("type", "document")
        title = (
            payload.get("title")
            or payload.get("file_name")
            or payload.get("case_number")
            or "Result"
        )
        summary = payload.get("chunk_text") or payload.get("summary") or ""
        source_id = (
            payload.get("document_id")
            or payload.get("case_id")
            or payload.get("evidence_id")
            or payload.get("article_id")
        )
        sim = hit.score if hit.score is not None else 0.0
        return {
            "title": title,
            "type": rtype,
            "relevanceScore": round(sim, 4),
            "rankingScore": round(self._rank_score(sim, rtype), 2),
            "confidenceScore": round(min(99.0, sim * 100 + 10), 2),
            "summary": summary[:400],
            "source": collection,
            "sourceId": source_id,
            "date": payload.get("created_at"),
            "openAction": self._open_action(rtype, source_id),
        }

    def _open_action(self, rtype: str, source_id: str | None, slug: str | None = None) -> str | None:
        if not source_id and not slug:
            return None
        actions = {
            "document": "/dashboard/lawyer/documents",
            "case": "/dashboard/lawyer/cases",
            "evidence": "/dashboard/lawyer/evidence",
            "knowledge": (
                f"/dashboard/lawyer/knowledge/article?slug={slug}"
                if slug
                else "/dashboard/lawyer/knowledge"
            ),
            "summary": "/dashboard/lawyer/documents",
            "activity": "/dashboard/lawyer/cases",
            "timeline": "/dashboard/lawyer/evidence",
        }
        return actions.get(rtype)

    def _metadata_types(self, filters: dict | None) -> set[str] | None:
        if not filters:
            return None
        raw = filters.get("types") or filters.get("type")
        if not raw:
            return None
        if isinstance(raw, str):
            return {raw}
        return set(raw)

    def _apply_filters(self, results: list[dict], filters: dict | None) -> list[dict]:
        if not filters:
            return results
        types = filters.get("types") or filters.get("type")
        if types:
            allowed = {types} if isinstance(types, str) else set(types)
            results = [r for r in results if r.get("type") in allowed]
        return results

    def _cache_get(self, key: str) -> list[dict] | None:
        entry = self._cache.get(key)
        if not entry:
            return None
        expires, data = entry
        if time.time() > expires:
            del self._cache[key]
            return None
        return data

    def _cache_set(self, key: str, data: list[dict], ttl: int = 120) -> None:
        self._cache[key] = (time.time() + ttl, data)

    async def semantic_search(
        self,
        user_id: UUID,
        query: str,
        limit: int | None = None,
        filters: dict | None = None,
        ip: str | None = None,
        ua: str | None = None,
    ) -> list[dict]:
        limit = limit or self.settings.search_default_limit
        start = time.perf_counter()

        if not self.qdrant.configured:
            return await self.keyword_search(user_id, query, limit, filters, ip, ua)

        cache_key = f"sem:{user_id}:{query}:{limit}:{filters}"
        cached = self._cache_get(cache_key)
        if cached is not None:
            return cached

        vector = await self._query_vector(query)
        collections = list(COLLECTIONS.values())
        hits = self.qdrant.search_multi(collections, vector, limit_per_collection=max(3, limit // 3))

        results = []
        for coll, hit in hits:
            results.append(self._hit_to_result(coll, hit))

        results.sort(key=lambda x: x["rankingScore"], reverse=True)
        results = self._apply_filters(results, filters)[:limit]

        duration = int((time.perf_counter() - start) * 1000)
        await self._log_search(user_id, query, SearchModeEnum.SEMANTIC, filters, len(results), duration, results)
        self._cache_set(cache_key, results)
        return results

    async def keyword_search(
        self,
        user_id: UUID,
        query: str,
        limit: int | None = None,
        filters: dict | None = None,
        ip: str | None = None,
        ua: str | None = None,
    ) -> list[dict]:
        limit = limit or self.settings.search_default_limit
        start = time.perf_counter()
        pattern = f"%{query}%"
        results: list[dict] = []

        doc_q = select(Document).where(
            Document.deleted_at.is_(None),
            or_(
                Document.file_name.ilike(pattern),
                Document.original_file_name.ilike(pattern),
            ),
        ).limit(limit)
        for doc in (await self.db.execute(doc_q)).scalars().all():
            results.append({
                "title": doc.file_name,
                "type": "document",
                "relevanceScore": 0.7,
                "rankingScore": 70.0,
                "confidenceScore": 75.0,
                "summary": doc.mime_type,
                "source": "postgres",
                "sourceId": str(doc.id),
                "date": doc.created_at.isoformat(),
                "openAction": "/dashboard/client/documents",
            })

        case_q = select(Case).where(
            Case.deleted_at.is_(None),
            or_(Case.title.ilike(pattern), Case.case_number.ilike(pattern)),
        ).limit(limit)
        for case in (await self.db.execute(case_q)).scalars().all():
            results.append({
                "title": case.title,
                "type": "case",
                "relevanceScore": 0.75,
                "rankingScore": 75.0,
                "confidenceScore": 80.0,
                "summary": case.case_number,
                "source": "postgres",
                "sourceId": str(case.id),
                "date": case.created_at.isoformat() if case.created_at else None,
                "openAction": "/dashboard/lawyer/cases",
            })

        ev_q = select(EvidenceItem).where(
            EvidenceItem.deleted_at.is_(None),
            or_(EvidenceItem.title.ilike(pattern), EvidenceItem.description.ilike(pattern)),
        ).limit(limit)
        for ev in (await self.db.execute(ev_q)).scalars().all():
            results.append({
                "title": ev.title,
                "type": "evidence",
                "relevanceScore": 0.65,
                "rankingScore": 65.0,
                "confidenceScore": 70.0,
                "summary": ev.description or "",
                "source": "postgres",
                "sourceId": str(ev.id),
                "date": ev.created_at.isoformat(),
                "openAction": "/dashboard/lawyer/evidence",
            })

        kb_q = select(KnowledgeArticle).where(
            KnowledgeArticle.deleted_at.is_(None),
            KnowledgeArticle.status == KnowledgeStatusEnum.PUBLISHED,
            or_(
                KnowledgeArticle.title.ilike(pattern),
                KnowledgeArticle.content.ilike(pattern),
            ),
        ).limit(limit)
        for art in (await self.db.execute(kb_q)).scalars().all():
            results.append({
                "title": art.title,
                "type": "knowledge",
                "relevanceScore": 0.6,
                "rankingScore": 60.0,
                "confidenceScore": 65.0,
                "summary": (art.summary or "")[:400],
                "source": "postgres",
                "sourceId": str(art.id),
                "date": art.created_at.isoformat(),
                "openAction": f"/dashboard/lawyer/knowledge/article?slug={art.slug}",
            })

        results = self._apply_filters(results, filters)[:limit]
        duration = int((time.perf_counter() - start) * 1000)
        await self._log_search(user_id, query, SearchModeEnum.KEYWORD, filters, len(results), duration, results)
        return results

    async def hybrid_search(
        self,
        user_id: UUID,
        query: str,
        limit: int | None = None,
        filters: dict | None = None,
        ip: str | None = None,
        ua: str | None = None,
    ) -> list[dict]:
        limit = limit or self.settings.search_default_limit
        sem = await self.semantic_search(user_id, query, limit, filters) if self.qdrant.configured else []
        key = await self.keyword_search(user_id, query, limit, filters)
        seen = set()
        merged = []
        for r in sem + key:
            key_id = f"{r['type']}:{r.get('sourceId')}"
            if key_id in seen:
                continue
            seen.add(key_id)
            merged.append(r)
        merged.sort(key=lambda x: x["rankingScore"], reverse=True)
        merged = merged[:limit]
        await self.audit.log(
            "search.performed", "search_queries", None, user_id, ip, ua,
            new_values={"mode": "HYBRID", "query": query[:200], "count": len(merged)},
        )
        return merged

    async def metadata_search(
        self,
        user_id: UUID,
        query: str,
        limit: int | None = None,
        filters: dict | None = None,
        ip: str | None = None,
        ua: str | None = None,
    ) -> list[dict]:
        """Filter-first search by case number, file name, evidence title, status."""
        limit = limit or self.settings.search_default_limit
        start = time.perf_counter()
        pattern = f"%{query.strip()}%"
        results: list[dict] = []

        type_filter = self._metadata_types(filters)
        if type_filter is None or "case" in type_filter:
            case_q = select(Case).where(
                Case.deleted_at.is_(None),
                or_(Case.case_number.ilike(pattern), Case.title.ilike(pattern)),
            ).limit(limit)
            for case in (await self.db.execute(case_q)).scalars().all():
                results.append({
                    "title": f"{case.case_number} — {case.title}",
                    "type": "case",
                    "relevanceScore": 0.9,
                    "rankingScore": 90.0,
                    "confidenceScore": 92.0,
                    "summary": case.case_category.value if case.case_category else "",
                    "source": "metadata",
                    "sourceId": str(case.id),
                    "date": case.created_at.isoformat() if case.created_at else None,
                    "openAction": "/dashboard/lawyer/cases",
                })

        if type_filter is None or "document" in type_filter:
            doc_q = select(Document).where(
                Document.deleted_at.is_(None),
                or_(
                    Document.file_name.ilike(pattern),
                    Document.original_file_name.ilike(pattern),
                ),
            ).limit(limit)
            for doc in (await self.db.execute(doc_q)).scalars().all():
                results.append({
                    "title": doc.file_name,
                    "type": "document",
                    "relevanceScore": 0.85,
                    "rankingScore": 85.0,
                    "confidenceScore": 88.0,
                    "summary": f"Status: {doc.review_status.value}",
                    "source": "metadata",
                    "sourceId": str(doc.id),
                    "date": doc.created_at.isoformat(),
                    "openAction": "/dashboard/lawyer/documents",
                })

        results = self._apply_filters(results, filters)[:limit]
        duration = int((time.perf_counter() - start) * 1000)
        await self._log_search(user_id, query, SearchModeEnum.METADATA, filters, len(results), duration, results)
        return results

    async def _log_search(
        self,
        user_id: UUID,
        query: str,
        mode: SearchModeEnum,
        filters: dict | None,
        count: int,
        duration_ms: int,
        results: list[dict],
    ) -> None:
        row = SearchQuery(
            user_id=user_id,
            query_text=query,
            search_mode=mode,
            filters=filters or {},
            result_count=count,
            duration_ms=duration_ms,
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(row)
        if results:
            top = results[0]
            hist = SearchHistory(
                user_id=user_id,
                query_text=query,
                search_mode=mode,
                top_result_type=top.get("type"),
                top_result_id=UUID(top["sourceId"]) if top.get("sourceId") else None,
                created_at=datetime.now(timezone.utc),
            )
            self.db.add(hist)
        await self.db.flush()
        await self.audit.log(
            "search.performed", "search_queries", row.id, user_id,
            new_values={"mode": mode.value, "count": count},
        )

    async def get_history(self, user_id: UUID, limit: int = 20) -> list[SearchHistory]:
        result = await self.db.execute(
            select(SearchHistory)
            .where(SearchHistory.user_id == user_id)
            .order_by(SearchHistory.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_analytics(self) -> dict:
        from app.models import AuditLog
        from app.models.knowledge import DocumentEmbedding, CaseEmbedding, EvidenceEmbedding

        total = (await self.db.execute(select(func.count(SearchQuery.id)))).scalar() or 0
        popular = await self.db.execute(
            select(SearchHistory.query_text, func.count(SearchHistory.id).label("cnt"))
            .group_by(SearchHistory.query_text)
            .order_by(func.count(SearchHistory.id).desc())
            .limit(10)
        )
        popular_list = [{"query": r[0], "count": r[1]} for r in popular.all()]

        doc_emb = (await self.db.execute(select(func.count(DocumentEmbedding.id)))).scalar() or 0
        case_emb = (await self.db.execute(select(func.count(CaseEmbedding.id)))).scalar() or 0
        ev_emb = (await self.db.execute(select(func.count(EvidenceEmbedding.id)))).scalar() or 0
        kb_views = (
            await self.db.execute(
                select(func.count(AuditLog.id)).where(AuditLog.action == "knowledge.viewed")
            )
        ).scalar() or 0
        ai_events = (
            await self.db.execute(
                select(func.count(AuditLog.id)).where(
                    AuditLog.action.in_(
                        [
                            "search.performed",
                            "recommendation.generated",
                            "context.case_generated",
                            "embedding.document_indexed",
                        ]
                    )
                )
            )
        ).scalar() or 0

        return {
            "total_searches": total,
            "popular_searches": popular_list,
            "qdrant_configured": self.qdrant.configured,
            "openai_configured": self.settings.openai_configured,
            "embedding_statistics": {
                "documents": doc_emb,
                "cases": case_emb,
                "evidence": ev_emb,
                "total": doc_emb + case_emb + ev_emb,
            },
            "knowledge_usage": {"article_views": kb_views},
            "ai_usage_metrics": {"intelligence_events": ai_events},
        }
