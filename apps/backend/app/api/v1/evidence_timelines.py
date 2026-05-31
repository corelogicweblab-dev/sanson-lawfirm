from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_client_ip, get_current_user, get_user_agent, require_permission
from app.core.responses import success_response
from app.domain.authenticated_user import AuthenticatedUser
from app.schemas.document_mappers import to_evidence_timeline
from app.services.document_service import DocumentService

router = APIRouter()


@router.get("/")
async def list_timelines(
    case_id: UUID | None = None,
    legal_request_id: UUID | None = None,
    document_id: UUID | None = None,
    _user: AuthenticatedUser = Depends(require_permission("evidence_timelines:read")),
    db: AsyncSession = Depends(get_db),
):
    svc = DocumentService(db)
    rows = await svc.list_evidence_timelines(case_id, legal_request_id, document_id)
    return success_response(
        [to_evidence_timeline(t) for t in rows],
        "Evidence timeline retrieved",
    )


@router.post("/generate/{document_id}")
async def generate_timeline(
    document_id: UUID,
    user: AuthenticatedUser = Depends(require_permission("evidence_timelines:write")),
    db: AsyncSession = Depends(get_db),
    ip: str | None = Depends(get_client_ip),
    ua: str | None = Depends(get_user_agent),
):
    from sqlalchemy import select

    from app.models.documents import OcrResult

    svc = DocumentService(db)
    staff = user.role_name in ("LAWYER", "PARALEGAL", "ADMIN")
    doc = await svc.get_document(document_id, user.id, staff)
    if not doc:
        raise HTTPException(404, "Document not found")

    ocr_result = await db.execute(
        select(OcrResult)
        .where(OcrResult.document_id == document_id)
        .order_by(OcrResult.created_at.desc())
        .limit(1)
    )
    ocr_row = ocr_result.scalar_one_or_none()
    text = ocr_row.raw_text if ocr_row else ""
    if not text:
        ocr_row = await svc.run_ocr(doc, user.id, ip, ua)
        text = ocr_row.raw_text or ""

    rows = await svc.generate_evidence_timeline(doc, text, user.id, ip, ua)
    return success_response(
        [to_evidence_timeline(t) for t in rows],
        "Timeline generated",
    )
