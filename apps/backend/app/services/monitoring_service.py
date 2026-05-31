from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.env_validation import validate_environment
from app.models.knowledge import SearchHistory
from app.models.ops import DeploymentLog
from app.models.security import RequestMetric
from app.services.alerting_service import AlertingService
from app.services.system_service import SystemService


class MonitoringService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.settings = get_settings()
        self.system = SystemService(db)
        self.alerts = AlertingService(db)

    async def operations_dashboard(self) -> dict:
        health = await self.system.health_dashboard()
        env_check = validate_environment(self.settings)
        alert_summary = await self.alerts.alert_summary()

        search_count = (
            await self.db.execute(select(func.count(SearchHistory.id)))
        ).scalar() or 0

        p95 = await self._latency_percentile(95)
        targets = await self.system.get_setting_value("performance_targets", {})
        scaling = await self.system.get_setting_value("scaling_readiness", {})

        await self.alerts.evaluate_thresholds(health)

        return {
            "environment": self.settings.environment,
            "git_ref": self.settings.git_commit_sha or None,
            "frontend_url": self.settings.frontend_url or None,
            "env_validation": env_check.to_dict(),
            "health": health,
            "alerts": alert_summary,
            "search_metrics": {
                "total_searches": search_count,
                "qdrant_configured": health.get("qdrant_configured"),
            },
            "storage_metrics": {
                "r2_configured": health.get("r2_configured"),
                "bucket": self.settings.r2_bucket_name,
            },
            "performance": {
                "avg_latency_ms": health.get("request_metrics", {}).get("avg_latency_ms"),
                "p95_latency_ms": p95,
                "targets": targets,
                "api_within_target": (health.get("request_metrics", {}).get("avg_latency_ms") or 0)
                <= targets.get("api_avg_ms", 500),
            },
            "scaling_readiness": scaling,
            "integrations": {
                "firebase": health.get("firebase_configured"),
                "openai": health.get("openai_configured"),
                "qdrant": health.get("qdrant_configured"),
                "r2": health.get("r2_configured"),
                "supabase_realtime": health.get("realtime", {}).get("supabase_configured"),
            },
        }

    async def _latency_percentile(self, pct: int) -> float:
        result = await self.db.execute(
            select(RequestMetric.duration_ms)
            .order_by(RequestMetric.duration_ms.asc())
            .limit(500)
        )
        values = [r[0] for r in result.all()]
        if not values:
            return 0.0
        idx = min(int(len(values) * pct / 100), len(values) - 1)
        return float(values[idx])

    async def list_deployments(self, limit: int = 30) -> list[DeploymentLog]:
        result = await self.db.execute(
            select(DeploymentLog).order_by(DeploymentLog.deployed_at.desc()).limit(limit)
        )
        return list(result.scalars().all())
