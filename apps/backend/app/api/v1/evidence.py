from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_client_ip, get_current_user, get_user_agent, require_permission
from app.core.responses import PaginationMeta, PaginationParams, success_response
from app.domain.authenticated_user import AuthenticatedUser
from app.schemas.document_mappers import to_evidence
from app.schemas.documents import EvidenceCreate
from app.services.document_service import DocumentService

router = APIRouter()


@router.get("/")
async def list_evidence(
    pagination: PaginationParams = Depends(),
    case_id: UUID | None = None,
    user: AuthenticatedUser = Depends(require_permission("evidence:read")),
    db: AsyncSession = Depends(get_db),
):
    svc = DocumentService(db)
    staff = user.role_name in ("LAWYER", "PARALEGAL", "ADMIN")
    items, total = await svc.list_evidence(
        pagination.offset,
        pagination.page_size,
        owner_id=user.id if not staff else None,
        case_id=case_id,
        is_staff=staff,
    )
    meta = PaginationMeta(
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
        total_pages=(total + pagination.page_size - 1) // pagination.page_size if pagination.page_size else 0,
    )
    return success_response([to_evidence(e) for e in items], "Evidence retrieved", meta=meta.model_dump())


@router.post("/")
async def create_evidence(
    body: EvidenceCreate,
    user: AuthenticatedUser = Depends(require_permission("evidence:write")),
    db: AsyncSession = Depends(get_db),
    ip: str | None = Depends(get_client_ip),
    ua: str | None = Depends(get_user_agent),
):
    svc = DocumentService(db)
    try:
        item = await svc.create_evidence(
            owner_id=user.id,
            title=body.title,
            evidence_type=body.evidence_type,
            document_id=UUID(body.document_id) if body.document_id else None,
            case_id=UUID(body.case_id) if body.case_id else None,
            legal_request_id=UUID(body.legal_request_id) if body.legal_request_id else None,
            description=body.description,
            ip=ip,
            ua=ua,
        )
    except KeyError:
        raise HTTPException(400, "Invalid evidence type")
    return success_response(to_evidence(item), "Evidence created")
