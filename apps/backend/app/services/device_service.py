from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.mobile import DevicePlatformEnum, MobileDevice, PushToken
from app.services.audit_service import AuditService
from app.services.notification_service import NotificationService


class DeviceService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.audit = AuditService(db)
        self.notifications = NotificationService(db)

    async def register_device(
        self,
        user_id: UUID,
        device_name: str,
        device_uuid: str,
        platform: str,
        app_version: str | None = None,
        os_version: str | None = None,
        fcm_token: str | None = None,
        biometric_ready: bool = False,
        ip: str | None = None,
        ua: str | None = None,
    ) -> tuple[MobileDevice, PushToken | None]:
        plat = DevicePlatformEnum(platform)
        result = await self.db.execute(
            select(MobileDevice).where(
                MobileDevice.user_id == user_id, MobileDevice.device_uuid == device_uuid
            )
        )
        device = result.scalar_one_or_none()
        now = datetime.now(timezone.utc)
        if device:
            device.device_name = device_name
            device.platform = plat
            device.app_version = app_version
            device.os_version = os_version
            device.is_active = True
            device.last_seen_at = now
            device.biometric_ready = biometric_ready
            device.revoked_at = None
        else:
            device = MobileDevice(
                user_id=user_id,
                device_name=device_name,
                device_uuid=device_uuid,
                platform=plat,
                app_version=app_version,
                os_version=os_version,
                last_seen_at=now,
                biometric_ready=biometric_ready,
            )
            self.db.add(device)
            await self.db.flush()
            await self.audit.log(
                "mobile.device_registered", "mobile_devices", device.id, user_id, ip, ua
            )

        push_row = None
        if fcm_token:
            push_row = await self.register_push_token(user_id, fcm_token, platform, device.id)
        return device, push_row

    async def register_push_token(
        self,
        user_id: UUID,
        fcm_token: str,
        platform: str,
        device_id: UUID | None = None,
    ) -> PushToken:
        plat = DevicePlatformEnum(platform)
        result = await self.db.execute(select(PushToken).where(PushToken.fcm_token == fcm_token))
        token = result.scalar_one_or_none()
        if token:
            token.user_id = user_id
            token.device_id = device_id
            token.platform = plat
            token.is_active = True
        else:
            token = PushToken(
                user_id=user_id,
                device_id=device_id,
                fcm_token=fcm_token,
                platform=plat,
            )
            self.db.add(token)
        await self.db.flush()
        await self.audit.log("mobile.push_token_registered", "push_tokens", token.id, user_id)
        return token

    async def revoke_device(self, user_id: UUID, device_id: UUID) -> bool:
        result = await self.db.execute(
            select(MobileDevice).where(MobileDevice.id == device_id, MobileDevice.user_id == user_id)
        )
        device = result.scalar_one_or_none()
        if not device:
            return False
        device.is_active = False
        device.revoked_at = datetime.now(timezone.utc)
        await self.audit.log("mobile.device_revoked", "mobile_devices", device_id, user_id)
        return True

    async def list_devices(self, user_id: UUID) -> list[MobileDevice]:
        result = await self.db.execute(
            select(MobileDevice)
            .where(MobileDevice.user_id == user_id, MobileDevice.revoked_at.is_(None))
            .order_by(MobileDevice.last_seen_at.desc())
        )
        return list(result.scalars().all())
