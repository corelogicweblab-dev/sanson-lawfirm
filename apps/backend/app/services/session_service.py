import hashlib
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.security import SessionDevice, SessionStatusEnum, TokenBlacklist
from app.services.audit_service import AuditService
from app.services.system_service import SystemService


class SessionService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.audit = AuditService(db)
        self.system = SystemService(db)

    @staticmethod
    def hash_token(token: str) -> str:
        return hashlib.sha256(token.encode()).hexdigest()

    async def create_session(
        self,
        user_id: UUID,
        token: str,
        platform: str | None = None,
        ip: str | None = None,
        ua: str | None = None,
        mobile_device_id: UUID | None = None,
        actor_role: str | None = None,
    ) -> SessionDevice:
        policy = await self.system.get_setting_value("security_policy", {})
        max_sessions = int(policy.get("max_concurrent_sessions", 5))
        timeout_h = int(policy.get("session_timeout_hours", 24))

        active = await self.list_active_sessions(user_id)
        if len(active) >= max_sessions:
            oldest = active[-1]
            await self.revoke_session(oldest.id, user_id, "concurrent_limit_exceeded")

        now = datetime.now(timezone.utc)
        session = SessionDevice(
            user_id=user_id,
            mobile_device_id=mobile_device_id,
            session_token_hash=self.hash_token(token),
            status=SessionStatusEnum.ACTIVE,
            platform=platform,
            ip_address=ip,
            user_agent=ua,
            last_active_at=now,
            expires_at=now + timedelta(hours=timeout_h),
            created_at=now,
        )
        self.db.add(session)
        await self.db.flush()
        await self.audit.log_intelligent(
            action="session.created",
            resource_type="session_devices",
            resource_id=session.id,
            actor_id=user_id,
            actor_role=actor_role,
            ip_address=ip,
            user_agent=ua,
        )
        return session

    async def is_token_revoked(self, token: str) -> bool:
        h = self.hash_token(token)
        result = await self.db.execute(
            select(TokenBlacklist).where(TokenBlacklist.token_hash == h)
        )
        return result.scalar_one_or_none() is not None

    async def blacklist_token(self, token: str, user_id: UUID | None, reason: str) -> None:
        row = TokenBlacklist(
            token_hash=self.hash_token(token),
            user_id=user_id,
            reason=reason,
            revoked_at=datetime.now(timezone.utc),
        )
        self.db.add(row)
        await self.db.flush()

    async def list_active_sessions(self, user_id: UUID) -> list[SessionDevice]:
        result = await self.db.execute(
            select(SessionDevice)
            .where(
                SessionDevice.user_id == user_id,
                SessionDevice.status == SessionStatusEnum.ACTIVE,
            )
            .order_by(SessionDevice.last_active_at.desc())
        )
        return list(result.scalars().all())

    async def revoke_session(
        self, session_id: UUID, user_id: UUID, reason: str = "admin_revoke"
    ) -> bool:
        result = await self.db.execute(
            select(SessionDevice).where(
                SessionDevice.id == session_id, SessionDevice.user_id == user_id
            )
        )
        session = result.scalar_one_or_none()
        if not session:
            return False
        session.status = SessionStatusEnum.REVOKED
        session.revoked_at = datetime.now(timezone.utc)
        session.revoke_reason = reason
        row = TokenBlacklist(
            token_hash=session.session_token_hash,
            user_id=user_id,
            reason=reason,
            revoked_at=datetime.now(timezone.utc),
        )
        self.db.add(row)
        await self.audit.log_intelligent(
            action="session.revoked",
            resource_type="session_devices",
            resource_id=session_id,
            actor_id=user_id,
            new_values={"reason": reason},
        )
        return True

    async def revoke_session_by_id(
        self, session_id: UUID, reason: str = "admin_revoke", actor_id: UUID | None = None
    ) -> bool:
        result = await self.db.execute(
            select(SessionDevice).where(SessionDevice.id == session_id)
        )
        session = result.scalar_one_or_none()
        if not session:
            return False
        return await self.revoke_session(session.id, session.user_id, reason)

    async def revoke_all_sessions(self, user_id: UUID, reason: str) -> int:
        sessions = await self.list_active_sessions(user_id)
        for s in sessions:
            await self.revoke_session(s.id, user_id, reason)
        return len(sessions)

    async def list_all_active(self, limit: int = 100) -> list[SessionDevice]:
        result = await self.db.execute(
            select(SessionDevice)
            .where(SessionDevice.status == SessionStatusEnum.ACTIVE)
            .order_by(SessionDevice.last_active_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def list_all_active_with_users(self, limit: int = 200) -> list[dict]:
        """Active sessions joined with user identity for the admin monitor."""
        from app.models import Role, User, UserProfile

        result = await self.db.execute(
            select(SessionDevice, User, UserProfile, Role)
            .join(User, User.id == SessionDevice.user_id)
            .outerjoin(UserProfile, UserProfile.user_id == User.id)
            .outerjoin(Role, Role.id == User.role_id)
            .where(SessionDevice.status == SessionStatusEnum.ACTIVE)
            .order_by(SessionDevice.last_active_at.desc())
            .limit(limit)
        )
        rows: list[dict] = []
        for session, user, profile, role in result.all():
            if profile:
                full_name = " ".join(
                    p
                    for p in [
                        profile.first_name,
                        profile.middle_name,
                        profile.last_name,
                        profile.suffix,
                    ]
                    if p
                ).strip()
            else:
                full_name = ""
            rows.append(
                {
                    "id": str(session.id),
                    "userId": str(session.user_id),
                    "fullName": full_name or (user.email if user else "Unknown user"),
                    "email": user.email if user else None,
                    "role": role.name.value if role and role.name else None,
                    "platform": session.platform or "WEB",
                    "ipAddress": str(session.ip_address) if session.ip_address else None,
                    "loginAt": session.created_at.isoformat() if session.created_at else None,
                    "lastActiveAt": session.last_active_at.isoformat()
                    if session.last_active_at
                    else None,
                    "expiresAt": session.expires_at.isoformat() if session.expires_at else None,
                    "lastLoginAt": user.last_login_at.isoformat()
                    if user and user.last_login_at
                    else None,
                }
            )
        return rows
