from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class ProfileResponse(BaseModel):
    id: UUID
    user_id: UUID
    first_name: str
    middle_name: str | None = None
    last_name: str
    suffix: str | None = None
    phone: str | None = None
    address: str | None = None
    profile_photo: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RoleResponse(BaseModel):
    id: UUID
    name: str
    display_name: str
    description: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PermissionResponse(BaseModel):
    id: UUID
    name: str
    display_name: str
    description: str | None = None
    module: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    id: UUID
    firebase_uid: str
    email: str
    role_id: UUID
    role: RoleResponse
    status: str
    is_active: bool
    last_login_at: datetime | None = None
    profile: ProfileResponse | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AuthSyncRequest(BaseModel):
    first_name: str = Field(default="User", min_length=1, max_length=100)
    last_name: str = Field(default="", max_length=100)
    phone: str | None = Field(default=None, max_length=30)
    role: str = Field(default="CLIENT")


class AuthSyncResponse(BaseModel):
    user: UserResponse
    is_new_user: bool


class ProfileUpdateRequest(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    middle_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    suffix: str | None = Field(default=None, max_length=20)
    phone: str | None = Field(default=None, max_length=30)
    address: str | None = None
    profile_photo: str | None = None


class RoleUpdateRequest(BaseModel):
    role: str = Field(..., pattern="^(CLIENT|LAWYER|PARALEGAL|ADMIN)$")


class UserStatusUpdateRequest(BaseModel):
    is_active: bool


class AuditLogResponse(BaseModel):
    id: UUID
    action: str
    entity_type: str
    entity_id: UUID | None = None
    performed_by: UUID | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    old_values: dict | None = None
    new_values: dict | None = None
    metadata: dict | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class DashboardStatsResponse(BaseModel):
    total_users: int
    clients: int
    lawyers: int
    paralegals: int
    admins: int


class RoleWithPermissionsResponse(RoleResponse):
    permissions: list[PermissionResponse] = []


class PermissionMatrixResponse(BaseModel):
    matrix: dict[str, list[str]]
