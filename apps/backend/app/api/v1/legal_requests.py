from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_client_ip, get_current_user, get_user_agent, require_permission
from app.core.responses import PaginationMeta, PaginationParams, success_response
from app.domain.authenticated_user import AuthenticatedUser
from app.schemas.legal import LegalRequestCreate, LegalRequestUpdate
from app.schemas.legal_mappers import to_legal_request
from app.services.legal_workflow import LegalWorkflowService

router = APIRouter()


@router.post("/")
async def create_legal_request(
    body: LegalRequestCreate,
    request: Request,
    current_user: AuthenticatedUser = Depends(require_permission("legal_requests:create")),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role_name != "CLIENT" and not current_user.has_permission("legal_requests:write"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only clients can create legal requests")

    service = LegalWorkflowService(db)
    req = await service.create_legal_request(
        client_id=current_user.id,
        case_category=body.case_category,
        subject=body.subject,
        description=body.description,
        priority=body.priority,
        performed_by=current_user.id,
        ip=get_client_ip(request),
        ua=get_user_agent(request),
    )
    return success_response(to_legal_request(req), "Legal representation request submitted")


@router.get("/")
async def list_legal_requests(
    pagination: PaginationParams = Depends(),
    status: str | None = None,
    current_user: AuthenticatedUser = Depends(require_permission("legal_requests:read")),
    db: AsyncSession = Depends(get_db),
):
    service = LegalWorkflowService(db)
    client_id = current_user.id if current_user.role_name == "CLIENT" else None
    lawyer_view = current_user.role_name in ("LAWYER", "ADMIN")
    data, total = await service.list_legal_requests(
        offset=pagination.offset,
        limit=pagination.page_size,
        client_id=client_id,
        status=status,
        lawyer_view=lawyer_view,
    )
    meta = PaginationMeta(
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
        total_pages=(total + pagination.page_size - 1) // pagination.page_size,
    )
    return success_response([to_legal_request(x) for x in data], "Legal requests retrieved", meta=meta.model_dump())


@router.get("/{request_id}")
async def get_legal_request(
    request_id: UUID,
    current_user: AuthenticatedUser = Depends(require_permission("legal_requests:read")),
    db: AsyncSession = Depends(get_db),
):
    service = LegalWorkflowService(db)
    req = await service.get_legal_request(request_id)
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    if current_user.role_name == "CLIENT" and req.client_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ownership validation failed")
    return success_response(to_legal_request(req), "Legal request retrieved")


@router.patch("/{request_id}")
async def update_legal_request(
    request_id: UUID,
    body: LegalRequestUpdate,
    request: Request,
    current_user: AuthenticatedUser = Depends(require_permission("legal_requests:write")),
    db: AsyncSession = Depends(get_db),
):
    service = LegalWorkflowService(db)
    req = await service.get_legal_request(request_id)
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    if current_user.role_name == "CLIENT" and req.client_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ownership validation failed")

    updated = await service.update_legal_request(
        request_id=request_id,
        performed_by=current_user.id,
        ip=get_client_ip(request),
        ua=get_user_agent(request),
        subject=body.subject,
        description=body.description,
        status=body.status,
        priority=body.priority,
        case_category=body.case_category,
    )
    return success_response(to_legal_request(updated), "Legal request updated")

