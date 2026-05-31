from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.user_repository import PermissionRepository, RoleRepository


class RBACService:
    def __init__(self, db: AsyncSession):
        self.permission_repo = PermissionRepository(db)
        self.role_repo = RoleRepository(db)

    async def get_permissions_for_role(self, role_id: UUID) -> list[str]:
        permissions = await self.permission_repo.get_for_role(role_id)
        role = await self.role_repo.get_by_id(role_id)
        if role and role.name.value == "ADMIN":
            return ["*"]
        return permissions

    async def user_has_permission(self, role_id: UUID, permission: str) -> bool:
        permissions = await self.get_permissions_for_role(role_id)
        if "*" in permissions:
            return True
        return permission in permissions

    async def list_roles(self):
        return await self.role_repo.list_all()

    async def list_permissions(self):
        return await self.permission_repo.list_all()

    async def get_role_by_id(self, role_id: UUID):
        return await self.role_repo.get_by_id(role_id)

    async def get_permission_matrix(self) -> dict[str, list[str]]:
        roles = await self.role_repo.list_all()
        matrix: dict[str, list[str]] = {}
        for role in roles:
            if role.name.value == "ADMIN":
                matrix[role.name.value] = ["*"]
            else:
                perms = [
                    rp.permission.name
                    for rp in role.role_permissions
                    if rp.permission and rp.deleted_at is None
                ]
                matrix[role.name.value] = perms
        return matrix
