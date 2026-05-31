import time
from datetime import datetime, timezone
from typing import Callable

import structlog
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = structlog.get_logger()


class RequestMetricsMiddleware(BaseHTTPMiddleware):
    """Structured request logging + optional DB metric persistence."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start = time.perf_counter()
        cid = getattr(request.state, "correlation_id", None)
        response = await call_next(request)
        duration_ms = int((time.perf_counter() - start) * 1000)

        logger.info(
            "http_request",
            method=request.method,
            path=request.url.path,
            status=response.status_code,
            duration_ms=duration_ms,
            correlation_id=cid,
        )

        if hasattr(request.app.state, "record_metric"):
            await request.app.state.record_metric(
                route=request.url.path[:200],
                method=request.method,
                status_code=response.status_code,
                duration_ms=duration_ms,
                correlation_id=cid,
            )
        return response
