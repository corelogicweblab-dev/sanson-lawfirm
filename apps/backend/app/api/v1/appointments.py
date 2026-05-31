from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import (
    get_client_ip,
    get_current_user,
    get_user_agent,
    require_legal_operator,
    require_permission,
)
from app.core.responses import PaginationMeta, PaginationParams, success_response
from app.domain.authenticated_user import AuthenticatedUser
from app.schemas.legal import AppointmentCreate, AppointmentUpdate
from app.schemas.legal_mappers import to_appointment
from app.services.legal_workflow import LegalWorkflowService

router = APIRouter()


@router.post("/")
async def create_appointment(
    body: AppointmentCreate,
    request: Request,
    current_user: AuthenticatedUser = Depends(require_permission("appointments:schedule")),
    _legal: AuthenticatedUser = Depends(require_legal_operator()),
    db: AsyncSession = Depends(get_db),
):
    service = LegalWorkflowService(db)
    req = await service.get_legal_request(body.request_id)
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Legal request not found")

    appt = await service.create_appointment(
        request_id=body.request_id,
        client_id=req.client_id,
        lawyer_id=body.lawyer_id,
        appointment_date=body.appointment_date,
        appointment_time=body.appointment_time,
        consultation_type=body.consultation_type,
        remarks=body.remarks,
        performed_by=current_user.id,
        ip=get_client_ip(request),
        ua=get_user_agent(request),
    )
    return success_response(to_appointment(appt), "Appointment scheduled")


@router.get("/")
async def list_appointments(
    pagination: PaginationParams = Depends(),
    request_id: UUID | None = None,
    current_user: AuthenticatedUser = Depends(require_permission("appointments:read")),
    db: AsyncSession = Depends(get_db),
):
    service = LegalWorkflowService(db)
    client_id = current_user.id if current_user.role_name == "CLIENT" else None
    lawyer_id = current_user.id if current_user.role_name == "LAWYER" else None
    # Paralegals see all firm appointments (calendar management)
    data, total = await service.list_appointments(
        offset=pagination.offset,
        limit=pagination.page_size,
        client_id=client_id,
        lawyer_id=lawyer_id,
        request_id=request_id,
    )
    meta = PaginationMeta(
        page=pagination.page,
        page_size=pagination.page_size,
        total=total,
        total_pages=(total + pagination.page_size - 1) // pagination.page_size,
    )
    return success_response([to_appointment(a) for a in data], "Appointments retrieved", meta=meta.model_dump())


@router.patch("/{appointment_id}")
async def update_appointment(
    appointment_id: UUID,
    body: AppointmentUpdate,
    request: Request,
    current_user: AuthenticatedUser = Depends(require_permission("appointments:write")),
    db: AsyncSession = Depends(get_db),
):
    service = LegalWorkflowService(db)
    appt = await service.update_appointment(
        appointment_id=appointment_id,
        performed_by=current_user.id,
        ip=get_client_ip(request),
        ua=get_user_agent(request),
        lawyer_id=body.lawyer_id,
        appointment_date=body.appointment_date,
        appointment_time=body.appointment_time,
        consultation_type=body.consultation_type,
        status=body.status,
        remarks=body.remarks,
    )
    if not appt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    return success_response(to_appointment(appt), "Appointment updated")

