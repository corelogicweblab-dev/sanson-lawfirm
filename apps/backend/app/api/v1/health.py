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
    return success_response(
        {"status": "ready", "database": "configured"},
        "Service is ready",
    )

