import base64
from datetime import date, datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, UserProfile, UserStatusEnum
from app.repositories.user_repository import RoleRepository, UserProfileRepository, UserRepository
from app.services.audit_service import AuditService
from app.services.r2_storage import R2StorageService

AVATAR_MAX_BYTES = 2 * 1024 * 1024
AVATAR_MIME = {"image/png", "image/jpeg", "image/jpg", "image/webp"}


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.profile_repo = UserProfileRepository(db)
        self.role_repo = RoleRepository(db)
        self.audit = AuditService(db)

    async def create_firm_client(
        self,
        *,
        email: str,
        first_name: str,
        last_name: str,
        middle_name: str | None = None,
        suffix: str | None = None,
        phone: str | None = None,
        address: str | None = None,
        client_details: dict | None = None,
        performed_by: UUID,
    ) -> User:
        from uuid import uuid4

        from app.models import User, UserProfile, UserStatusEnum

        email_norm = email.strip().lower()
        existing = await self.user_repo.get_by_email(email_norm)
        if existing:
            return existing
        role = await self.role_repo.get_by_name("CLIENT")
        if not role:
            raise ValueError("CLIENT role not found")
        user = User(
            firebase_uid=f"firm-client-{uuid4()}",
            email=email_norm,
            role_id=role.id,
            status=UserStatusEnum.ACTIVE,
            is_active=True,
        )
        await self.user_repo.create(user)
        profile = UserProfile(
            user_id=user.id,
            first_name=first_name,
            middle_name=middle_name,
            last_name=last_name,
            suffix=suffix,
            phone=phone,
            address=address,
            client_details=client_details or {},
        )
        await self.profile_repo.create(profile)
        await self.audit.log(
            "client.create",
            "users",
            user.id,
            performed_by,
            new_values={"email": email_norm},
        )
        return user

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

    def resolve_profile_photo_url(self, profile_photo: str | None) -> str | None:
        if not profile_photo:
            return None
        if profile_photo.startswith(("http://", "https://", "data:")):
            return profile_photo
        if profile_photo.startswith("r2:"):
            storage_path = profile_photo[3:]
            storage = R2StorageService()
            if storage.configured:
                try:
                    return storage.generate_presigned_download_url(storage_path)
                except Exception:
                    return None
        return profile_photo

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
        nickname: str | None = None,
        date_of_birth: date | None = None,
        profile_photo: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
        *,
        clear_middle_name: bool = False,
        clear_nickname: bool = False,
        clear_date_of_birth: bool = False,
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
        if clear_middle_name:
            profile.middle_name = None
        elif middle_name is not None:
            profile.middle_name = middle_name.strip() or None
        if last_name is not None:
            profile.last_name = last_name
        if suffix is not None:
            profile.suffix = suffix
        if phone is not None:
            profile.phone = phone
        if address is not None:
            profile.address = address
        if clear_nickname:
            profile.nickname = None
        elif nickname is not None:
            profile.nickname = nickname.strip() or None
        if clear_date_of_birth:
            profile.date_of_birth = None
        elif date_of_birth is not None:
            profile.date_of_birth = date_of_birth
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

    async def update_email(
        self,
        user_id: UUID,
        email: str,
        performed_by: UUID,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> User | None:
        email_norm = email.strip().lower()
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            return None
        existing = await self.user_repo.get_by_email(email_norm)
        if existing and existing.id != user_id:
            raise ValueError("Email is already in use")
        old_email = user.email
        user.email = email_norm
        await self.user_repo.update(user)
        await self.audit.log(
            action="profile.email_change",
            entity_type="users",
            entity_id=user.id,
            performed_by=performed_by,
            ip_address=ip_address,
            user_agent=user_agent,
            old_values={"email": old_email},
            new_values={"email": email_norm},
        )
        return user

    async def upload_profile_avatar(
        self,
        user_id: UUID,
        file_data: bytes,
        mime_type: str,
        filename: str,
        performed_by: UUID,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> UserProfile | None:
        if len(file_data) > AVATAR_MAX_BYTES:
            raise ValueError("Profile photo must be 2MB or smaller")
        mime = (mime_type or "").lower()
        if mime not in AVATAR_MIME:
            raise ValueError("Only PNG, JPEG, or WebP images are allowed")

        profile = await self.profile_repo.get_by_user_id(user_id)
        if not profile:
            return None

        ext = ".jpg"
        if "png" in mime:
            ext = ".png"
        elif "webp" in mime:
            ext = ".webp"

        storage = R2StorageService()
        storage_ref: str
        if storage.configured:
            storage_path = f"profiles/{user_id}/avatar{ext}"
            storage.upload_bytes(storage_path, file_data, mime)
            storage_ref = f"r2:{storage_path}"
        else:
            b64 = base64.b64encode(file_data).decode("ascii")
            storage_ref = f"data:{mime};base64,{b64}"

        profile.profile_photo = storage_ref
        await self.profile_repo.update(profile)
        await self.audit.log(
            action="profile.avatar_upload",
            entity_type="user_profiles",
            entity_id=profile.id,
            performed_by=performed_by,
            ip_address=ip_address,
            user_agent=user_agent,
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

    async def soft_delete_user(
        self,
        user_id: UUID,
        performed_by: UUID,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> User | None:
        if user_id == performed_by:
            raise ValueError("You cannot delete your own account")
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            return None
        user.deleted_at = datetime.now(timezone.utc)
        user.is_active = False
        user.status = UserStatusEnum.INACTIVE
        await self.user_repo.update(user)
        await self.audit.log(
            action="user.delete",
            entity_type="users",
            entity_id=user.id,
            performed_by=performed_by,
            ip_address=ip_address,
            user_agent=user_agent,
            old_values={"email": user.email, "is_active": True},
            new_values={"deleted": True},
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
