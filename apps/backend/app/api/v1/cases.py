import structlog
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import (
    get_client_ip,
    get_user_agent,
    require_legal_operator,
    require_permission,
)
from app.core.responses import PaginationMeta, PaginationParams, success_response
from app.domain.authenticated_user import AuthenticatedUser
from app.schemas.case_intake import MasterCaseIntakeCreate
from app.schemas.legal import CaseCreate, CaseFromRequest, CaseUpdate
from app.services.case_intake_service import CaseIntakeService
from app.schemas.legal_mappers import to_case, to_case_status
from app.services.legal_workflow import LegalWorkflowService

router = APIRouter()
logger = structlog.get_logger()


@router.post("/master-intake")
async def create_master_case_intake(
    body: MasterCaseIntakeCreate,
    request: Request,
    current_user: AuthenticatedUser = Depends(require_permission("cases:write")),
    _legal: AuthenticatedUser = Depends(require_legal_operator()),
    db: AsyncSession = Depends(get_db),
):
    service = CaseIntakeService(db)
    try:
        case, client = await service.create_master_case(
            body,
            performed_by=current_user.id,
            ip=get_client_ip(request),
            ua=get_user_agent(request),
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    payload = to_case(case)
    payload["client_email"] = client.email
    return success_response(payload, f"Case {case.case_number} created — open workspace to upload files")


@router.post("/")
async def create_case(
    body: CaseCreate,
    request: Request,
    current_user: AuthenticatedUser = Depends(require_permission("cases:write")),
    _legal: AuthenticatedUser = Depends(require_legal_operator()),
    db: AsyncSession = Depends(get_db),
):
    service = LegalWorkflowService(db)
    created = await service.create_case(
        client_id=body.client_id,
        case_category=body.case_category,
        title=body.title,
        description=body.description,
        priority=body.priority,
        request_id=body.request_id,
        assigned_lawyer_id=body.assigned_lawyer_id,
        assigned_paralegal_id=body.assigned_paralegal_id,
        performed_by=current_user.id,
        ip=get_client_ip(request),
        ua=get_user_agent(request),
    )
    return success_response(to_case(created), "Case created")


@router.post("/from-request/{request_id}")
async def create_case_from_request(
    request_id: UUID,
    body: CaseFromRequest,
    request: Request,
    current_user: AuthenticatedUser = Depends(require_permission("cases:write")),
    _legal: AuthenticatedUser = Depends(require_legal_operator()),
    db: AsyncSession = Depends(get_db),
):
    service = LegalWorkflowService(db)
    created = await service.create_case_from_request(
        request_id=request_id,
        title=body.title,
        description=body.description,
        assigned_lawyer_id=body.assigned_lawyer_id,
        assigned_paralegal_id=body.assigned_paralegal_id,
        performed_by=current_user.id,
        ip=get_client_ip(request),
        ua=get_user_agent(request),
    )
    return success_response(to_case(created), "Case created from request")


@router.get("/")
async def list_cases(
    pagination: PaginationParams = Depends(),
    current_user: AuthenticatedUser = Depends(require_permission("cases:read")),
    db: AsyncSession = Depends(get_db),
):
    service = LegalWorkflowService(db)
    client_id = current_user.id if current_user.role_name == "CLIENT" else None
    # Lawyers and paralegals see the firm-wide case repository (managing partner reviews all matters)
    lawyer_id = None
    paralegal_id = None
    try:
        data, total = await service.list_cases(
            offset=pagination.offset,
            limit=pagination.page_size,
            client_id=client_id,
            lawyer_id=lawyer_id,
            paralegal_id=paralegal_id,
        )
        payload = [to_case(c) for c in data]
    except Exception as exc:
        logger.exception("list_cases_failed", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not load cases. Please retry in a moment.",
        ) from exc
    meta = PaginationMeta(
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
        total_pages=(total + pagination.page_size - 1) // pagination.page_size,
    )
    return success_response(payload, "Cases retrieved", meta=meta.model_dump())


@router.get("/statuses")
async def list_case_statuses(
    current_user: AuthenticatedUser = Depends(require_permission("cases:read")),
    db: AsyncSession = Depends(get_db),
):
    service = LegalWorkflowService(db)
    statuses = await service.list_case_statuses()
    return success_response([to_case_status(s) for s in statuses], "Case statuses retrieved")


@router.get("/{case_id}")
async def get_case(
    case_id: UUID,
    current_user: AuthenticatedUser = Depends(require_permission("cases:read")),
    db: AsyncSession = Depends(get_db),
):
    service = LegalWorkflowService(db)
    case = await service.get_case(case_id)
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    if current_user.role_name == "CLIENT" and case.client_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ownership validation failed")
    if current_user.role_name == "LAWYER" and case.assigned_lawyer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Assignment validation failed")
    return success_response(to_case(case), "Case retrieved")


@router.patch("/{case_id}")
async def update_case(
    case_id: UUID,
    body: CaseUpdate,
    request: Request,
    current_user: AuthenticatedUser = Depends(require_permission("cases:write")),
    _legal: AuthenticatedUser = Depends(require_legal_operator()),
    db: AsyncSession = Depends(get_db),
):
    if body.status_name in ("CLOSED", "RESOLVED", "ARCHIVED", "IN_PROGRESS"):
        if current_user.role_name != "LAWYER":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only lawyers may approve or close cases",
            )
    if body.status_name and current_user.role_name == "PARALEGAL":
        allowed = {"DRAFT", "OPEN", "WAITING_DOCUMENTS", "UNDER_REVIEW"}
        if body.status_name not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Paralegals may only set Draft, Open, Waiting documents, or Under review",
            )
    service = LegalWorkflowService(db)
    updated = await service.update_case(
        case_id=case_id,
        performed_by=current_user.id,
        ip=get_client_ip(request),
        ua=get_user_agent(request),
        title=body.title,
        description=body.description,
        case_category=body.case_category,
        status_id=body.status_id,
        status_name=body.status_name,
        priority=body.priority,
        assigned_lawyer_id=body.assigned_lawyer_id,
        assigned_paralegal_id=body.assigned_paralegal_id,
        master_data=body.master_data,
    )
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    return success_response(to_case(updated), "Case updated")

