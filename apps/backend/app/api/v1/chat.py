from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import (
    get_client_ip,
    get_current_user,
    get_user_agent,
    require_permission,
)
from app.core.responses import PaginationMeta, PaginationParams, success_response
from app.domain.authenticated_user import AuthenticatedUser
from app.schemas.ai_chat import ChatMessageCreate, SessionDecisionRequest
from app.schemas.ai_mappers import to_chat_message, to_chat_session
from app.services.chat_service import ChatService
from app.services.prompts import SUGGESTED_QUESTIONS

router = APIRouter()


def _chat_service(db: AsyncSession = Depends(get_db)) -> ChatService:
    return ChatService(db)


@router.post("/session")
async def create_session(
    user: AuthenticatedUser = Depends(require_permission("chat:create")),
    db: AsyncSession = Depends(get_db),
    ip: str | None = Depends(get_client_ip),
    ua: str | None = Depends(get_user_agent),
):
    if not user.has_role("CLIENT"):
        raise HTTPException(403, "Only clients can start AI assistant sessions")
    svc = ChatService(db)
    session = await svc.create_session(user.id, ip, ua)
    return success_response(to_chat_session(session), "Chat session started")


@router.get("/session")
async def list_sessions(
    pagination: PaginationParams = Depends(),
    user: AuthenticatedUser = Depends(require_permission("chat:read")),
    db: AsyncSession = Depends(get_db),
):
    svc = ChatService(db)
    if user.has_role("CLIENT"):
        sessions, total = await svc.list_sessions(
            user.id, pagination.offset, pagination.page_size
        )
    else:
        raise HTTPException(403, "Staff session list available via admin tools in a future release")
    meta = PaginationMeta(
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
        total_pages=(total + pagination.page_size - 1) // pagination.page_size
        if pagination.page_size
        else 0,
    ).model_dump()
    return success_response(
        [to_chat_session(s) for s in sessions],
        "Sessions retrieved",
        meta=meta,
    )


@router.get("/session/{session_id}")
async def get_session(
    session_id: UUID,
    user: AuthenticatedUser = Depends(require_permission("chat:read")),
    db: AsyncSession = Depends(get_db),
):
    svc = ChatService(db)
    client_id = user.id if user.has_role("CLIENT") else None
    session = await svc.get_session(session_id, client_id)
    if not session:
        raise HTTPException(404, "Session not found")
    return success_response(to_chat_session(session))


@router.get("/history")
async def chat_history(
    session_id: UUID = Query(...),
    user: AuthenticatedUser = Depends(require_permission("chat:read")),
    db: AsyncSession = Depends(get_db),
):
    svc = ChatService(db)
    client_id = user.id if user.has_role("CLIENT") else None
    session = await svc.get_session(session_id, client_id)
    if not session:
        raise HTTPException(404, "Session not found")
    messages = await svc.get_messages(session_id)
    return success_response(
        [to_chat_message(m) for m in messages],
        "Chat history retrieved",
    )


@router.get("/session/{session_id}/insights")
async def session_insights(
    session_id: UUID,
    user: AuthenticatedUser = Depends(require_permission("ai:read")),
    db: AsyncSession = Depends(get_db),
):
    svc = ChatService(db)
    client_id = user.id if user.has_role("CLIENT") else None
    filter_client = user.id if user.has_role("CLIENT") else None
    try:
        data = await svc.get_session_insights(session_id, filter_client)
    except ValueError:
        raise HTTPException(404, "Session not found")
    return success_response(data, "Session insights retrieved")


@router.post("/session/{session_id}/messages")
async def send_message(
    session_id: UUID,
    body: ChatMessageCreate,
    stream: bool = Query(False),
    user: AuthenticatedUser = Depends(require_permission("chat:write")),
    db: AsyncSession = Depends(get_db),
    ip: str | None = Depends(get_client_ip),
    ua: str | None = Depends(get_user_agent),
):
    if not user.has_role("CLIENT"):
        raise HTTPException(403, "Only clients can send chat messages")
    svc = ChatService(db)

    if stream:
        async def event_stream():
            async for chunk in svc.stream_message(session_id, user.id, body.message):
                yield chunk

        return StreamingResponse(
            event_stream(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    try:
        user_msg, ai_msg = await svc.send_message(
            session_id, user.id, body.message, ip, ua
        )
    except ValueError as exc:
        raise HTTPException(400, str(exc))

    return success_response(
        {
            "userMessage": to_chat_message(user_msg),
            "aiMessage": to_chat_message(ai_msg),
        },
        "Message sent",
    )


@router.post("/session/{session_id}/decision")
async def session_decision(
    session_id: UUID,
    body: SessionDecisionRequest,
    user: AuthenticatedUser = Depends(require_permission("chat:write")),
    db: AsyncSession = Depends(get_db),
    ip: str | None = Depends(get_client_ip),
    ua: str | None = Depends(get_user_agent),
):
    if not user.has_role("CLIENT"):
        raise HTTPException(403, "Only clients can submit session decisions")
    svc = ChatService(db)
    try:
        result = await svc.apply_decision(
            session_id, user.id, body.decision, user.id, ip, ua
        )
    except ValueError as exc:
        raise HTTPException(400, str(exc))
    except KeyError:
        raise HTTPException(400, "Invalid decision")

    return success_response(result, "Decision recorded")


@router.get("/suggested-questions")
async def suggested_questions(
    _user: AuthenticatedUser = Depends(require_permission("chat:read")),
):
    return success_response(SUGGESTED_QUESTIONS, "Suggested questions")
