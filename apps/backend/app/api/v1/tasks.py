from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_client_ip, get_user_agent, require_permission
from app.core.responses import PaginationMeta, PaginationParams, success_response
from app.domain.authenticated_user import AuthenticatedUser
from app.schemas.legal import TaskCreate, TaskUpdate
from app.schemas.legal_mappers import to_task
from app.services.legal_workflow import LegalWorkflowService

router = APIRouter()


@router.post("/")
async def create_task(
    body: TaskCreate,
    request: Request,
    current_user: AuthenticatedUser = Depends(require_permission("tasks:write")),
    db: AsyncSession = Depends(get_db),
):
    service = LegalWorkflowService(db)
    task = await service.create_task(
        created_by=current_user.id,
        title=body.title,
        description=body.description,
        case_id=body.case_id,
        request_id=body.request_id,
        assigned_to=body.assigned_to,
        priority=body.priority,
        due_date=body.due_date,
        ip=get_client_ip(request),
        ua=get_user_agent(request),
    )
    return success_response(to_task(task), "Task created")


@router.get("/")
async def list_tasks(
    pagination: PaginationParams = Depends(),
    case_id: UUID | None = None,
    status: str | None = None,
    current_user: AuthenticatedUser = Depends(require_permission("tasks:read")),
    db: AsyncSession = Depends(get_db),
):
    service = LegalWorkflowService(db)
    # Paralegals see their assigned tasks; lawyers see all firm tasks for oversight
    assigned_to = current_user.id if current_user.role_name == "PARALEGAL" else None
    data, total = await service.list_tasks(
        offset=pagination.offset,
        limit=pagination.page_size,
        assigned_to=assigned_to,
        case_id=case_id,
        status=status,
    )
    meta = PaginationMeta(
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
        total_pages=(total + pagination.page_size - 1) // pagination.page_size,
    )
    return success_response([to_task(t) for t in data], "Tasks retrieved", meta=meta.model_dump())


@router.patch("/{task_id}")
async def update_task(
    task_id: UUID,
    body: TaskUpdate,
    request: Request,
    current_user: AuthenticatedUser = Depends(require_permission("tasks:write")),
    db: AsyncSession = Depends(get_db),
):
    service = LegalWorkflowService(db)
    updated = await service.update_task(
        task_id=task_id,
        performed_by=current_user.id,
        ip=get_client_ip(request),
        ua=get_user_agent(request),
        title=body.title,
        description=body.description,
        status=body.status,
        priority=body.priority,
        assigned_to=body.assigned_to,
        due_date=body.due_date,
    )
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return success_response(to_task(updated), "Task updated")

