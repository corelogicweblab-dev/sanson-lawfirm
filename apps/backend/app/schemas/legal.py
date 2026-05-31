from datetime import date, datetime, time
from uuid import UUID

from pydantic import BaseModel, Field


class LegalRequestCreate(BaseModel):
    client_id: UUID | None = None
    case_category: str
    subject: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=10)
    priority: str = "MEDIUM"


class LegalRequestUpdate(BaseModel):
    subject: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    case_category: str | None = None


class AppointmentCreate(BaseModel):
    request_id: UUID
    lawyer_id: UUID | None = None
    appointment_date: date
    appointment_time: time
    consultation_type: str = "ONLINE"
    remarks: str | None = None


class AppointmentUpdate(BaseModel):
    lawyer_id: UUID | None = None
    appointment_date: date | None = None
    appointment_time: time | None = None
    consultation_type: str | None = None
    status: str | None = None
    remarks: str | None = None


class CaseCreate(BaseModel):
    request_id: UUID | None = None
    client_id: UUID
    case_category: str
    title: str = Field(..., min_length=3, max_length=255)
    description: str | None = None
    priority: str = "MEDIUM"
    assigned_lawyer_id: UUID | None = None
    assigned_paralegal_id: UUID | None = None


class CaseUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status_id: UUID | None = None
    status_name: str | None = None
    priority: str | None = None
    assigned_lawyer_id: UUID | None = None
    assigned_paralegal_id: UUID | None = None


class CaseFromRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    assigned_lawyer_id: UUID | None = None
    assigned_paralegal_id: UUID | None = None


class AssignmentCreate(BaseModel):
    assignee_id: UUID
    assignee_role: str
    notes: str | None = None


class TaskCreate(BaseModel):
    case_id: UUID | None = None
    request_id: UUID | None = None
    assigned_to: UUID | None = None
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    priority: str = "MEDIUM"
    due_date: datetime | None = None


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    assigned_to: UUID | None = None
    due_date: datetime | None = None


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1)
    parent_id: UUID | None = None
    mentions: list[str] = Field(default_factory=list)


class ConsultationNoteCreate(BaseModel):
    appointment_id: UUID | None = None
    request_id: UUID | None = None
    findings: str | None = None
    legal_assessment: str | None = None
    recommendations: str | None = None
    missing_requirements: str | None = None
    next_actions: str | None = None


class ConsultationOutcomeCreate(BaseModel):
    appointment_id: UUID | None = None
    request_id: UUID
    outcome: str
    notes: str | None = None


class TimelineCreate(BaseModel):
    event_type: str = "OTHER"
    event_date: datetime
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    reference_id: UUID | None = None

