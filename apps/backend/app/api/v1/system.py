from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_permission
from app.core.responses import success_response
from app.domain.authenticated_user import AuthenticatedUser
from app.services.ai_audit_service import AiAuditService
from app.services.system_service import SystemService

router = APIRouter()


class SettingUpdate(BaseModel):
    value: dict


@router.get("/health")
async def system_health(
    db: AsyncSession = Depends(get_db),
):
    svc = SystemService(db)
    return success_response(await svc.health_dashboard(), "System health")


@router.get("/settings")
async def list_settings(
    user: AuthenticatedUser = Depends(require_permission("system:read")),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select
    from app.models.security import SystemSetting

    result = await db.execute(select(SystemSetting))
    rows = result.scalars().all()
    return success_response(
        [
            {
                "key": s.key,
                "value": s.value,
                "description": s.description,
                "isPublic": s.is_public,
            }
            for s in rows
        ],
        "System settings",
    )


@router.patch("/settings/{key}")
async def update_setting(
    key: str,
    body: SettingUpdate,
    request: Request,
    user: AuthenticatedUser = Depends(require_permission("system:write")),
    db: AsyncSession = Depends(get_db),
):
    svc = SystemService(db)
    row = await svc.update_setting(key, body.value, user.id)
    cache = getattr(request.app.state, "system_settings", None)
    if cache is not None:
        cache[key] = body.value
    return success_response({"key": row.key, "value": row.value}, "Setting updated")


@router.get("/settings/public")
async def public_settings(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    from app.models.security import SystemSetting

    result = await db.execute(select(SystemSetting).where(SystemSetting.is_public.is_(True)))
    return success_response(
        {s.key: s.value for s in result.scalars().all()},
        "Public settings",
    )


@router.get("/backups")
async def list_backups(
    _user: AuthenticatedUser = Depends(require_permission("system:read")),
    db: AsyncSession = Depends(get_db),
):
    svc = SystemService(db)
    logs = await svc.list_backups()
    return success_response(
        [
            {
                "id": str(b.id),
                "backupType": b.backup_type,
                "status": b.status.value,
                "storageTarget": b.storage_target,
                "startedAt": b.started_at.isoformat(),
            }
            for b in logs
        ],
        "Backup logs",
    )


@router.post("/backups/record")
async def record_backup(
    backup_type: str = "database",
    storage_target: str = "supabase",
    user: AuthenticatedUser = Depends(require_permission("system:write")),
    db: AsyncSession = Depends(get_db),
):
    svc = SystemService(db)
    log = await svc.record_backup(backup_type, storage_target, "COMPLETED")
    return success_response({"id": str(log.id)}, "Backup recorded")
