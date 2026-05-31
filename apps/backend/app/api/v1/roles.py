from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_permission
from app.core.responses import success_response
from app.domain.authenticated_user import AuthenticatedUser
from app.schemas.mappers import to_permission_response, to_role_response
from app.services.rbac_service import RBACService

router = APIRouter()


@router.get("/")
async def list_roles(
    current_user: AuthenticatedUser = Depends(require_permission("roles:read")),
    db: AsyncSession = Depends(get_db),
):
    service = RBACService(db)
    roles = await service.list_roles()
    data = []
    for role in roles:
        role_data = to_role_response(role)
        role_data["permissions"] = [
            to_permission_response(rp.permission)
            for rp in role.role_permissions
            if rp.permission and rp.deleted_at is None
        ]
        data.append(role_data)
    return success_response(data, "Roles retrieved")


@router.get("/matrix")
async def permission_matrix(
    current_user: AuthenticatedUser = Depends(require_permission("roles:read")),
    db: AsyncSession = Depends(get_db),
):
    service = RBACService(db)
    matrix = await service.get_permission_matrix()
    return success_response({"matrix": matrix}, "Permission matrix retrieved")


@router.get("/{role_id}")
async def get_role(
    role_id: UUID,
    current_user: AuthenticatedUser = Depends(require_permission("roles:read")),
    db: AsyncSession = Depends(get_db),
):
    service = RBACService(db)
    role = await service.get_role_by_id(role_id)
    if not role:
        return success_response(None, "Role not found")
    role_data = to_role_response(role)
    role_data["permissions"] = [
        to_permission_response(rp.permission)
        for rp in role.role_permissions
        if rp.permission and rp.deleted_at is None
    ]
    return success_response(role_data, "Role retrieved")

