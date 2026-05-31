from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_client_ip, get_current_user, get_user_agent, require_permission
from app.core.responses import success_response
from app.domain.authenticated_user import AuthenticatedUser
from app.models.documents import OcrResult
from app.schemas.document_mappers import to_ocr
from app.services.document_service import DocumentService

router = APIRouter()


@router.post("/{document_id}")
async def run_ocr(
    document_id: UUID,
    user: AuthenticatedUser = Depends(require_permission("ocr:run")),
    db: AsyncSession = Depends(get_db),
    ip: str | None = Depends(get_client_ip),
    ua: str | None = Depends(get_user_agent),
):
    svc = DocumentService(db)
    staff = user.role_name in ("LAWYER", "PARALEGAL", "ADMIN")
    doc = await svc.get_document(document_id, user.id, staff)
    if not doc:
        raise HTTPException(404, "Document not found")
    row = await svc.run_ocr(doc, user.id, ip, ua)
    return success_response(to_ocr(row), "OCR completed")


@router.get("/{document_id}")
async def get_ocr_results(
    document_id: UUID,
    user: AuthenticatedUser = Depends(require_permission("documents:read")),
    db: AsyncSession = Depends(get_db),
):
    svc = DocumentService(db)
    staff = user.role_name in ("LAWYER", "PARALEGAL", "ADMIN")
    doc = await svc.get_document(document_id, user.id, staff)
    if not doc:
        raise HTTPException(404, "Document not found")
    result = await db.execute(
        select(OcrResult)
        .where(OcrResult.document_id == document_id)
        .order_by(OcrResult.created_at.desc())
    )
    rows = list(result.scalars().all())
    return success_response([to_ocr(r) for r in rows], "OCR results retrieved")
