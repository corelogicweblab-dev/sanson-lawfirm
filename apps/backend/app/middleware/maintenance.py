from typing import Callable

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

MAINTENANCE_PATHS = {"/api/v1/health", "/api/v1/system"}


class MaintenanceModeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable):
        if any(request.url.path.startswith(p) for p in MAINTENANCE_PATHS):
            return await call_next(request)

        settings = getattr(request.app.state, "system_settings", None) or {}
        maintenance = settings.get("maintenance_mode", {})
        if maintenance.get("enabled"):
            return JSONResponse(
                status_code=503,
                content={
                    "success": False,
                    "message": maintenance.get("message", "System under maintenance"),
                    "data": None,
                },
            )
        lockout = settings.get("emergency_lockout", {})
        if lockout.get("enabled") and not request.url.path.startswith("/api/v1/auth"):
            return JSONResponse(
                status_code=503,
                content={
                    "success": False,
                    "message": lockout.get("reason") or "Platform temporarily locked",
                    "data": None,
                },
            )
        return await call_next(request)
