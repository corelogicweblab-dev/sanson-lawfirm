from app.models.mobile import (
    MobileDevice,
    Notification,
    NotificationPreference,
    PushToken,
    SyncLog,
)


def to_device(d: MobileDevice) -> dict:
    return {
        "id": str(d.id),
        "deviceName": d.device_name,
        "platform": d.platform.value,
        "deviceUuid": d.device_uuid,
        "appVersion": d.app_version,
        "isActive": d.is_active,
        "lastSeenAt": d.last_seen_at.isoformat() if d.last_seen_at else None,
        "biometricReady": d.biometric_ready,
    }


def to_notification(n: Notification) -> dict:
    return {
        "id": str(n.id),
        "channel": n.channel.value,
        "title": n.title,
        "body": n.body,
        "payload": n.payload or {},
        "entityType": n.entity_type,
        "entityId": str(n.entity_id) if n.entity_id else None,
        "isRead": n.is_read,
        "readAt": n.read_at.isoformat() if n.read_at else None,
        "createdAt": n.created_at.isoformat() if n.created_at else None,
    }


def to_preferences(p: NotificationPreference) -> dict:
    return {
        "pushEnabled": p.push_enabled,
        "emailEnabled": p.email_enabled,
        "appointmentAlerts": p.appointment_alerts,
        "caseAlerts": p.case_alerts,
        "taskAlerts": p.task_alerts,
        "documentAlerts": p.document_alerts,
        "aiAlerts": p.ai_alerts,
        "systemAlerts": p.system_alerts,
    }


def to_sync_event(s: SyncLog) -> dict:
    return {
        "id": str(s.id),
        "eventType": s.event_type.value,
        "entityType": s.entity_type,
        "entityId": str(s.entity_id) if s.entity_id else None,
        "payload": s.payload or {},
        "channelName": s.channel_name,
        "createdAt": s.created_at.isoformat() if s.created_at else None,
    }


def to_push_token(t: PushToken) -> dict:
    return {
        "id": str(t.id),
        "platform": t.platform.value,
        "isActive": t.is_active,
    }
