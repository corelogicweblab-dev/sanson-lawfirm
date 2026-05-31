from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.legal import Case, LegalRequest


async def generate_request_reference(db: AsyncSession) -> str:
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    prefix = f"REQ-{today}-"
    result = await db.execute(
        select(func.count(LegalRequest.id)).where(
            LegalRequest.request_reference.like(f"{prefix}%")
        )
    )
    count = (result.scalar() or 0) + 1
    return f"{prefix}{count:04d}"


async def generate_case_number(db: AsyncSession) -> str:
    year = datetime.now(timezone.utc).strftime("%Y")
    prefix = f"CASE-{year}-"
    result = await db.execute(
        select(func.count(Case.id)).where(Case.case_number.like(f"{prefix}%"))
    )
    count = (result.scalar() or 0) + 1
    return f"{prefix}{count:05d}"

