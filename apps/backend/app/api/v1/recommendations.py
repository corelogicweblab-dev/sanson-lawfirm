from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_permission
from app.core.responses import success_response
from app.domain.authenticated_user import AuthenticatedUser
from app.schemas.knowledge import ContextRequest
from app.services.context_engine import ContextEngine
from app.services.recommendation_service import RecommendationService

router = APIRouter()


@router.get("/")
async def get_recommendations(
    user: AuthenticatedUser = Depends(require_permission("recommendations:read")),
    db: AsyncSession = Depends(get_db),
):
    svc = RecommendationService(db)
    data = await svc.get_for_user(user.id, user.role_name)
    return success_response(data, "Recommendations")


@router.get("/related")
async def get_related(
    entity_type: str = Query(...),
    entity_id: UUID = Query(...),
    user: AuthenticatedUser = Depends(require_permission("recommendations:read")),
    db: AsyncSession = Depends(get_db),
):
    svc = RecommendationService(db)
    results = await svc.get_related_to_entity(user.id, entity_type, entity_id)
    return success_response(results, "Related results")


@router.post("/context")
async def generate_context(
    body: ContextRequest,
    user: AuthenticatedUser = Depends(require_permission("context:read")),
    db: AsyncSession = Depends(get_db),
):
    engine = ContextEngine(db)
    eid = UUID(body.entity_id)
    builders = {
        "case": engine.build_case_context,
        "document": engine.build_document_context,
        "evidence": engine.build_evidence_context,
        "timeline": engine.build_timeline_context,
        "knowledge": engine.build_knowledge_context,
    }
    builder = builders.get(body.entity_type)
    if not builder:
        return success_response({"error": "Invalid entity type"}, "Failed")
    ctx = await builder(eid, user.id)
    return success_response(ctx, "Context generated")
