from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.security import SecurityEvent, SecurityEventSeverityEnum
from app.services.audit_service import AuditService


class SecurityService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.audit = AuditService(db)

    async def record_event(
        self,
        event_type: str,
        description: str,
        severity: str = "INFO",
        user_id: UUID | None = None,
        ip: str | None = None,
        ua: str | None = None,
        metadata: dict | None = None,
    ) -> SecurityEvent:
        sev = SecurityEventSeverityEnum(severity)
        event = SecurityEvent(
            user_id=user_id,
            event_type=event_type,
            severity=sev,
            description=description,
            ip_address=ip,
            user_agent=ua,
            metadata_=metadata or {},
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(event)
        await self.db.flush()
        return event

    async def list_events(self, limit: int = 50) -> list[SecurityEvent]:
        result = await self.db.execute(
            select(SecurityEvent).order_by(SecurityEvent.created_at.desc()).limit(limit)
        )
        return list(result.scalars().all())

    async def record_login_success(self, user_id: UUID, ip: str | None, ua: str | None) -> None:
        await self.record_event("auth.login_success", "User authenticated", "INFO", user_id, ip, ua)
        await self.audit.log_intelligent(
            action="auth.login",
            resource_type="users",
            resource_id=user_id,
            actor_id=user_id,
            ip_address=ip,
            user_agent=ua,
        )

    async def record_login_failure(self, email: str, ip: str | None, ua: str | None) -> None:
        await self.record_event(
            "auth.login_failed",
            f"Failed login attempt for {email}",
            "WARNING",
            ip=ip,
            ua=ua,
            metadata={"email": email},
        )
