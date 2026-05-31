import enum
import uuid
from datetime import datetime, time

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text, Time
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin


class DevicePlatformEnum(str, enum.Enum):
    IOS = "IOS"
    ANDROID = "ANDROID"
    WEB = "WEB"


class PushDeliveryStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    SENT = "SENT"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"


class NotificationChannelEnum(str, enum.Enum):
    APPOINTMENT_CONFIRMED = "APPOINTMENT_CONFIRMED"
    APPOINTMENT_RESCHEDULED = "APPOINTMENT_RESCHEDULED"
    CONSULTATION_REMINDER = "CONSULTATION_REMINDER"
    CASE_UPDATED = "CASE_UPDATED"
    TASK_ASSIGNED = "TASK_ASSIGNED"
    DOCUMENT_UPLOADED = "DOCUMENT_UPLOADED"
    LAWYER_ASSIGNMENT = "LAWYER_ASSIGNMENT"
    AI_PROCESSING_COMPLETE = "AI_PROCESSING_COMPLETE"
    SYSTEM_ALERT = "SYSTEM_ALERT"
    GENERAL = "GENERAL"


class SyncEventTypeEnum(str, enum.Enum):
    CASE_UPDATE = "CASE_UPDATE"
    ASSIGNMENT_CHANGE = "ASSIGNMENT_CHANGE"
    APPOINTMENT_CHANGE = "APPOINTMENT_CHANGE"
    DOCUMENT_UPLOAD = "DOCUMENT_UPLOAD"
    AI_SUMMARY = "AI_SUMMARY"
    TASK_UPDATE = "TASK_UPDATE"
    COMMENT = "COMMENT"
    TIMELINE_UPDATE = "TIMELINE_UPDATE"
    NOTIFICATION = "NOTIFICATION"


class MobileDevice(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "mobile_devices"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    device_name: Mapped[str] = mapped_column(String(120), nullable=False)
    platform: Mapped[DevicePlatformEnum] = mapped_column(
        Enum(DevicePlatformEnum, name="device_platform", create_type=False),
        default=DevicePlatformEnum.ANDROID,
    )
    device_uuid: Mapped[str] = mapped_column(String(128), nullable=False)
    app_version: Mapped[str | None] = mapped_column(String(32))
    os_version: Mapped[str | None] = mapped_column(String(32))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    biometric_ready: Mapped[bool] = mapped_column(Boolean, default=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class PushToken(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "push_tokens"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    device_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("mobile_devices.id"))
    fcm_token: Mapped[str] = mapped_column(Text, nullable=False)
    platform: Mapped[DevicePlatformEnum] = mapped_column(
        Enum(DevicePlatformEnum, name="device_platform", create_type=False)
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class NotificationPreference(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "notification_preferences"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False
    )
    push_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    email_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    appointment_alerts: Mapped[bool] = mapped_column(Boolean, default=True)
    case_alerts: Mapped[bool] = mapped_column(Boolean, default=True)
    task_alerts: Mapped[bool] = mapped_column(Boolean, default=True)
    document_alerts: Mapped[bool] = mapped_column(Boolean, default=True)
    ai_alerts: Mapped[bool] = mapped_column(Boolean, default=True)
    system_alerts: Mapped[bool] = mapped_column(Boolean, default=True)
    quiet_hours_start: Mapped[time | None] = mapped_column(Time)
    quiet_hours_end: Mapped[time | None] = mapped_column(Time)


class Notification(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "notifications"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    channel: Mapped[NotificationChannelEnum] = mapped_column(
        Enum(NotificationChannelEnum, name="notification_channel", create_type=False),
        default=NotificationChannelEnum.GENERAL,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    payload: Mapped[dict] = mapped_column(JSONB, default=dict)
    entity_type: Mapped[str | None] = mapped_column(String(80))
    entity_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    push_status: Mapped[PushDeliveryStatusEnum] = mapped_column(
        Enum(PushDeliveryStatusEnum, name="push_delivery_status", create_type=False),
        default=PushDeliveryStatusEnum.PENDING,
    )
    push_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    push_error: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class SyncLog(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "sync_logs"

    event_type: Mapped[SyncEventTypeEnum] = mapped_column(
        Enum(SyncEventTypeEnum, name="sync_event_type", create_type=False)
    )
    entity_type: Mapped[str] = mapped_column(String(80), nullable=False)
    entity_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    actor_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    payload: Mapped[dict] = mapped_column(JSONB, default=dict)
    channel_name: Mapped[str | None] = mapped_column(String(120))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
