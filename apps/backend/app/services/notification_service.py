from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.mobile import (
    Notification,
    NotificationChannelEnum,
    NotificationPreference,
    PushDeliveryStatusEnum,
    PushToken,
)
from app.services.audit_service import AuditService
from app.services.push_service import PushService


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.push = PushService()
        self.audit = AuditService(db)

    async def get_or_create_preferences(self, user_id: UUID) -> NotificationPreference:
        result = await self.db.execute(
            select(NotificationPreference).where(NotificationPreference.user_id == user_id)
        )
        prefs = result.scalar_one_or_none()
        if prefs:
            return prefs
        prefs = NotificationPreference(user_id=user_id)
        self.db.add(prefs)
        await self.db.flush()
        return prefs

    async def update_preferences(self, user_id: UUID, **kwargs) -> NotificationPreference:
        prefs = await self.get_or_create_preferences(user_id)
        for key, val in kwargs.items():
            if val is not None and hasattr(prefs, key):
                setattr(prefs, key, val)
        await self.db.flush()
        return prefs

    async def list_notifications(
        self, user_id: UUID, unread_only: bool = False, limit: int = 30, offset: int = 0
    ) -> tuple[list[Notification], int]:
        q = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            q = q.where(Notification.is_read.is_(False))
        count_q = select(func.count(Notification.id)).where(Notification.user_id == user_id)
        if unread_only:
            count_q = count_q.where(Notification.is_read.is_(False))
        total = (await self.db.execute(count_q)).scalar() or 0
        result = await self.db.execute(
            q.order_by(Notification.created_at.desc()).offset(offset).limit(limit)
        )
        return list(result.scalars().all()), total

    async def mark_read(self, user_id: UUID, notification_id: UUID) -> Notification | None:
        result = await self.db.execute(
            select(Notification).where(
                Notification.id == notification_id, Notification.user_id == user_id
            )
        )
        n = result.scalar_one_or_none()
        if not n:
            return None
        n.is_read = True
        n.read_at = datetime.now(timezone.utc)
        await self.audit.log("notification.read", "notifications", n.id, user_id)
        return n

    async def mark_all_read(self, user_id: UUID) -> int:
        result = await self.db.execute(
            select(Notification).where(
                Notification.user_id == user_id, Notification.is_read.is_(False)
            )
        )
        count = 0
        now = datetime.now(timezone.utc)
        for n in result.scalars().all():
            n.is_read = True
            n.read_at = now
            count += 1
        return count

    async def create_and_push(
        self,
        user_id: UUID,
        channel: NotificationChannelEnum,
        title: str,
        body: str,
        entity_type: str | None = None,
        entity_id: UUID | None = None,
        payload: dict | None = None,
    ) -> Notification:
        prefs = await self.get_or_create_preferences(user_id)
        n = Notification(
            user_id=user_id,
            channel=channel,
            title=title,
            body=body,
            payload=payload or {},
            entity_type=entity_type,
            entity_id=entity_id,
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(n)
        await self.db.flush()

        if prefs.push_enabled and self._channel_allowed(prefs, channel):
            tokens = await self.db.execute(
                select(PushToken).where(
                    PushToken.user_id == user_id, PushToken.is_active.is_(True)
                )
            )
            sent_any = False
            for token in tokens.scalars().all():
                ok, err = await self.push.send_to_token(
                    token.fcm_token,
                    title,
                    body,
                    {"notificationId": str(n.id), "channel": channel.value},
                )
                if ok:
                    sent_any = True
                elif err:
                    n.push_error = err
            n.push_status = (
                PushDeliveryStatusEnum.SENT
                if sent_any
                else PushDeliveryStatusEnum.SKIPPED
                if not self.push.configured
                else PushDeliveryStatusEnum.FAILED
            )
            if sent_any:
                n.push_sent_at = datetime.now(timezone.utc)
                await self.audit.log("push.delivered", "notifications", n.id, user_id)
        else:
            n.push_status = PushDeliveryStatusEnum.SKIPPED

        await self.db.flush()
        return n

    def _channel_allowed(self, prefs: NotificationPreference, channel: NotificationChannelEnum) -> bool:
        mapping = {
            NotificationChannelEnum.APPOINTMENT_CONFIRMED: prefs.appointment_alerts,
            NotificationChannelEnum.APPOINTMENT_RESCHEDULED: prefs.appointment_alerts,
            NotificationChannelEnum.CONSULTATION_REMINDER: prefs.appointment_alerts,
            NotificationChannelEnum.CASE_UPDATED: prefs.case_alerts,
            NotificationChannelEnum.TASK_ASSIGNED: prefs.task_alerts,
            NotificationChannelEnum.DOCUMENT_UPLOADED: prefs.document_alerts,
            NotificationChannelEnum.LAWYER_ASSIGNMENT: prefs.case_alerts,
            NotificationChannelEnum.AI_PROCESSING_COMPLETE: prefs.ai_alerts,
            NotificationChannelEnum.SYSTEM_ALERT: prefs.system_alerts,
        }
        return mapping.get(channel, True)
