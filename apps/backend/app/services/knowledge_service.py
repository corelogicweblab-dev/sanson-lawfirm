import re
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.knowledge import (
    KnowledgeArticle,
    KnowledgeCategory,
    KnowledgeStatusEnum,
    KnowledgeVisibilityEnum,
)
from app.services.audit_service import AuditService
from app.services.embedding_service import EmbeddingService


def slugify(title: str) -> str:
    s = re.sub(r"[^\w\s-]", "", title.lower())
    return re.sub(r"[-\s]+", "-", s).strip("-")[:200]


class KnowledgeService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.audit = AuditService(db)
        self.embeddings = EmbeddingService(db)

    async def list_categories(self) -> list[KnowledgeCategory]:
        result = await self.db.execute(
            select(KnowledgeCategory)
            .where(KnowledgeCategory.deleted_at.is_(None))
            .order_by(KnowledgeCategory.sort_order)
        )
        return list(result.scalars().all())

    async def list_articles(
        self,
        offset: int,
        limit: int,
        status: str | None = "PUBLISHED",
        category_id: UUID | None = None,
    ) -> tuple[list[KnowledgeArticle], int]:
        query = select(KnowledgeArticle).where(KnowledgeArticle.deleted_at.is_(None))
        count_q = select(func.count(KnowledgeArticle.id)).where(KnowledgeArticle.deleted_at.is_(None))
        if status:
            query = query.where(KnowledgeArticle.status == KnowledgeStatusEnum[status])
            count_q = count_q.where(KnowledgeArticle.status == KnowledgeStatusEnum[status])
        if category_id:
            query = query.where(KnowledgeArticle.category_id == category_id)
            count_q = count_q.where(KnowledgeArticle.category_id == category_id)
        total = (await self.db.execute(count_q)).scalar() or 0
        result = await self.db.execute(
            query.options(selectinload(KnowledgeArticle.category))
            .order_by(KnowledgeArticle.updated_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all()), total

    async def get_article(self, article_id: UUID | None = None, slug: str | None = None) -> KnowledgeArticle | None:
        query = select(KnowledgeArticle).where(KnowledgeArticle.deleted_at.is_(None))
        if article_id:
            query = query.where(KnowledgeArticle.id == article_id)
        elif slug:
            query = query.where(KnowledgeArticle.slug == slug)
        else:
            return None
        result = await self.db.execute(query.options(selectinload(KnowledgeArticle.category)))
        return result.scalar_one_or_none()

    async def create_article(
        self,
        title: str,
        content: str,
        author_id: UUID,
        category_id: UUID | None = None,
        summary: str | None = None,
        visibility: str = "STAFF",
        status: str = "DRAFT",
        ip: str | None = None,
        ua: str | None = None,
    ) -> KnowledgeArticle:
        base_slug = slugify(title)
        slug = base_slug
        n = 1
        while await self.get_article(slug=slug):
            slug = f"{base_slug}-{n}"
            n += 1

        article = KnowledgeArticle(
            title=title,
            slug=slug,
            category_id=category_id,
            content=content,
            summary=summary,
            author_id=author_id,
            visibility=KnowledgeVisibilityEnum[visibility],
            status=KnowledgeStatusEnum[status],
        )
        self.db.add(article)
        await self.db.flush()

        if status == "PUBLISHED":
            await self.embeddings.index_knowledge_article(
                article.id, title, content, summary, author_id
            )

        await self.audit.log("knowledge.created", "knowledge_articles", article.id, author_id, ip, ua)
        return article

    async def record_view(self, article: KnowledgeArticle, user_id: UUID) -> None:
        await self.audit.log("knowledge.viewed", "knowledge_articles", article.id, user_id)
