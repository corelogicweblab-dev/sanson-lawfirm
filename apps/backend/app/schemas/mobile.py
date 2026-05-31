from pydantic import BaseModel, Field


class DeviceRegisterRequest(BaseModel):
    device_name: str = Field(..., min_length=1, max_length=120)
    device_uuid: str = Field(..., min_length=8, max_length=128)
    platform: str = Field(default="ANDROID", pattern="^(IOS|ANDROID|WEB)$")
    app_version: str | None = None
    os_version: str | None = None
    fcm_token: str | None = None
    biometric_ready: bool = False


class PushTokenRequest(BaseModel):
    fcm_token: str = Field(..., min_length=10)
    platform: str = Field(default="ANDROID", pattern="^(IOS|ANDROID|WEB)$")
    device_id: str | None = None


class NotificationPreferencesUpdate(BaseModel):
    push_enabled: bool | None = None
    appointment_alerts: bool | None = None
    case_alerts: bool | None = None
    task_alerts: bool | None = None
    document_alerts: bool | None = None
    ai_alerts: bool | None = None
    system_alerts: bool | None = None


class SyncPollRequest(BaseModel):
    since: str | None = None
    limit: int = Field(default=50, ge=1, le=100)
