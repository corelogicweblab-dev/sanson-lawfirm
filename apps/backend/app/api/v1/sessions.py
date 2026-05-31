from uuid import UUID

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_client_ip, get_current_user, get_user_agent, require_permission
from app.core.responses import success_response
from app.domain.authenticated_user import AuthenticatedUser
from app.services.session_service import SessionService

router = APIRouter()


@router.get("/")
async def list_my_sessions(
    user: AuthenticatedUser = Depends(require_permission("sessions:read")),
    db: AsyncSession = Depends(get_db),
):
    svc = SessionService(db)
    sessions = await svc.list_active_sessions(user.id)
    return success_response(
        [
            {
                "id": str(s.id),
                "platform": s.platform,
                "lastActiveAt": s.last_active_at.isoformat(),
                "expiresAt": s.expires_at.isoformat() if s.expires_at else None,
                "status": s.status.value,
            }
            for s in sessions
        ],
        "Active sessions",
    )


@router.get("/all")
async def list_all_sessions(
    _user: AuthenticatedUser = Depends(require_permission("security:write")),
    db: AsyncSession = Depends(get_db),
):
    svc = SessionService(db)
    sessions = await svc.list_all_active()
    return success_response(
        [
            {
                "id": str(s.id),
                "userId": str(s.user_id),
                "platform": s.platform,
                "lastActiveAt": s.last_active_at.isoformat(),
            }
            for s in sessions
        ],
        "All active sessions",
    )


@router.delete("/{session_id}")
async def revoke_session(
    session_id: UUID,
    user: AuthenticatedUser = Depends(require_permission("sessions:write")),
    db: AsyncSession = Depends(get_db),
):
    svc = SessionService(db)
    own = await svc.revoke_session(session_id, user.id)
    if not own and user.has_permission("security:write"):
        own = await svc.revoke_session_by_id(session_id, "admin_revoke", user.id)
    return success_response({"revoked": own}, "Session revoked")


@router.post("/revoke-all")
async def revoke_all_my_sessions(
    request: Request,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    svc = SessionService(db)
    count = await svc.revoke_all_sessions(user.id, "user_initiated")
    return success_response({"count": count}, "All sessions revoked")
