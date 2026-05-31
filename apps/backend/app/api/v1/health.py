from fastapi import APIRouter

from app.core.config import get_settings
from app.core.responses import success_response

router = APIRouter()
settings = get_settings()


@router.get("/")
async def health_check():
    return success_response(
        {
            "status": "healthy",
            "app": settings.app_name,
            "version": settings.app_version,
        },
        "Service is healthy",
    )


@router.get("/live")
async def liveness_check():
    return success_response({"status": "alive"}, "Service is alive")


@router.get("/ready")
async def readiness_check():
    from app.core.database import check_database_connection
    from app.core.env_validation import validate_environment

    url_issues = settings.database_url_issues()
    db_ok = await check_database_connection() if not url_issues else False
    env = validate_environment(settings)
    ready = db_ok and (env.valid or settings.environment.lower() == "development")
    return success_response(
        {
            "status": "ready" if ready else "degraded",
            "environment": settings.environment,
            "database": "connected" if db_ok else "unavailable",
            "database_url_issues": url_issues,
            "env_validation": env.to_dict(),
        },
        "Service is ready" if ready else "Readiness check failed",
    )

