from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import AuditLog, Permission, Role, RolePermission, User, UserProfile, UserRoleEnum


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: UUID) -> User | None:
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.role), selectinload(User.profile))
            .where(User.id == user_id, User.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def get_by_firebase_uid(self, firebase_uid: str) -> User | None:
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.role), selectinload(User.profile))
            .where(User.firebase_uid == firebase_uid, User.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.role), selectinload(User.profile))
            .where(User.email == email, User.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def list_users(
        self,
        offset: int = 0,
        limit: int = 20,
        role_name: str | None = None,
    ) -> tuple[list[User], int]:
        query = (
            select(User)
            .options(selectinload(User.role), selectinload(User.profile))
            .where(User.deleted_at.is_(None))
        )
        count_query = select(func.count(User.id)).where(User.deleted_at.is_(None))

        if role_name:
            try:
                role_enum = UserRoleEnum[role_name]
            except KeyError:
                role_enum = None
            if role_enum:
                query = query.join(Role).where(Role.name == role_enum)
                count_query = count_query.join(Role).where(Role.name == role_enum)

        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        result = await self.db.execute(
            query.order_by(User.created_at.desc()).offset(offset).limit(limit)
        )
        return list(result.scalars().all()), total

    async def count_by_role(self) -> dict[str, int]:
        result = await self.db.execute(
            select(Role.name, func.count(User.id))
            .join(User, User.role_id == Role.id)
            .where(User.deleted_at.is_(None))
            .group_by(Role.name)
        )
        return {row[0].value: row[1] for row in result.all()}

    async def create(self, user: User) -> User:
        self.db.add(user)
        await self.db.flush()
        return user

    async def update(self, user: User) -> User:
        await self.db.flush()
        return user


class UserProfileRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_user_id(self, user_id: UUID) -> UserProfile | None:
        result = await self.db.execute(
            select(UserProfile).where(
                UserProfile.user_id == user_id, UserProfile.deleted_at.is_(None)
            )
        )
        return result.scalar_one_or_none()

    async def create(self, profile: UserProfile) -> UserProfile:
        self.db.add(profile)
        await self.db.flush()
        return profile

    async def update(self, profile: UserProfile) -> UserProfile:
        await self.db.flush()
        return profile


class RoleRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_name(self, name: str) -> Role | None:
        try:
            role_enum = UserRoleEnum[name.upper()]
        except KeyError:
            return None
        result = await self.db.execute(
            select(Role).where(Role.name == role_enum, Role.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, role_id: UUID) -> Role | None:
        result = await self.db.execute(
            select(Role)
            .options(selectinload(Role.role_permissions).selectinload(RolePermission.permission))
            .where(Role.id == role_id, Role.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def list_all(self) -> list[Role]:
        result = await self.db.execute(
            select(Role)
            .options(selectinload(Role.role_permissions).selectinload(RolePermission.permission))
            .where(Role.deleted_at.is_(None))
            .order_by(Role.name)
        )
        return list(result.scalars().all())


class PermissionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_all(self) -> list[Permission]:
        result = await self.db.execute(
            select(Permission)
            .where(Permission.deleted_at.is_(None))
            .order_by(Permission.module, Permission.name)
        )
        return list(result.scalars().all())

    async def get_for_role(self, role_id: UUID) -> list[str]:
        result = await self.db.execute(
            select(Permission.name)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .where(
                RolePermission.role_id == role_id,
                RolePermission.deleted_at.is_(None),
                Permission.deleted_at.is_(None),
            )
        )
        return [row[0] for row in result.all()]


class AuditRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, log: AuditLog) -> AuditLog:
        self.db.add(log)
        await self.db.flush()
        return log

    async def list_logs(
        self,
        offset: int = 0,
        limit: int = 20,
        action: str | None = None,
        entity_type: str | None = None,
    ) -> tuple[list[AuditLog], int]:
        query = select(AuditLog).where(AuditLog.deleted_at.is_(None))
        count_query = select(func.count(AuditLog.id)).where(AuditLog.deleted_at.is_(None))

        if action:
            query = query.where(AuditLog.action == action)
            count_query = count_query.where(AuditLog.action == action)
        if entity_type:
            query = query.where(AuditLog.entity_type == entity_type)
            count_query = count_query.where(AuditLog.entity_type == entity_type)

        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        result = await self.db.execute(
            query.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit)
        )
        return list(result.scalars().all()), total

    async def recent(self, limit: int = 10) -> list[AuditLog]:
        result = await self.db.execute(
            select(AuditLog)
            .where(AuditLog.deleted_at.is_(None))
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
