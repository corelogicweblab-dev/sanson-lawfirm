from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ops import AlertCategoryEnum, AlertSeverityEnum, SystemAlert
from app.services.system_service import SystemService


class AlertingService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.system = SystemService(db)

    async def create_alert(
        self,
        title: str,
        message: str,
        category: str = "system",
        severity: str = "warning",
        source: str | None = None,
        metadata: dict | None = None,
    ) -> SystemAlert:
        row = SystemAlert(
            category=AlertCategoryEnum(category),
            severity=AlertSeverityEnum(severity),
            title=title[:200],
            message=message,
            source=source,
            metadata_=metadata or {},
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(row)
        await self.db.flush()
        return row

    async def list_alerts(self, limit: int = 50, unresolved_only: bool = True) -> list[SystemAlert]:
        q = select(SystemAlert).order_by(SystemAlert.created_at.desc()).limit(limit)
        if unresolved_only:
            q = q.where(SystemAlert.resolved.is_(False))
        result = await self.db.execute(q)
        return list(result.scalars().all())

    async def resolve_alert(self, alert_id: UUID, user_id: UUID) -> bool:
        result = await self.db.execute(select(SystemAlert).where(SystemAlert.id == alert_id))
        row = result.scalar_one_or_none()
        if not row:
            return False
        row.resolved = True
        row.resolved_at = datetime.now(timezone.utc)
        row.resolved_by = user_id
        return True

    async def evaluate_thresholds(self, metrics: dict) -> list[SystemAlert]:
        """Create alerts when SLO thresholds are breached."""
        thresholds = await self.system.get_setting_value("alert_thresholds", {})
        created: list[SystemAlert] = []

        req = metrics.get("request_metrics") or {}
        total = req.get("total_samples") or 0
        errors = req.get("error_count") or 0
        avg_ms = req.get("avg_latency_ms") or 0

        if total >= 20:
            err_pct = (errors / total) * 100
            max_err = float(thresholds.get("api_error_rate_pct", 5))
            if err_pct >= max_err:
                created.append(
                    await self.create_alert(
                        "High API error rate",
                        f"Error rate {err_pct:.1f}% exceeds {max_err}%",
                        category="api",
                        severity="critical" if err_pct >= max_err * 2 else "warning",
                        source="monitoring",
                    )
                )

        max_lat = float(thresholds.get("api_latency_ms", 2000))
        if avg_ms >= max_lat:
            created.append(
                await self.create_alert(
                    "API latency elevated",
                    f"Average latency {avg_ms}ms exceeds target {max_lat}ms",
                    category="api",
                    severity="warning",
                    source="monitoring",
                )
            )

        if metrics.get("database") == "unavailable":
            created.append(
                await self.create_alert(
                    "Database unavailable",
                    "PostgreSQL connection failed on readiness check",
                    category="database",
                    severity="critical",
                    source="health",
                )
            )

        if not metrics.get("openai_configured"):
            created.append(
                await self.create_alert(
                    "OpenAI not configured",
                    "AI features will use fallback responses",
                    category="ai",
                    severity="info",
                    source="health",
                )
            )

        return created

    async def alert_summary(self) -> dict:
        critical = (
            await self.db.execute(
                select(func.count(SystemAlert.id)).where(
                    SystemAlert.resolved.is_(False),
                    SystemAlert.severity == AlertSeverityEnum.CRITICAL,
                )
            )
        ).scalar() or 0
        open_count = (
            await self.db.execute(
                select(func.count(SystemAlert.id)).where(SystemAlert.resolved.is_(False))
            )
        ).scalar() or 0
        return {"open": open_count, "critical": critical}
