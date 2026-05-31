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
        entry = AuditLog(
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            performed_by=performed_by,
            ip_address=ip_address,
            user_agent=user_agent,
            old_values=old_values,
            new_values=new_values,
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
