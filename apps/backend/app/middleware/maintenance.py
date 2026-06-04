import logging
from datetime import datetime, timezone
from typing import Callable

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

# Always reachable, even during maintenance / lockout:
# - health & system settings (so admin can lift maintenance)
# - auth (so admin / developer can always sign in and regain control)
ALWAYS_ALLOWED_PREFIXES = (
    "/api/v1/health",
    "/api/v1/system",
    "/api/v1/auth",
)


def _parse_dt(value: object) -> datetime | None:
    if not value or not isinstance(value, str):
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def _maintenance_active(maintenance: dict, now: datetime) -> bool:
    """Maintenance only blocks within its scheduled window; it auto-lifts after."""
    if not maintenance.get("enabled"):
        return False
    start = _parse_dt(maintenance.get("scheduled_start"))
    end = _parse_dt(maintenance.get("scheduled_end"))
    if start and now < start:
        return False  # scheduled, but not started yet
    if end and now > end:
        return False  # window already passed → automatically lifted
    return True


async def _request_is_admin(request: Request) -> bool:
    """Decode the bearer token and confirm the caller is an ADMIN.

    Admins / developers keep full control of the platform even during
    maintenance or lockout. Only evaluated when one of those modes is active,
    so it never adds overhead to normal traffic.
    """
    auth = request.headers.get("authorization") or request.headers.get("Authorization")
    if not auth or not auth.lower().startswith("bearer "):
        return False
    token = auth.split(" ", 1)[1].strip()
    if not token:
        return False
    try:
        from app.core.database import get_session_factory
        from app.core.firebase import is_firebase_configured, verify_firebase_token
        from app.services.auth_service import AuthService

        factory = get_session_factory()
        async with factory() as db:
            auth_service = AuthService(db)
            if is_firebase_configured():
                claims = verify_firebase_token(token)
                if not claims:
                    return False
                uid = claims.get("uid") or claims.get("sub")
                if not uid:
                    return False
                user = await auth_service.get_user_by_firebase_uid(uid)
            else:
                user = await auth_service.get_user_by_dev_token(token)
            if not user or not user.role:
                return False
            return user.role.name.value == "ADMIN"
    except Exception:  # pragma: no cover - defensive: never break the gate
        logger.exception("Maintenance admin bypass check failed")
        return False


class MaintenanceModeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable):
        path = request.url.path
        if any(path.startswith(p) for p in ALWAYS_ALLOWED_PREFIXES):
            return await call_next(request)

        settings = getattr(request.app.state, "system_settings", None) or {}
        maintenance = settings.get("maintenance_mode", {}) or {}
        lockout = settings.get("emergency_lockout", {}) or {}

        now = datetime.now(timezone.utc)
        maint_active = _maintenance_active(maintenance, now)
        lock_active = bool(lockout.get("enabled"))

        if not maint_active and not lock_active:
            return await call_next(request)

        # Admin / developer always retains access to run the system.
        if await _request_is_admin(request):
            return await call_next(request)

        if maint_active:
            return JSONResponse(
                status_code=503,
                content={
                    "success": False,
                    "message": maintenance.get("message") or "System under scheduled maintenance",
                    "data": {
                        "maintenance": True,
                        "scheduled_start": maintenance.get("scheduled_start"),
                        "scheduled_end": maintenance.get("scheduled_end"),
                    },
                },
            )

        return JSONResponse(
            status_code=503,
            content={
                "success": False,
                "message": lockout.get("reason") or "Platform temporarily locked",
                "data": None,
            },
        )
