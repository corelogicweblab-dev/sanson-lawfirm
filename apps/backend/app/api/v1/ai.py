from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import (
    get_client_ip,
    get_current_user,
    get_user_agent,
    require_permission,
)
from app.core.responses import success_response
from app.domain.authenticated_user import AuthenticatedUser
from app.schemas.ai_chat import AiAnalyzeRequest
from app.schemas.ai_mappers import (
    to_classification,
    to_intake_response,
    to_recommendation,
    to_summary,
)
from app.services.chat_service import ChatService

router = APIRouter()


@router.post("/classify")
async def classify_session(
    body: AiAnalyzeRequest,
    user: AuthenticatedUser = Depends(require_permission("ai:read")),
    db: AsyncSession = Depends(get_db),
    ip: str | None = Depends(get_client_ip),
    ua: str | None = Depends(get_user_agent),
):
    session_id = UUID(body.session_id)
    svc = ChatService(db)
    client_filter = user.id if user.has_role("CLIENT") else None
    try:
        row = await svc.run_classification(session_id, client_filter, user.id, ip, ua)
    except ValueError as exc:
        raise HTTPException(404, str(exc))
    return success_response(to_classification(row), "Classification generated")


@router.post("/summary")
async def generate_summary(
    body: AiAnalyzeRequest,
    user: AuthenticatedUser = Depends(require_permission("ai:read")),
    db: AsyncSession = Depends(get_db),
    ip: str | None = Depends(get_client_ip),
    ua: str | None = Depends(get_user_agent),
):
    session_id = UUID(body.session_id)
    svc = ChatService(db)
    client_filter = user.id if user.has_role("CLIENT") else None
    try:
        row = await svc.run_summary(session_id, client_filter, user.id, ip, ua)
    except ValueError as exc:
        raise HTTPException(404, str(exc))
    return success_response(to_summary(row), "Summary generated")


@router.post("/recommendation")
async def generate_recommendations(
    body: AiAnalyzeRequest,
    user: AuthenticatedUser = Depends(require_permission("ai:read")),
    db: AsyncSession = Depends(get_db),
    ip: str | None = Depends(get_client_ip),
    ua: str | None = Depends(get_user_agent),
):
    session_id = UUID(body.session_id)
    svc = ChatService(db)
    client_filter = user.id if user.has_role("CLIENT") else None
    try:
        rows = await svc.run_recommendations(
            session_id, client_filter, user.id, ip, ua
        )
    except ValueError as exc:
        raise HTTPException(404, str(exc))
    return success_response(
        [to_recommendation(r) for r in rows],
        "Recommendations generated",
    )


@router.post("/intake")
async def extract_intake(
    body: AiAnalyzeRequest,
    user: AuthenticatedUser = Depends(require_permission("ai:read")),
    db: AsyncSession = Depends(get_db),
):
    session_id = UUID(body.session_id)
    svc = ChatService(db)
    client_filter = user.id if user.has_role("CLIENT") else None
    try:
        rows = await svc.run_intake_extract(session_id, client_filter, user.id)
    except ValueError as exc:
        raise HTTPException(404, str(exc))
    return success_response(
        [to_intake_response(r) for r in rows],
        "Intake responses extracted",
    )
