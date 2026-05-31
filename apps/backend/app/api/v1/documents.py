from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_client_ip, get_current_user, get_user_agent, require_permission
from app.core.responses import PaginationMeta, PaginationParams, success_response
from app.domain.authenticated_user import AuthenticatedUser
from app.schemas.document_mappers import to_analysis, to_category, to_document, to_ocr, to_version
from app.schemas.documents import DocumentReviewUpdate
from app.services.document_service import DocumentService

router = APIRouter()


def _is_staff(user: AuthenticatedUser) -> bool:
    return user.role_name in ("LAWYER", "PARALEGAL", "ADMIN")


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
        url = await svc.get_download_url(d) if staff or d.uploaded_by == user.id else None
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
    svc = DocumentService(db)
    try:
        doc = await svc.create_document_from_upload(
            user_id=user.id,
            filename=file.filename or "upload",
            mime_type=file.content_type or "application/octet-stream",
            file_data=data,
            category_id=UUID(category_id) if category_id else None,
            case_id=UUID(case_id) if case_id else None,
            legal_request_id=UUID(legal_request_id) if legal_request_id else None,
            visibility=visibility,
            ip=ip,
            ua=ua,
        )
    except ValueError as exc:
        raise HTTPException(400, str(exc))
    return success_response(to_document(doc), "Document uploaded")


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
    url = await svc.get_download_url(doc)
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
