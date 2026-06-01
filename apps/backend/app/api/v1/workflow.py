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
    stats = await service.get_lawyer_dashboard_stats(current_user.id)
    notif_svc = NotificationService(db)
    _, unread_total = await notif_svc.list_notifications(
        current_user.id, unread_only=True, limit=1, offset=0
    )
    stats["notifications_unread"] = unread_total
    preview = await service.list_cases_pending_lawyer_review(limit=5)
    return success_response(
        {
            "stats": stats,
            "preview_cases": [to_case(c) for c in preview],
        },
        "Lawyer dashboard retrieved",
    )

