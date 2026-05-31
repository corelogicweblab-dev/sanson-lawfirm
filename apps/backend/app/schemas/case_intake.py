from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ClientIntakeInput(BaseModel):
    client_id: UUID | None = None
    email: str | None = None
    first_name: str = Field(..., min_length=1, max_length=100)
    middle_name: str | None = None
    last_name: str = Field(..., min_length=1, max_length=100)
    suffix: str | None = None
    phone: str | None = None
    mobile_number: str | None = None
    address: str | None = None
    details: dict = Field(default_factory=dict)


class OpposingPartyInput(BaseModel):
    party_type: str = "INDIVIDUAL"
    full_name: str = Field(..., min_length=1, max_length=255)
    contact_phone: str | None = None
    contact_email: str | None = None
    address: str | None = None
    province: str | None = None
    city: str | None = None
    relationship_to_case: str | None = None
    position_in_case: str | None = None
    notes: str | None = None
    details: dict = Field(default_factory=dict)


class MasterCaseIntakeCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    case_category: str = "CIVIL"
    priority: str = "MEDIUM"
    source_type: str = "MANUAL"
    status_name: str = "DRAFT"
    description: str | None = None
    request_id: UUID | None = None
    assigned_lawyer_id: UUID | None = None
    assigned_paralegal_id: UUID | None = None
    client: ClientIntakeInput
    opposing_party: OpposingPartyInput | None = None
    case_details: dict = Field(default_factory=dict)
    important_dates: dict = Field(default_factory=dict)
    legal_team: dict = Field(default_factory=dict)
    internal_notes: dict = Field(default_factory=dict)
    ai_intake: dict = Field(default_factory=dict)
    initial_task: dict | None = None
    initial_meeting: dict | None = None
