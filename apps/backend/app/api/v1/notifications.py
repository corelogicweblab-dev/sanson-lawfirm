from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_permission
from app.core.responses import PaginationMeta, PaginationParams, success_response
from app.domain.authenticated_user import AuthenticatedUser
from app.schemas.mobile import NotificationPreferencesUpdate
from app.schemas.mobile_mappers import to_notification, to_preferences
from app.services.notification_service import NotificationService

router = APIRouter()


@router.get("/")
async def list_notifications(
    unread_only: bool = Query(False),
    pagination: PaginationParams = Depends(),
    user: AuthenticatedUser = Depends(require_permission("notifications:read")),
    db: AsyncSession = Depends(get_db),
):
    svc = NotificationService(db)
    rows, total = await svc.list_notifications(
        user.id, unread_only, pagination.page_size, pagination.offset
    )
    meta = PaginationMeta(
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
        total_pages=(total + pagination.page_size - 1) // pagination.page_size
        if pagination.page_size
        else 0,
    )
    return success_response(
        [to_notification(n) for n in rows], "Notifications", meta=meta.model_dump()
    )


@router.post("/{notification_id}/read")
async def mark_read(
    notification_id: UUID,
    user: AuthenticatedUser = Depends(require_permission("notifications:read")),
    db: AsyncSession = Depends(get_db),
):
    svc = NotificationService(db)
    n = await svc.mark_read(user.id, notification_id)
    if not n:
        return success_response(None, "Notification not found")
    return success_response(to_notification(n), "Marked as read")


@router.post("/read-all")
async def mark_all_read(
    user: AuthenticatedUser = Depends(require_permission("notifications:read")),
    db: AsyncSession = Depends(get_db),
):
    svc = NotificationService(db)
    count = await svc.mark_all_read(user.id)
    return success_response({"count": count}, "All marked read")


@router.get("/preferences")
async def get_preferences(
    user: AuthenticatedUser = Depends(require_permission("notifications:read")),
    db: AsyncSession = Depends(get_db),
):
    svc = NotificationService(db)
    prefs = await svc.get_or_create_preferences(user.id)
    return success_response(to_preferences(prefs), "Preferences")


@router.patch("/preferences")
async def update_preferences(
    body: NotificationPreferencesUpdate,
    user: AuthenticatedUser = Depends(require_permission("notifications:write")),
    db: AsyncSession = Depends(get_db),
):
    svc = NotificationService(db)
    prefs = await svc.update_preferences(
        user.id,
        push_enabled=body.push_enabled,
        appointment_alerts=body.appointment_alerts,
        case_alerts=body.case_alerts,
        task_alerts=body.task_alerts,
        document_alerts=body.document_alerts,
        ai_alerts=body.ai_alerts,
        system_alerts=body.system_alerts,
    )
    return success_response(to_preferences(prefs), "Preferences updated")
