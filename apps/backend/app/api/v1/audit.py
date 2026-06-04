from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import require_permission
from app.core.responses import PaginationMeta, PaginationParams, success_response
from app.domain.authenticated_user import AuthenticatedUser
from app.schemas.mappers import to_audit_response
from app.services.audit_service import AuditService

router = APIRouter()


async def _actor_names(db: AsyncSession, ids: list[UUID]) -> dict[str, str]:
    """Resolve performer ids to full names so admins see who acted, not raw ids."""
    if not ids:
        return {}
    from app.models import User

    result = await db.execute(
        select(User).options(selectinload(User.profile)).where(User.id.in_(ids))
    )
    names: dict[str, str] = {}
    for user in result.scalars().all():
        profile = user.profile
        if profile:
            full = " ".join(
                p
                for p in [profile.first_name, profile.middle_name, profile.last_name, profile.suffix]
                if p
            ).strip()
        else:
            full = ""
        names[str(user.id)] = full or user.email
    return names


def _attach_actor_names(rows: list[dict], names: dict[str, str]) -> list[dict]:
    for row in rows:
        actor_id = row.get("performed_by") or row.get("actor_id")
        row["actor_name"] = names.get(str(actor_id)) if actor_id else None
    return rows


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
    rows = [to_audit_response(log) for log in logs]
    names = await _actor_names(db, [log.performed_by for log in logs if log.performed_by])
    return success_response(
        _attach_actor_names(rows, names),
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
    rows = [to_audit_response(log) for log in logs]
    names = await _actor_names(db, [log.performed_by for log in logs if log.performed_by])
    return success_response(
        _attach_actor_names(rows, names),
        "Recent audit activity retrieved",
    )


@router.get("/ai")
async def list_ai_audit(
    pagination: PaginationParams = Depends(),
    _user: AuthenticatedUser = Depends(require_permission("ai_audit:read")),
    db: AsyncSession = Depends(get_db),
):
    from app.services.ai_audit_service import AiAuditService

    svc = AiAuditService(db)
    logs, total = await svc.list_logs(pagination.page_size, pagination.offset)
    meta = PaginationMeta(
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
        total_pages=(total + pagination.page_size - 1) // pagination.page_size if pagination.page_size else 0,
    )
    return success_response(
        [
            {
                "id": str(l.id),
                "promptType": l.prompt_type,
                "modelName": l.model_name,
                "tokensInput": l.tokens_input,
                "tokensOutput": l.tokens_output,
                "confidenceScore": float(l.confidence_score) if l.confidence_score else None,
                "createdAt": l.created_at.isoformat(),
            }
            for l in logs
        ],
        "AI audit logs",
        meta=meta.model_dump(),
    )

