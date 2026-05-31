from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.ops import DeploymentEnvironmentEnum, DeploymentLog, DeploymentStatusEnum, MigrationRun


class DeploymentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.settings = get_settings()

    async def record_deployment(
        self,
        service: str,
        version: str | None = None,
        git_ref: str | None = None,
        environment: str | None = None,
        status: str = "success",
        deployed_by: str | None = None,
        metadata: dict | None = None,
    ) -> DeploymentLog:
        env = environment or self.settings.environment or "production"
        row = DeploymentLog(
            environment=DeploymentEnvironmentEnum(env),
            service=service,
            version=version or self.settings.app_version,
            git_ref=git_ref or self.settings.git_commit_sha or None,
            status=DeploymentStatusEnum(status),
            deployed_at=datetime.now(timezone.utc),
            deployed_by=deployed_by,
            metadata_=metadata or {},
        )
        self.db.add(row)
        await self.db.flush()
        return row

    async def migration_status(self) -> dict:
        result = await self.db.execute(
            select(MigrationRun).order_by(MigrationRun.version.asc())
        )
        rows = list(result.scalars().all())
        return {
            "applied_count": len(rows),
            "latest_version": rows[-1].version if rows else None,
            "migrations": [
                {
                    "version": m.version,
                    "filename": m.filename,
                    "status": m.status.value,
                    "appliedAt": m.applied_at.isoformat(),
                }
                for m in rows
            ],
        }

    async def record_migration(
        self,
        version: str,
        filename: str,
        status: str = "applied",
        applied_by: str | None = None,
        notes: str | None = None,
    ) -> MigrationRun:
        from app.models.ops import MigrationRunStatusEnum

        existing = await self.db.execute(
            select(MigrationRun).where(MigrationRun.version == version)
        )
        row = existing.scalar_one_or_none()
        if row:
            row.status = MigrationRunStatusEnum(status)
            row.notes = notes
            return row
        row = MigrationRun(
            version=version,
            filename=filename,
            status=MigrationRunStatusEnum(status),
            applied_at=datetime.now(timezone.utc),
            applied_by=applied_by,
            notes=notes,
        )
        self.db.add(row)
        await self.db.flush()
        return row
