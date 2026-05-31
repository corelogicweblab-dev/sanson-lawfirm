from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_permission
from app.core.responses import PaginationMeta, PaginationParams, success_response
from app.domain.authenticated_user import AuthenticatedUser
from app.schemas.mappers import to_audit_response
from app.services.audit_service import AuditService

router = APIRouter()


@router.get("/")
async def list_audit_logs(
    pagination: PaginationParams = Depends(),
    action: str | None = None,
    entity_type: str | None = None,
    current_user: AuthenticatedUser = Depends(require_permission("audit:read")),
    db: AsyncSession = Depends(get_db),
):
    service = AuditService(db)
    logs, total = await service.list_logs(
        page=pagination.page,
        page_size=pagination.page_size,
        action=action,
        entity_type=entity_type,
    )
    meta = PaginationMeta(
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
        total_pages=(total + pagination.page_size - 1) // pagination.page_size,
    )
    return success_response(
        [to_audit_response(log) for log in logs],
        "Audit logs retrieved",
        meta=meta.model_dump(),
    )


@router.get("/recent")
async def recent_audit_logs(
    current_user: AuthenticatedUser = Depends(require_permission("audit:read")),
    db: AsyncSession = Depends(get_db),
):
    service = AuditService(db)
    logs = await service.recent(limit=10)
    return success_response(
        [to_audit_response(log) for log in logs],
        "Recent audit activity retrieved",
    )

