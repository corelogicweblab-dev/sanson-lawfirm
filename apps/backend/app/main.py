import os
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.static_web import mount_static_web
from app.middleware.correlation import CorrelationMiddleware
from app.middleware.maintenance import MaintenanceModeMiddleware
from app.middleware.metrics import RequestMetricsMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ]
)

settings = get_settings()
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{settings.rate_limit_per_minute}/minute"],
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    port = os.environ.get("PORT", "8100")
    log = structlog.get_logger()
    db_issues = settings.database_url_issues()
    if db_issues:
        log.error("database_url_invalid", issues=db_issues)
    else:
        from app.core.database import check_database_connection, get_session_factory

        db_ok = await check_database_connection()
        log.info("database_startup_check", connected=db_ok)
        if db_ok:
            from app.services.system_service import SystemService

            async with get_session_factory()() as db:
                sys = SystemService(db)
                app.state.system_settings = await sys.load_settings_cache()
                await db.commit()

            async def record_metric(route, method, status_code, duration_ms, correlation_id):
                async with get_session_factory()() as db:
                    sys = SystemService(db)
                    await sys.record_metric(
                        route, method, status_code, duration_ms, correlation_id
                    )
                    await db.commit()

            app.state.record_metric = record_metric
        else:
            app.state.system_settings = {}
    if not hasattr(app.state, "system_settings"):
        app.state.system_settings = {}

    from app.core.env_validation import validate_environment

    env_result = validate_environment(settings)
    if env_result.errors:
        log.error("env_validation_failed", errors=env_result.errors)
    if env_result.warnings:
        log.warning("env_validation_warnings", warnings=env_result.warnings)

    log.info(
        "sanson_api_starting",
        port=port,
        environment=settings.environment,
        git_ref=settings.git_commit_sha or None,
        phase="8",
    )
    yield


app = FastAPI(
    lifespan=lifespan,
    title=settings.app_name,
    version=settings.app_version,
    description="SANSON Legal OS — Phase 8 Production Deployment & Operations",
    docs_url=f"/api/{settings.api_version}/docs",
    redoc_url=f"/api/{settings.api_version}/redoc",
    openapi_url=f"/api/{settings.api_version}/openapi.json",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestMetricsMiddleware)
app.add_middleware(MaintenanceModeMiddleware)
app.add_middleware(CorrelationMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=f"/api/{settings.api_version}")

mount_static_web(app)


@app.get("/api", include_in_schema=False)
async def api_index():
    return {
        "app": settings.app_name,
        "version": settings.app_version,
        "docs": f"/api/{settings.api_version}/docs",
    }

