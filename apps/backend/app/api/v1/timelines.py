from uuid import UUID

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_client_ip, get_user_agent, require_permission
from app.core.responses import success_response
from app.domain.authenticated_user import AuthenticatedUser
from app.schemas.legal import TimelineCreate
from app.schemas.legal_mappers import to_case_activity, to_timeline
from app.services.legal_workflow import LegalWorkflowService

router = APIRouter()


@router.post("/cases/{case_id}")
async def create_timeline_event(
    case_id: UUID,
    body: TimelineCreate,
    request: Request,
    current_user: AuthenticatedUser = Depends(require_permission("timelines:write")),
    db: AsyncSession = Depends(get_db),
):
    service = LegalWorkflowService(db)
    event = await service.create_timeline_event(
        case_id=case_id,
        event_type=body.event_type,
        event_date=body.event_date,
        title=body.title,
        description=body.description,
        reference_id=body.reference_id,
        created_by=current_user.id,
        ip=get_client_ip(request),
        ua=get_user_agent(request),
    )
    return success_response(to_timeline(event), "Timeline event created")


@router.get("/cases/{case_id}")
async def list_timeline_events(
    case_id: UUID,
    current_user: AuthenticatedUser = Depends(require_permission("timelines:read")),
    db: AsyncSession = Depends(get_db),
):
    service = LegalWorkflowService(db)
    events = await service.list_timelines(case_id)
    return success_response([to_timeline(e) for e in events], "Timeline events retrieved")


@router.get("/cases/{case_id}/activities")
async def list_case_activities(
    case_id: UUID,
    current_user: AuthenticatedUser = Depends(require_permission("cases:read")),
    db: AsyncSession = Depends(get_db),
):
    service = LegalWorkflowService(db)
    data = await service.list_case_activities(case_id)
    return success_response([to_case_activity(a) for a in data], "Case activities retrieved")

