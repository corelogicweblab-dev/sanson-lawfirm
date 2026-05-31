from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_permission
from app.core.responses import success_response
from app.domain.authenticated_user import AuthenticatedUser
from app.schemas.mobile_mappers import to_sync_event
from app.services.sync_service import SyncService

router = APIRouter()


@router.get("/events")
async def poll_sync_events(
    since: str | None = Query(None, description="ISO datetime"),
    limit: int = Query(50, ge=1, le=100),
    _user: AuthenticatedUser = Depends(require_permission("sync:read")),
    db: AsyncSession = Depends(get_db),
):
    svc = SyncService(db)
    since_dt = datetime.fromisoformat(since.replace("Z", "+00:00")) if since else None
    events = await svc.poll_events(since_dt, limit)
    return success_response([to_sync_event(e) for e in events], "Sync events")


@router.get("/realtime-config")
async def realtime_config(
    _user: AuthenticatedUser = Depends(require_permission("sync:read")),
    db: AsyncSession = Depends(get_db),
):
    svc = SyncService(db)
    return success_response(svc.supabase_config(), "Realtime configuration")
