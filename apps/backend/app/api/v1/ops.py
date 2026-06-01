from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.core.dependencies import require_permission
from app.core.env_validation import validate_environment
from app.core.responses import success_response
from app.domain.authenticated_user import AuthenticatedUser
from app.services.alerting_service import AlertingService
from app.services.deployment_service import DeploymentService
from app.services.monitoring_service import MonitoringService

router = APIRouter()
settings = get_settings()


class DeploymentRecord(BaseModel):
    service: str
    version: str | None = None
    git_ref: str | None = None
    environment: str | None = None
    status: str = "success"
    metadata: dict | None = None


@router.get("/dashboard")
async def operations_dashboard(
    _user: AuthenticatedUser = Depends(require_permission("ops:read")),
    db: AsyncSession = Depends(get_db),
):
    svc = MonitoringService(db)
    data = await svc.operations_dashboard()
    await db.commit()
    return success_response(data, "Operations dashboard")


@router.get("/ai-status")
async def ai_provider_status():
    """Public-safe: confirms which AI provider is selected (not a live API test)."""
    provider = (
        "gemini"
        if settings.gemini_configured
        else "openai"
        if settings.openai_configured
        else "none"
    )
    return success_response(
        {
            "provider": provider,
            "gemini_key_set": settings.gemini_configured,
            "openai_key_set": settings.openai_configured,
            "gemini_model": settings.gemini_model if settings.gemini_configured else None,
            "note": (
                "gemini_key_set only means GEMINI_API_KEY exists. "
                "After deploy, start a new chat to test a live reply."
            ),
        },
        "AI provider status",
    )


@router.get("/environment")
async def environment_status():
    """Public-safe environment summary (no secrets)."""
    result = validate_environment(settings)
    return success_response(
        {
            "environment": settings.environment,
            "app_version": settings.app_version,
            "git_ref": settings.git_commit_sha or None,
            "validation": result.to_dict(),
            "integrations": {
                "database_ssl": settings.requires_database_ssl,
                "firebase": settings.firebase_configured,
                "gemini": settings.gemini_configured,
                "openai": settings.openai_configured,
                "ai_chat_provider": (
                    "gemini"
                    if settings.gemini_configured
                    else "openai"
                    if settings.openai_configured
                    else "none"
                ),
                "qdrant": settings.qdrant_configured,
                "r2": settings.r2_configured,
            },
        },
        "Environment status",
    )


@router.get("/deployments")
async def list_deployments(
    _user: AuthenticatedUser = Depends(require_permission("ops:read")),
    db: AsyncSession = Depends(get_db),
):
    mon = MonitoringService(db)
    logs = await mon.list_deployments()
    return success_response(
        [
            {
                "id": str(d.id),
                "environment": d.environment.value,
                "service": d.service,
                "version": d.version,
                "gitRef": d.git_ref,
                "status": d.status.value,
                "deployedAt": d.deployed_at.isoformat(),
                "deployedBy": d.deployed_by,
            }
            for d in logs
        ],
        "Deployment history",
    )


@router.post("/deployments")
async def record_deployment(
    body: DeploymentRecord,
    user: AuthenticatedUser = Depends(require_permission("ops:write")),
    db: AsyncSession = Depends(get_db),
):
    svc = DeploymentService(db)
    log = await svc.record_deployment(
        service=body.service,
        version=body.version,
        git_ref=body.git_ref,
        environment=body.environment,
        status=body.status,
        deployed_by=user.email,
        metadata=body.metadata,
    )
    return success_response({"id": str(log.id)}, "Deployment recorded")


@router.get("/migrations")
async def migration_status(
    _user: AuthenticatedUser = Depends(require_permission("ops:read")),
    db: AsyncSession = Depends(get_db),
):
    svc = DeploymentService(db)
    return success_response(await svc.migration_status(), "Migration status")


@router.get("/alerts")
async def list_alerts(
    _user: AuthenticatedUser = Depends(require_permission("ops:read")),
    db: AsyncSession = Depends(get_db),
):
    svc = AlertingService(db)
    alerts = await svc.list_alerts(50, unresolved_only=False)
    return success_response(
        [
            {
                "id": str(a.id),
                "category": a.category.value,
                "severity": a.severity.value,
                "title": a.title,
                "message": a.message,
                "resolved": a.resolved,
                "createdAt": a.created_at.isoformat(),
            }
            for a in alerts
        ],
        "System alerts",
    )


@router.post("/alerts/{alert_id}/resolve")
async def resolve_alert(
    alert_id: UUID,
    user: AuthenticatedUser = Depends(require_permission("ops:write")),
    db: AsyncSession = Depends(get_db),
):
    svc = AlertingService(db)
    ok = await svc.resolve_alert(alert_id, user.id)
    return success_response({"resolved": ok}, "Alert updated")
