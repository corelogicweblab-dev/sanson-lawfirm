import logging
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import Response
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

from app.core.database import get_db
from app.core.dependencies import get_client_ip, get_current_user, get_user_agent, require_permission
from app.core.responses import PaginationMeta, PaginationParams, success_response
from app.domain.authenticated_user import AuthenticatedUser
from app.schemas.document_mappers import to_analysis, to_category, to_document, to_ocr, to_version
import base64

from app.schemas.documents import (
    CompleteDocumentUploadRequest,
    DocumentJsonUploadRequest,
    DocumentReviewUpdate,
)
from app.services.document_service import DocumentService

router = APIRouter()


def _optional_uuid(value: str | None, field: str) -> UUID | None:
    if not value or not value.strip():
        return None
    try:
        return UUID(value.strip())
    except ValueError as exc:
        raise HTTPException(400, f"Invalid {field}") from exc


def _is_staff(user: AuthenticatedUser) -> bool:
    return user.role_name in ("LAWYER", "PARALEGAL", "ADMIN")


def _upload_http_error(exc: Exception) -> HTTPException:
    if isinstance(exc, HTTPException):
        return exc
    if isinstance(exc, ValueError):
        return HTTPException(400, str(exc))
    if isinstance(exc, SQLAlchemyError):
        logger.exception("document_upload_db_error")
        return HTTPException(
            400,
            "Could not save document to the database. Verify the case exists and try again.",
        )
    logger.exception("document_upload_failed")
    return HTTPException(
        503,
        "File storage is not ready on the server. Add SUPABASE_SERVICE_ROLE_KEY on Render "
        "and create a Storage bucket named 'documents' in Supabase.",
    )


@router.get("/categories")
async def list_categories(
    _user: AuthenticatedUser = Depends(require_permission("documents:read")),
    db: AsyncSession = Depends(get_db),
):
    svc = DocumentService(db)
    cats = await svc.list_categories()
    return success_response([to_category(c) for c in cats], "Categories retrieved")


@router.get("/")
async def list_documents(
    pagination: PaginationParams = Depends(),
    case_id: UUID | None = None,
    legal_request_id: UUID | None = None,
    user: AuthenticatedUser = Depends(require_permission("documents:read")),
    db: AsyncSession = Depends(get_db),
):
    svc = DocumentService(db)
    staff = _is_staff(user)
    docs, total = await svc.list_documents(
        pagination.offset,
        pagination.page_size,
        user_id=user.id if not staff else None,
        case_id=case_id,
        legal_request_id=legal_request_id,
        is_staff=staff,
    )
    items = []
    for d in docs:
        url = svc.content_url(d.id) if staff or d.uploaded_by == user.id else None
        items.append(to_document(d, url))
    meta = PaginationMeta(
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
        total_pages=(total + pagination.page_size - 1) // pagination.page_size if pagination.page_size else 0,
    )
    return success_response(items, "Documents retrieved", meta=meta.model_dump())


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    category_id: str | None = Form(None),
    case_id: str | None = Form(None),
    legal_request_id: str | None = Form(None),
    visibility: str = Form("CLIENT"),
    user: AuthenticatedUser = Depends(require_permission("documents:write")),
    db: AsyncSession = Depends(get_db),
    ip: str | None = Depends(get_client_ip),
    ua: str | None = Depends(get_user_agent),
):
    if user.role_name == "LAWYER":
        raise HTTPException(
            status_code=403,
            detail="Lawyers review documents only. Paralegals manage case file uploads.",
        )
    data = await file.read()
    if not data:
        raise HTTPException(400, "Empty file")
    svc = DocumentService(db)
    try:
        doc = await svc.create_document_from_upload(
            user_id=user.id,
            filename=file.filename or "upload",
            mime_type=file.content_type or "application/octet-stream",
            file_data=data,
            category_id=_optional_uuid(category_id, "category_id"),
            case_id=_optional_uuid(case_id, "case_id"),
            legal_request_id=_optional_uuid(legal_request_id, "legal_request_id"),
            visibility=visibility,
            ip=ip,
            ua=ua,
        )
    except Exception as exc:
        raise _upload_http_error(exc) from exc
    return success_response(to_document(doc, svc.content_url(doc.id)), "Document uploaded")


@router.post("/upload/json")
async def upload_document_json(
    body: DocumentJsonUploadRequest,
    user: AuthenticatedUser = Depends(require_permission("documents:write")),
    db: AsyncSession = Depends(get_db),
    ip: str | None = Depends(get_client_ip),
    ua: str | None = Depends(get_user_agent),
):
    if user.role_name == "LAWYER":
        raise HTTPException(
            status_code=403,
            detail="Lawyers review documents only. Paralegals manage case file uploads.",
        )
    try:
        file_data = base64.b64decode(body.file_content_base64, validate=True)
    except Exception as exc:
        raise HTTPException(400, "Invalid file encoding") from exc
    if len(file_data) > 4 * 1024 * 1024:
        raise HTTPException(400, "File too large for JSON upload (max 4 MB). Retry — larger files use Supabase direct upload.")
    svc = DocumentService(db)
    try:
        doc = await svc.create_document_from_upload(
            user_id=user.id,
            filename=body.file_name,
            mime_type=body.mime_type,
            file_data=file_data,
            category_id=_optional_uuid(body.category_id, "category_id"),
            case_id=_optional_uuid(body.case_id, "case_id"),
            legal_request_id=_optional_uuid(body.legal_request_id, "legal_request_id"),
            visibility=body.visibility,
            ip=ip,
            ua=ua,
        )
    except Exception as exc:
        raise _upload_http_error(exc) from exc
    return success_response(to_document(doc, svc.content_url(doc.id)), "Document uploaded")


@router.post("/upload/complete")
async def complete_presigned_upload(
    body: CompleteDocumentUploadRequest,
    user: AuthenticatedUser = Depends(require_permission("documents:write")),
    db: AsyncSession = Depends(get_db),
    ip: str | None = Depends(get_client_ip),
    ua: str | None = Depends(get_user_agent),
):
    if user.role_name == "LAWYER":
        raise HTTPException(
            status_code=403,
            detail="Lawyers review documents only. Paralegals manage case file uploads.",
        )
    svc = DocumentService(db)
    try:
        doc = await svc.create_document_after_presigned(
            user_id=user.id,
            storage_path=body.storage_path.strip(),
            filename=body.file_name,
            mime_type=body.mime_type,
            file_size=body.file_size,
            category_id=_optional_uuid(body.category_id, "category_id"),
            case_id=_optional_uuid(body.case_id, "case_id"),
            legal_request_id=_optional_uuid(body.legal_request_id, "legal_request_id"),
            visibility=body.visibility,
            ip=ip,
            ua=ua,
        )
    except Exception as exc:
        raise _upload_http_error(exc) from exc
    return success_response(to_document(doc, svc.content_url(doc.id)), "Document uploaded")


@router.get("/{document_id}/content")
async def document_content(
    document_id: UUID,
    disposition: str = Query("inline", pattern="^(inline|attachment)$"),
    user: AuthenticatedUser = Depends(require_permission("documents:read")),
    db: AsyncSession = Depends(get_db),
):
    """Stream file bytes through the API (auth required). Avoids broken Supabase signed URLs in the browser."""
    svc = DocumentService(db)
    staff = _is_staff(user)
    doc = await svc.get_document(document_id, user.id, staff)
    if not doc:
        raise HTTPException(404, "Document not found")
    if not staff and doc.uploaded_by != user.id:
        from app.models.documents import DocumentVisibilityEnum

        if doc.visibility == DocumentVisibilityEnum.PRIVATE:
            raise HTTPException(403, "Not allowed")
    try:
        data = await svc.storage.download_bytes(doc.storage_path)
    except ValueError as exc:
        raise HTTPException(404, str(exc)) from exc
    filename = (doc.original_file_name or doc.file_name or "document").replace('"', "")
    disp = "attachment" if disposition == "attachment" else "inline"
    return Response(
        content=data,
        media_type=doc.mime_type or "application/octet-stream",
        headers={
            "Content-Disposition": f'{disp}; filename="{filename}"',
            "Content-Length": str(len(data)),
            "Cache-Control": "private, max-age=300",
        },
    )


@router.get("/{document_id}")
async def get_document(
    document_id: UUID,
    user: AuthenticatedUser = Depends(require_permission("documents:read")),
    db: AsyncSession = Depends(get_db),
):
    svc = DocumentService(db)
    doc = await svc.get_document(document_id, user.id, _is_staff(user))
    if not doc:
        raise HTTPException(404, "Document not found")
    url = svc.content_url(document_id)
    return success_response(to_document(doc, url), "Document retrieved")


@router.delete("/{document_id}")
async def delete_document(
    document_id: UUID,
    user: AuthenticatedUser = Depends(require_permission("documents:delete")),
    db: AsyncSession = Depends(get_db),
    ip: str | None = Depends(get_client_ip),
    ua: str | None = Depends(get_user_agent),
):
    svc = DocumentService(db)
    doc = await svc.get_document(document_id, user.id, _is_staff(user))
    if not doc:
        raise HTTPException(404, "Document not found")
    if user.role_name == "CLIENT" and doc.uploaded_by != user.id:
        raise HTTPException(403, "Not allowed")
    await svc.soft_delete(doc, user.id, ip, ua)
    return success_response(None, "Document deleted")


@router.patch("/{document_id}/review")
async def update_review(
    document_id: UUID,
    body: DocumentReviewUpdate,
    user: AuthenticatedUser = Depends(require_permission("documents:review")),
    db: AsyncSession = Depends(get_db),
    ip: str | None = Depends(get_client_ip),
    ua: str | None = Depends(get_user_agent),
):
    svc = DocumentService(db)
    doc = await svc.get_document(document_id, user.id, True)
    if not doc:
        raise HTTPException(404, "Document not found")
    doc = await svc.update_review_status(doc, body.review_status, user.id, ip, ua)
    return success_response(to_document(doc), "Review status updated")


@router.get("/{document_id}/versions")
async def list_versions(
    document_id: UUID,
    user: AuthenticatedUser = Depends(require_permission("documents:read")),
    db: AsyncSession = Depends(get_db),
):
    svc = DocumentService(db)
    doc = await svc.get_document(document_id, user.id, _is_staff(user))
    if not doc:
        raise HTTPException(404, "Document not found")
    return success_response([to_version(v) for v in doc.versions], "Versions retrieved")


@router.post("/{document_id}/process")
async def process_document(
    document_id: UUID,
    user: AuthenticatedUser = Depends(require_permission("document_analysis:run")),
    db: AsyncSession = Depends(get_db),
    ip: str | None = Depends(get_client_ip),
    ua: str | None = Depends(get_user_agent),
):
    svc = DocumentService(db)
    doc = await svc.get_document(document_id, user.id, _is_staff(user))
    if not doc:
        raise HTTPException(404, "Document not found")
    result = await svc.process_document_pipeline(doc, user.id, ip, ua)
    return success_response(
        {
            "ocr": to_ocr(result["ocr"]),
            "analysis": to_analysis(result["analysis"]),
            "timelineCount": len(result["timelines"]),
            "chunksIndexed": result.get("chunksIndexed", 0),
        },
        "Document processing complete",
    )


@router.post("/{document_id}/index-embeddings")
async def index_embeddings(
    document_id: UUID,
    user: AuthenticatedUser = Depends(require_permission("embeddings:run")),
    db: AsyncSession = Depends(get_db),
):
    from app.services.embedding_service import EmbeddingService

    svc = DocumentService(db)
    doc = await svc.get_document(document_id, user.id, _is_staff(user))
    if not doc:
        raise HTTPException(404, "Document not found")
    emb = EmbeddingService(db)
    count = await emb.index_document_from_db(document_id, user.id)
    return success_response({"chunksIndexed": count}, "Embeddings indexed")
