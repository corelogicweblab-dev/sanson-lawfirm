import structlog
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_permission
from app.core.responses import success_response
from app.domain.authenticated_user import AuthenticatedUser
from app.schemas.legal_mappers import to_case
from app.services.legal_workflow import LegalWorkflowService
from app.services.notification_service import NotificationService

router = APIRouter()
logger = structlog.get_logger()

DEFAULT_LAWYER_STATS = {
    "active_cases": 0,
    "pending_review": 0,
    "urgent_high": 0,
    "pending_approvals": 0,
    "open_tasks": 0,
    "overdue_tasks": 0,
    "appointments_pending": 0,
    "todays_consultations": 0,
    "documents_total": 0,
    "documents_pending_review": 0,
    "evidence_total": 0,
    "evidence_pending_validation": 0,
    "pending_requests": 0,
    "ai_analyses_today": 0,
    "notifications_unread": 0,
}


@router.get("/stats")
async def workflow_stats(
    current_user: AuthenticatedUser = Depends(require_permission("dashboard:admin")),
    db: AsyncSession = Depends(get_db),
):
    service = LegalWorkflowService(db)
    stats = await service.get_workflow_stats()
    return success_response(stats, "Legal workflow stats retrieved")


@router.get("/lawyer-dashboard")
async def lawyer_dashboard(
    current_user: AuthenticatedUser = Depends(require_permission("dashboard:lawyer")),
    db: AsyncSession = Depends(get_db),
):
    service = LegalWorkflowService(db)

    try:
        stats = await service.get_lawyer_dashboard_stats(current_user.id)
    except Exception as exc:
        logger.exception("lawyer_dashboard_stats_failed", error=str(exc))
        stats = dict(DEFAULT_LAWYER_STATS)

    try:
        notif_svc = NotificationService(db)
        _, unread_total = await notif_svc.list_notifications(
            current_user.id, unread_only=True, limit=1, offset=0
        )
        stats["notifications_unread"] = unread_total
    except Exception as exc:
        logger.debug("lawyer_dashboard_notifications_skipped", error=str(exc))
        stats["notifications_unread"] = stats.get("notifications_unread", 0)

    preview_payload: list[dict] = []
    try:
        preview = await service.list_cases_pending_lawyer_review(limit=5)
        preview_payload = [to_case(c) for c in preview]
    except Exception as exc:
        logger.debug("lawyer_dashboard_preview_skipped", error=str(exc))

    return success_response(
        {
            "stats": stats,
            "preview_cases": preview_payload,
        },
        "Lawyer dashboard retrieved",
    )

