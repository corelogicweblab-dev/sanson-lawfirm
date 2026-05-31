from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AuditLog
from app.repositories.user_repository import AuditRepository


class AuditService:
    def __init__(self, db: AsyncSession):
        self.repo = AuditRepository(db)

    async def log(
        self,
        action: str,
        entity_type: str,
        entity_id: UUID | None = None,
        performed_by: UUID | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
        old_values: dict | None = None,
        new_values: dict | None = None,
        metadata: dict | None = None,
    ) -> AuditLog:
        return await self.log_intelligent(
            action=action,
            resource_type=entity_type,
            resource_id=entity_id,
            actor_id=performed_by,
            before_state=old_values,
            after_state=new_values,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata=metadata,
        )

    async def log_intelligent(
        self,
        action: str,
        resource_type: str,
        resource_id: UUID | None = None,
        actor_id: UUID | None = None,
        actor_role: str | None = None,
        before_state: dict | None = None,
        after_state: dict | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
        device_id: UUID | None = None,
        correlation_id: str | None = None,
        metadata: dict | None = None,
    ) -> AuditLog:
        entry = AuditLog(
            action=action,
            entity_type=resource_type,
            entity_id=resource_id,
            resource_type=resource_type,
            resource_id=resource_id,
            performed_by=actor_id,
            actor_role=actor_role,
            ip_address=ip_address,
            user_agent=user_agent,
            old_values=before_state,
            new_values=after_state,
            before_state=before_state,
            after_state=after_state,
            device_id=device_id,
            correlation_id=correlation_id,
            metadata_=metadata or {},
        )
        return await self.repo.create(entry)

    async def list_logs(
        self,
        page: int = 1,
        page_size: int = 20,
        action: str | None = None,
        entity_type: str | None = None,
    ) -> tuple[list[AuditLog], int]:
        offset = (page - 1) * page_size
        return await self.repo.list_logs(offset, page_size, action, entity_type)

    async def recent(self, limit: int = 10) -> list[AuditLog]:
        return await self.repo.recent(limit)
