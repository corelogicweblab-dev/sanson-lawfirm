from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_client_ip, get_user_agent, require_permission
from app.core.responses import success_response
from app.domain.authenticated_user import AuthenticatedUser
from app.schemas.legal import ConsultationNoteCreate, ConsultationOutcomeCreate
from app.schemas.legal_mappers import to_consultation_note, to_consultation_outcome
from app.services.legal_workflow import LegalWorkflowService

router = APIRouter()


@router.post("/notes")
async def create_consultation_note(
    body: ConsultationNoteCreate,
    request: Request,
    current_user: AuthenticatedUser = Depends(require_permission("consultations:write")),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role_name not in ("LAWYER", "ADMIN"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only lawyers can add consultation notes")

    service = LegalWorkflowService(db)
    note = await service.create_consultation_note(
        lawyer_id=current_user.id,
        performed_by=current_user.id,
        appointment_id=body.appointment_id,
        request_id=body.request_id,
        findings=body.findings,
        legal_assessment=body.legal_assessment,
        recommendations=body.recommendations,
        missing_requirements=body.missing_requirements,
        next_actions=body.next_actions,
    )
    return success_response(to_consultation_note(note), "Consultation note recorded")


@router.post("/outcomes")
async def create_consultation_outcome(
    body: ConsultationOutcomeCreate,
    request: Request,
    current_user: AuthenticatedUser = Depends(require_permission("consultations:write")),
    db: AsyncSession = Depends(get_db),
):
    service = LegalWorkflowService(db)
    outcome = await service.create_consultation_outcome(
        request_id=body.request_id,
        appointment_id=body.appointment_id,
        outcome=body.outcome,
        notes=body.notes,
        recorded_by=current_user.id,
        ip=get_client_ip(request),
        ua=get_user_agent(request),
    )
    return success_response(to_consultation_outcome(outcome), "Consultation outcome recorded")


@router.get("/notes")
async def list_consultation_notes(
    request_id: UUID | None = None,
    appointment_id: UUID | None = None,
    current_user: AuthenticatedUser = Depends(require_permission("consultations:read")),
    db: AsyncSession = Depends(get_db),
):
    service = LegalWorkflowService(db)
    notes = await service.list_consultation_notes(request_id=request_id, appointment_id=appointment_id)
    return success_response([to_consultation_note(n) for n in notes], "Consultation notes retrieved")

