from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_client_ip, get_current_user, get_user_agent, require_permission
from app.domain.authenticated_user import AuthenticatedUser
from app.core.responses import success_response
from app.schemas.mobile import DeviceRegisterRequest, PushTokenRequest
from app.schemas.mobile_mappers import to_device, to_push_token
from app.services.audit_service import AuditService
from app.services.device_service import DeviceService

router = APIRouter()


@router.post("/register")
async def register_device(
    body: DeviceRegisterRequest,
    user: AuthenticatedUser = Depends(require_permission("devices:register")),
    db: AsyncSession = Depends(get_db),
    ip: str | None = Depends(get_client_ip),
    ua: str | None = Depends(get_user_agent),
):
    svc = DeviceService(db)
    device, push = await svc.register_device(
        user_id=user.id,
        device_name=body.device_name,
        device_uuid=body.device_uuid,
        platform=body.platform,
        app_version=body.app_version,
        os_version=body.os_version,
        fcm_token=body.fcm_token,
        biometric_ready=body.biometric_ready,
        ip=ip,
        ua=ua,
    )
    audit = AuditService(db)
    await audit.log("mobile.login", "mobile_devices", device.id, user.id, ip, ua)
    data = to_device(device)
    if push:
        data["pushToken"] = to_push_token(push)
    return success_response(data, "Device registered")


@router.get("/")
async def list_devices(
    user: AuthenticatedUser = Depends(require_permission("mobile:read")),
    db: AsyncSession = Depends(get_db),
):
    svc = DeviceService(db)
    devices = await svc.list_devices(user.id)
    return success_response([to_device(d) for d in devices], "Devices")


@router.post("/push-token")
async def register_push_token(
    body: PushTokenRequest,
    user: AuthenticatedUser = Depends(require_permission("devices:register")),
    db: AsyncSession = Depends(get_db),
):
    svc = DeviceService(db)
    device_id = UUID(body.device_id) if body.device_id else None
    token = await svc.register_push_token(user.id, body.fcm_token, body.platform, device_id)
    return success_response(to_push_token(token), "Push token registered")


@router.delete("/{device_id}")
async def revoke_device(
    device_id: UUID,
    user: AuthenticatedUser = Depends(require_permission("devices:register")),
    db: AsyncSession = Depends(get_db),
):
    svc = DeviceService(db)
    ok = await svc.revoke_device(user.id, device_id)
    if not ok:
        raise HTTPException(404, "Device not found")
    return success_response(None, "Device revoked")
