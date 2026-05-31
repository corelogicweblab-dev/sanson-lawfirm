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


@router.get("/ready")
async def readiness_check():
    from app.core.database import check_database_connection

    db_ok = await check_database_connection()
    return success_response(
        {
            "status": "ready" if db_ok else "degraded",
            "database": "connected" if db_ok else "unavailable",
        },
        "Service is ready" if db_ok else "Database connection failed",
    )

