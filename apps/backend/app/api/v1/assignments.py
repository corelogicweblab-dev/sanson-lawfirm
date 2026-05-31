from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_client_ip, get_user_agent, require_permission
from app.core.responses import success_response
from app.domain.authenticated_user import AuthenticatedUser
from app.schemas.legal import AssignmentCreate
from app.schemas.legal_mappers import to_assignment
from app.services.legal_workflow import LegalWorkflowService

router = APIRouter()


@router.post("/cases/{case_id}")
async def assign_case(
    case_id: UUID,
    body: AssignmentCreate,
    request: Request,
    current_user: AuthenticatedUser = Depends(require_permission("cases:assign")),
    db: AsyncSession = Depends(get_db),
):
    if body.assignee_role not in ("LAWYER", "PARALEGAL"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid assignee role")

    service = LegalWorkflowService(db)
    assignment = await service.assign_to_case(
        case_id=case_id,
        assignee_id=body.assignee_id,
        assignee_role=body.assignee_role,
        assigned_by=current_user.id,
        notes=body.notes,
        ip=get_client_ip(request),
        ua=get_user_agent(request),
    )
    return success_response(to_assignment(assignment), "Case assignment updated")


@router.get("/cases/{case_id}")
async def list_assignments(
    case_id: UUID,
    current_user: AuthenticatedUser = Depends(require_permission("cases:read")),
    db: AsyncSession = Depends(get_db),
):
    service = LegalWorkflowService(db)
    assignments = await service.list_assignments(case_id)
    return success_response([to_assignment(a) for a in assignments], "Assignment history retrieved")

