from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, UserProfile, UserStatusEnum
from app.repositories.user_repository import RoleRepository, UserProfileRepository, UserRepository
from app.services.audit_service import AuditService


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.profile_repo = UserProfileRepository(db)
        self.role_repo = RoleRepository(db)
        self.audit = AuditService(db)

    async def get_user(self, user_id: UUID) -> User | None:
        return await self.user_repo.get_by_id(user_id)

    async def get_me(self, user_id: UUID) -> User | None:
        return await self.user_repo.get_by_id(user_id)

    async def list_users(
        self,
        page: int = 1,
        page_size: int = 20,
        role_name: str | None = None,
    ) -> tuple[list[User], int]:
        offset = (page - 1) * page_size
        return await self.user_repo.list_users(offset, page_size, role_name)

    async def update_profile(
        self,
        user_id: UUID,
        performed_by: UUID,
        first_name: str | None = None,
        middle_name: str | None = None,
        last_name: str | None = None,
        suffix: str | None = None,
        phone: str | None = None,
        address: str | None = None,
        profile_photo: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> UserProfile | None:
        profile = await self.profile_repo.get_by_user_id(user_id)
        if not profile:
            return None

        old_values = {
            "first_name": profile.first_name,
            "last_name": profile.last_name,
            "phone": profile.phone,
        }

        if first_name is not None:
            profile.first_name = first_name
        if middle_name is not None:
            profile.middle_name = middle_name
        if last_name is not None:
            profile.last_name = last_name
        if suffix is not None:
            profile.suffix = suffix
        if phone is not None:
            profile.phone = phone
        if address is not None:
            profile.address = address
        if profile_photo is not None:
            profile.profile_photo = profile_photo

        await self.profile_repo.update(profile)

        await self.audit.log(
            action="profile.update",
            entity_type="user_profiles",
            entity_id=profile.id,
            performed_by=performed_by,
            ip_address=ip_address,
            user_agent=user_agent,
            old_values=old_values,
            new_values={
                "first_name": profile.first_name,
                "last_name": profile.last_name,
                "phone": profile.phone,
            },
        )
        return profile

    async def update_role(
        self,
        user_id: UUID,
        role_name: str,
        performed_by: UUID,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> User | None:
        user = await self.user_repo.get_by_id(user_id)
        role = await self.role_repo.get_by_name(role_name)
        if not user or not role:
            return None

        old_role = user.role.name.value if user.role else None
        user.role_id = role.id
        await self.user_repo.update(user)
        await self.db.refresh(user, ["role"])

        await self.audit.log(
            action="role.change",
            entity_type="users",
            entity_id=user.id,
            performed_by=performed_by,
            ip_address=ip_address,
            user_agent=user_agent,
            old_values={"role": old_role},
            new_values={"role": role_name},
        )
        return user

    async def set_active(
        self,
        user_id: UUID,
        is_active: bool,
        performed_by: UUID,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> User | None:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            return None

        user.is_active = is_active
        user.status = UserStatusEnum.ACTIVE if is_active else UserStatusEnum.INACTIVE
        await self.user_repo.update(user)

        action = "user.activate" if is_active else "user.deactivate"
        await self.audit.log(
            action=action,
            entity_type="users",
            entity_id=user.id,
            performed_by=performed_by,
            ip_address=ip_address,
            user_agent=user_agent,
            new_values={"is_active": is_active},
        )
        return user

    async def get_dashboard_stats(self) -> dict:
        counts = await self.user_repo.count_by_role()
        total = sum(counts.values())
        return {
            "total_users": total,
            "clients": counts.get("CLIENT", 0),
            "lawyers": counts.get("LAWYER", 0),
            "paralegals": counts.get("PARALEGAL", 0),
            "admins": counts.get("ADMIN", 0),
        }
