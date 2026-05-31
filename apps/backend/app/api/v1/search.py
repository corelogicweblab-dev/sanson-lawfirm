from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_client_ip, get_current_user, get_user_agent, require_permission
from app.core.responses import success_response
from app.domain.authenticated_user import AuthenticatedUser
from app.schemas.knowledge import SearchRequest
from app.schemas.knowledge_mappers import to_search_history
from app.services.search_service import SearchService

router = APIRouter()


@router.post("/")
async def search(
    body: SearchRequest,
    user: AuthenticatedUser = Depends(require_permission("search:read")),
    db: AsyncSession = Depends(get_db),
    ip: str | None = Depends(get_client_ip),
    ua: str | None = Depends(get_user_agent),
):
    svc = SearchService(db)
    if body.mode == "SEMANTIC":
        results = await svc.semantic_search(user.id, body.query, body.limit, body.filters, ip, ua)
    elif body.mode == "KEYWORD":
        results = await svc.keyword_search(user.id, body.query, body.limit, body.filters, ip, ua)
    elif body.mode == "METADATA":
        results = await svc.metadata_search(user.id, body.query, body.limit, body.filters, ip, ua)
    else:
        results = await svc.hybrid_search(user.id, body.query, body.limit, body.filters, ip, ua)
    return success_response(results, f"Found {len(results)} results")


@router.post("/semantic")
async def semantic_search(
    body: SearchRequest,
    user: AuthenticatedUser = Depends(require_permission("search:read")),
    db: AsyncSession = Depends(get_db),
    ip: str | None = Depends(get_client_ip),
    ua: str | None = Depends(get_user_agent),
):
    svc = SearchService(db)
    results = await svc.semantic_search(user.id, body.query, body.limit, body.filters, ip, ua)
    return success_response(results, "Semantic search complete")


@router.post("/keyword")
async def keyword_search(
    body: SearchRequest,
    user: AuthenticatedUser = Depends(require_permission("search:read")),
    db: AsyncSession = Depends(get_db),
    ip: str | None = Depends(get_client_ip),
    ua: str | None = Depends(get_user_agent),
):
    svc = SearchService(db)
    results = await svc.keyword_search(user.id, body.query, body.limit, body.filters, ip, ua)
    return success_response(results, "Keyword search complete")


@router.get("/history")
async def search_history(
    limit: int = Query(20, ge=1, le=50),
    user: AuthenticatedUser = Depends(require_permission("search:read")),
    db: AsyncSession = Depends(get_db),
):
    svc = SearchService(db)
    rows = await svc.get_history(user.id, limit)
    return success_response([to_search_history(h) for h in rows], "Search history")


@router.get("/analytics")
async def search_analytics(
    _user: AuthenticatedUser = Depends(require_permission("search:admin")),
    db: AsyncSession = Depends(get_db),
):
    svc = SearchService(db)
    return success_response(await svc.get_analytics(), "Search analytics")
