from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_permission
from app.core.responses import success_response
from app.domain.authenticated_user import AuthenticatedUser
from app.services.security_service import SecurityService
from app.services.system_service import SystemService

router = APIRouter()


@router.get("/events")
async def list_security_events(
    _user: AuthenticatedUser = Depends(require_permission("security:read")),
    db: AsyncSession = Depends(get_db),
):
    svc = SecurityService(db)
    events = await svc.list_events(100)
    return success_response(
        [
            {
                "id": str(e.id),
                "eventType": e.event_type,
                "severity": e.severity.value,
                "description": e.description,
                "userId": str(e.user_id) if e.user_id else None,
                "createdAt": e.created_at.isoformat(),
            }
            for e in events
        ],
        "Security events",
    )


class LockoutRequest(BaseModel):
    enabled: bool
    reason: str | None = None


@router.post("/lockout")
async def emergency_lockout(
    body: LockoutRequest,
    request: Request,
    user: AuthenticatedUser = Depends(require_permission("security:write")),
    db: AsyncSession = Depends(get_db),
):
    payload = {"enabled": body.enabled, "reason": body.reason}
    sys = SystemService(db)
    await sys.update_setting("emergency_lockout", payload, user.id)
    cache = getattr(request.app.state, "system_settings", None)
    if cache is not None:
        cache["emergency_lockout"] = payload
    sec = SecurityService(db)
    await sec.record_event(
        "security.emergency_lockout",
        f"Emergency lockout {'enabled' if body.enabled else 'disabled'}",
        "CRITICAL" if body.enabled else "INFO",
        user.id,
        metadata={"reason": body.reason},
    )
    return success_response({"enabled": body.enabled}, "Lockout updated")
