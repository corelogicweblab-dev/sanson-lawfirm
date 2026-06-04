from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import check_database_connection
from app.models.security import BackupLog, BackupStatusEnum, RequestMetric, SystemSetting
from app.services.ai_audit_service import AiAuditService


class SystemService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.settings = get_settings()

    async def load_settings_cache(self) -> dict[str, dict]:
        result = await self.db.execute(select(SystemSetting))
        return {s.key: s.value for s in result.scalars().all()}

    async def get_setting(self, key: str) -> SystemSetting | None:
        result = await self.db.execute(select(SystemSetting).where(SystemSetting.key == key))
        return result.scalar_one_or_none()

    async def get_setting_value(self, key: str, default: dict | None = None) -> dict:
        row = await self.get_setting(key)
        return row.value if row else (default or {})

    async def update_setting(self, key: str, value: dict, user_id: UUID) -> SystemSetting:
        row = await self.get_setting(key)
        if not row:
            row = SystemSetting(key=key, value=value, updated_by=user_id)
            self.db.add(row)
        else:
            row.value = value
            row.updated_by = user_id
            row.updated_at = datetime.now(timezone.utc)
        await self.db.flush()
        return row

    async def record_metric(
        self,
        route: str,
        method: str,
        status_code: int,
        duration_ms: int,
        correlation_id: str | None,
    ) -> None:
        row = RequestMetric(
            route=route,
            method=method,
            status_code=status_code,
            duration_ms=duration_ms,
            correlation_id=correlation_id,
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(row)

    async def health_dashboard(self) -> dict:
        db_ok = await check_database_connection()
        ai_svc = AiAuditService(self.db)

        err_count = (
            await self.db.execute(
                select(func.count(RequestMetric.id)).where(RequestMetric.status_code >= 500)
            )
        ).scalar() or 0

        req_count = (
            await self.db.execute(select(func.count(RequestMetric.id)))
        ).scalar() or 0

        avg_latency = (
            await self.db.execute(select(func.avg(RequestMetric.duration_ms)))
        ).scalar()

        from app.services.qdrant_service import QdrantService

        qdrant = QdrantService()

        if self.settings.gemini_configured:
            ai_provider = "gemini"
        elif self.settings.openai_configured:
            ai_provider = "openai"
        else:
            ai_provider = "none"

        return {
            "uptime": "operational",
            "database": "connected" if db_ok else "unavailable",
            "api_version": self.settings.api_version,
            "openai_configured": self.settings.openai_configured,
            "gemini_configured": self.settings.gemini_configured,
            "ai_chat_configured": self.settings.ai_chat_configured,
            "ai_provider": ai_provider,
            "qdrant_configured": qdrant.configured,
            "r2_configured": self.settings.r2_configured,
            "firebase_configured": self.settings.firebase_configured,
            "request_metrics": {
                "total_samples": req_count,
                "error_count": err_count,
                "avg_latency_ms": round(float(avg_latency or 0), 2),
            },
            "ai_usage": await ai_svc.usage_summary(),
            "realtime": {"supabase_configured": bool(self.settings.supabase_url)},
        }

    async def record_backup(
        self, backup_type: str, storage_target: str, status: str = "STARTED"
    ) -> BackupLog:
        row = BackupLog(
            backup_type=backup_type,
            status=BackupStatusEnum(status),
            storage_target=storage_target,
            started_at=datetime.now(timezone.utc),
        )
        self.db.add(row)
        await self.db.flush()
        return row

    async def list_backups(self, limit: int = 20) -> list[BackupLog]:
        result = await self.db.execute(
            select(BackupLog).order_by(BackupLog.started_at.desc()).limit(limit)
        )
        return list(result.scalars().all())
