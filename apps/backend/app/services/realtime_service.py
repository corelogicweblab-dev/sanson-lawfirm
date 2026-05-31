from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.mobile import SyncEventTypeEnum, SyncLog
from app.services.notification_service import NotificationService


# Supabase Realtime channel naming — clients subscribe via @supabase/supabase-js
REALTIME_CHANNELS = {
    "cases": "sanson:cases",
    "appointments": "sanson:appointments",
    "documents": "sanson:documents",
    "tasks": "sanson:tasks",
    "comments": "sanson:comments",
    "timelines": "sanson:timelines",
    "notifications": "sanson:notifications",
}


class RealtimeService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.notifications = NotificationService(db)

    def channel_for(self, entity_type: str) -> str:
        key = entity_type.lower().replace("_", "")
        for name, ch in REALTIME_CHANNELS.items():
            if name in key or key in name:
                return ch
        return REALTIME_CHANNELS["notifications"]

    async def emit(
        self,
        event_type: SyncEventTypeEnum,
        entity_type: str,
        entity_id: UUID | None,
        actor_id: UUID | None = None,
        payload: dict | None = None,
        notify_user_ids: list[UUID] | None = None,
        notification_channel: str | None = None,
        title: str | None = None,
        body: str | None = None,
    ) -> SyncLog:
        channel = self.channel_for(entity_type)
        log = SyncLog(
            event_type=event_type,
            entity_type=entity_type,
            entity_id=entity_id,
            actor_id=actor_id,
            payload=payload or {},
            channel_name=channel,
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(log)
        await self.db.flush()

        if notify_user_ids and title and body:
            from app.models.mobile import NotificationChannelEnum

            ch = NotificationChannelEnum.GENERAL
            if notification_channel:
                try:
                    ch = NotificationChannelEnum(notification_channel)
                except ValueError:
                    pass
            for uid in notify_user_ids:
                await self.notifications.create_and_push(
                    user_id=uid,
                    channel=ch,
                    title=title,
                    body=body,
                    entity_type=entity_type,
                    entity_id=entity_id,
                    payload=payload,
                )
        return log
