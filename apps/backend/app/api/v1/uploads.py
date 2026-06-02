from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_permission
from app.core.responses import success_response
from app.domain.authenticated_user import AuthenticatedUser
from app.schemas.documents import PresignUploadRequest
from app.services.document_service import DocumentService

router = APIRouter()


@router.post("/presign")
async def presign_upload(
    body: PresignUploadRequest,
    user: AuthenticatedUser = Depends(require_permission("documents:write")),
    db: AsyncSession = Depends(get_db),
):
    try:
        case_id = UUID(body.case_id.strip())
    except ValueError as exc:
        raise HTTPException(400, "Invalid case_id") from exc
    svc = DocumentService(db)
    try:
        data = await svc.get_presigned_upload(
            user.id, body.file_name, body.mime_type, body.file_size, case_id
        )
    except ValueError as exc:
        raise HTTPException(400, str(exc))
    return success_response(data, "Upload URL generated")
