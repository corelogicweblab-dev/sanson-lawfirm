from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.mobile import SyncLog
from app.services.realtime_service import RealtimeService


class SyncService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.realtime = RealtimeService(db)

    async def poll_events(self, since: datetime | None, limit: int = 50) -> list[SyncLog]:
        q = select(SyncLog).order_by(SyncLog.created_at.desc()).limit(limit)
        if since:
            q = q.where(SyncLog.created_at > since)
        result = await self.db.execute(q)
        return list(result.scalars().all())

    def supabase_config(self) -> dict:
        from app.core.config import get_settings

        s = get_settings()
        return {
            "url": s.supabase_url,
            "anonKeyConfigured": bool(s.supabase_anon_key.strip()),
            "channels": RealtimeService.REALTIME_CHANNELS,
            "instructions": "Subscribe with supabase.channel(channel).on('postgres_changes', ...)",
        }
