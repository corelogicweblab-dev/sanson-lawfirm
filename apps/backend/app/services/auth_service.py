from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, UserProfile, UserRoleEnum, UserStatusEnum
from app.repositories.user_repository import RoleRepository, UserProfileRepository, UserRepository
from app.services.audit_service import AuditService

# Maps known firm emails to roles (test accounts + first-login routing)
EMAIL_ROLE_MAP: dict[str, str] = {
    "admin@sansonlaw.ph": "ADMIN",
    "lawyer@sansonlaw.ph": "LAWYER",
    "paralegal@sansonlaw.ph": "PARALEGAL",
    "client@sansonlaw.ph": "CLIENT",
}


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.profile_repo = UserProfileRepository(db)
        self.role_repo = RoleRepository(db)
        self.audit = AuditService(db)

    async def get_user_by_firebase_uid(self, firebase_uid: str) -> User | None:
        return await self.user_repo.get_by_firebase_uid(firebase_uid)

    async def get_user_by_dev_token(self, token: str) -> User | None:
        """Development fallback when Firebase is not configured."""
        if token.startswith("dev:"):
            email = token[4:]
            return await self.user_repo.get_by_email(email)
        return None

    async def sync_user(
        self,
        firebase_uid: str,
        email: str,
        first_name: str = "User",
        last_name: str = "",
        phone: str | None = None,
        role_name: str = "CLIENT",
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> tuple[User, bool]:
        email_key = (email or "").strip().lower()
        mapped_role = EMAIL_ROLE_MAP.get(email_key)
        if mapped_role:
            role_name = mapped_role

        existing = await self.user_repo.get_by_firebase_uid(firebase_uid)
        if existing:
            existing.last_login_at = datetime.now(timezone.utc)
            if mapped_role:
                role = await self.role_repo.get_by_name(mapped_role)
                if role and existing.role_id != role.id:
                    existing.role_id = role.id
            await self.user_repo.update(existing)
            await self.db.refresh(existing, ["role", "profile"])
            await self.audit.log(
                action="user.login",
                entity_type="users",
                entity_id=existing.id,
                performed_by=existing.id,
                ip_address=ip_address,
                user_agent=user_agent,
            )
            return existing, False

        role = await self.role_repo.get_by_name(role_name)
        if not role:
            role = await self.role_repo.get_by_name("CLIENT")

        user = User(
            firebase_uid=firebase_uid,
            email=email,
            role_id=role.id,
            status=UserStatusEnum.ACTIVE,
            is_active=True,
            last_login_at=datetime.now(timezone.utc),
        )
        await self.user_repo.create(user)

        profile = UserProfile(
            user_id=user.id,
            first_name=first_name,
            last_name=last_name or "User",
            phone=phone,
        )
        await self.profile_repo.create(profile)

        await self.db.refresh(user, ["role"])
        user.profile = profile

        await self.audit.log(
            action="user.register",
            entity_type="users",
            entity_id=user.id,
            performed_by=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            new_values={"email": email, "role": role_name},
        )
        return user, True

    async def logout(
        self,
        user_id: UUID,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> None:
        await self.audit.log(
            action="user.logout",
            entity_type="users",
            entity_id=user_id,
            performed_by=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
        )
