import structlog

from app.core.config import get_settings

logger = structlog.get_logger()


class PushService:
    """Firebase Cloud Messaging — sends when Firebase Admin is configured."""

    def __init__(self):
        self.settings = get_settings()

    @property
    def configured(self) -> bool:
        return self.settings.firebase_configured

    async def send_to_token(
        self,
        fcm_token: str,
        title: str,
        body: str,
        data: dict | None = None,
    ) -> tuple[bool, str | None]:
        if not self.configured:
            return False, "FCM not configured"
        try:
            from firebase_admin import messaging

            message = messaging.Message(
                notification=messaging.Notification(title=title, body=body),
                data={k: str(v) for k, v in (data or {}).items()},
                token=fcm_token,
            )
            messaging.send(message)
            return True, None
        except Exception as exc:
            logger.warning("fcm_send_failed", error=str(exc))
            return False, str(exc)
