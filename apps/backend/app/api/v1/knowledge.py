from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_client_ip, get_current_user, get_user_agent, require_permission
from app.core.responses import PaginationMeta, PaginationParams, success_response
from app.domain.authenticated_user import AuthenticatedUser
from app.schemas.knowledge import KnowledgeArticleCreate
from app.schemas.knowledge_mappers import to_knowledge_article, to_knowledge_category
from app.services.embedding_service import EmbeddingService
from app.services.knowledge_service import KnowledgeService

router = APIRouter()


@router.get("/categories")
async def list_categories(
    _user: AuthenticatedUser = Depends(require_permission("knowledge:read")),
    db: AsyncSession = Depends(get_db),
):
    svc = KnowledgeService(db)
    cats = await svc.list_categories()
    return success_response([to_knowledge_category(c) for c in cats], "Categories")


@router.get("/")
async def list_articles(
    pagination: PaginationParams = Depends(),
    status: str | None = "PUBLISHED",
    user: AuthenticatedUser = Depends(require_permission("knowledge:read")),
    db: AsyncSession = Depends(get_db),
):
    svc = KnowledgeService(db)
    articles, total = await svc.list_articles(pagination.offset, pagination.page_size, status)
    meta = PaginationMeta(
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
        total_pages=(total + pagination.page_size - 1) // pagination.page_size if pagination.page_size else 0,
    )
    return success_response(
        [to_knowledge_article(a) for a in articles], "Articles retrieved", meta=meta.model_dump()
    )


@router.get("/{slug}")
async def get_article(
    slug: str,
    user: AuthenticatedUser = Depends(require_permission("knowledge:read")),
    db: AsyncSession = Depends(get_db),
):
    svc = KnowledgeService(db)
    article = await svc.get_article(slug=slug)
    if not article:
        raise HTTPException(404, "Article not found")
    await svc.record_view(article, user.id)
    return success_response(to_knowledge_article(article), "Article retrieved")


@router.post("/")
async def create_article(
    body: KnowledgeArticleCreate,
    user: AuthenticatedUser = Depends(require_permission("knowledge:write")),
    db: AsyncSession = Depends(get_db),
    ip: str | None = Depends(get_client_ip),
    ua: str | None = Depends(get_user_agent),
):
    svc = KnowledgeService(db)
    article = await svc.create_article(
        title=body.title,
        content=body.content,
        author_id=user.id,
        category_id=UUID(body.category_id) if body.category_id else None,
        summary=body.summary,
        visibility=body.visibility,
        status=body.status,
        ip=ip,
        ua=ua,
    )
    return success_response(to_knowledge_article(article), "Article created")


@router.post("/{article_id}/index")
async def index_article(
    article_id: UUID,
    user: AuthenticatedUser = Depends(require_permission("embeddings:run")),
    db: AsyncSession = Depends(get_db),
):
    svc = KnowledgeService(db)
    article = await svc.get_article(article_id=article_id)
    if not article:
        raise HTTPException(404, "Article not found")
    emb = EmbeddingService(db)
    ok = await emb.index_knowledge_article(
        article.id, article.title, article.content, article.summary, user.id
    )
    return success_response({"indexed": ok}, "Knowledge article indexed")
