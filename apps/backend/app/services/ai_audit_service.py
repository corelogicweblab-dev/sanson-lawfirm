from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.security import AiAuditLog


class AiAuditService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def log(
        self,
        user_id: UUID | None,
        prompt_type: str,
        model_name: str,
        tokens_input: int = 0,
        tokens_output: int = 0,
        output_summary: str | None = None,
        confidence_score: float | None = None,
        recommendation: dict | None = None,
        session_id: UUID | None = None,
        correlation_id: str | None = None,
        ip_address: str | None = None,
    ) -> AiAuditLog:
        from datetime import datetime, timezone

        row = AiAuditLog(
            user_id=user_id,
            session_id=session_id,
            prompt_type=prompt_type,
            model_name=model_name,
            tokens_input=tokens_input,
            tokens_output=tokens_output,
            output_summary=output_summary,
            confidence_score=confidence_score,
            recommendation=recommendation,
            correlation_id=correlation_id,
            ip_address=ip_address,
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(row)
        await self.db.flush()
        return row

    async def list_logs(self, limit: int = 50, offset: int = 0) -> tuple[list[AiAuditLog], int]:
        total = (await self.db.execute(select(func.count(AiAuditLog.id)))).scalar() or 0
        result = await self.db.execute(
            select(AiAuditLog).order_by(AiAuditLog.created_at.desc()).offset(offset).limit(limit)
        )
        return list(result.scalars().all()), total

    async def usage_summary(self) -> dict:
        result = await self.db.execute(
            select(
                func.count(AiAuditLog.id),
                func.coalesce(func.sum(AiAuditLog.tokens_input), 0),
                func.coalesce(func.sum(AiAuditLog.tokens_output), 0),
            )
        )
        row = result.one()
        return {
            "total_calls": row[0] or 0,
            "tokens_input": int(row[1] or 0),
            "tokens_output": int(row[2] or 0),
        }
