import enum
import uuid
from datetime import date, datetime, time
from typing import TYPE_CHECKING, List

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, String, Text, Time
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models import User


class CaseSourceTypeEnum(str, enum.Enum):
    LEGACY = "LEGACY"
    AI_INTAKE = "AI_INTAKE"
    MANUAL = "MANUAL"


class CaseCategoryEnum(str, enum.Enum):
    CRIMINAL = "CRIMINAL"
    CIVIL = "CIVIL"
    FAMILY = "FAMILY"
    LABOR = "LABOR"
    CYBERCRIME = "CYBERCRIME"
    ADMINISTRATIVE = "ADMINISTRATIVE"
    CORPORATE = "CORPORATE"
    PROPERTY = "PROPERTY"
    CONTRACT_DISPUTES = "CONTRACT_DISPUTES"
    CONSUMER_PROTECTION = "CONSUMER_PROTECTION"
    IMMIGRATION = "IMMIGRATION"
    ESTATE_PROBATE = "ESTATE_PROBATE"
    TAX = "TAX"
    OTHER = "OTHER"


class PriorityLevelEnum(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class LegalRequestStatusEnum(str, enum.Enum):
    NEW = "NEW"
    UNDER_REVIEW = "UNDER_REVIEW"
    WAITING_FOR_SCHEDULE = "WAITING_FOR_SCHEDULE"
    SCHEDULED = "SCHEDULED"
    CONSULTED = "CONSULTED"
    APPROVED = "APPROVED"
    DECLINED = "DECLINED"
    CONVERTED_TO_CASE = "CONVERTED_TO_CASE"


class ConsultationTypeEnum(str, enum.Enum):
    ONLINE = "ONLINE"
    ONSITE = "ONSITE"


class AppointmentStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    RESCHEDULED = "RESCHEDULED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    NO_SHOW = "NO_SHOW"


class TaskStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class AssigneeRoleEnum(str, enum.Enum):
    LAWYER = "LAWYER"
    PARALEGAL = "PARALEGAL"


class ConsultationOutcomeEnum(str, enum.Enum):
    PROCEED_WITH_CASE = "PROCEED_WITH_CASE"
    REQUIRE_MORE_DOCUMENTS = "REQUIRE_MORE_DOCUMENTS"
    REFER_TO_OTHER_COUNSEL = "REFER_TO_OTHER_COUNSEL"
    DECLINED = "DECLINED"
    CLOSED = "CLOSED"


class TimelineEventTypeEnum(str, enum.Enum):
    CONSULTATION = "CONSULTATION"
    ASSIGNMENT = "ASSIGNMENT"
    STATUS_CHANGE = "STATUS_CHANGE"
    DOCUMENT_REQUEST = "DOCUMENT_REQUEST"
    COURT_ACTIVITY = "COURT_ACTIVITY"
    TASK = "TASK"
    COMMENT = "COMMENT"
    NOTE = "NOTE"
    OTHER = "OTHER"


class CaseStatus(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "case_statuses"

    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    color: Mapped[str | None] = mapped_column(String(20))
    sort_order: Mapped[int] = mapped_column(default=0)
    is_terminal: Mapped[bool] = mapped_column(Boolean, default=False)

    cases: Mapped[List["Case"]] = relationship(back_populates="status")


class LegalRequest(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "legal_requests"

    client_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    request_reference: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    case_category: Mapped[CaseCategoryEnum] = mapped_column(
        Enum(CaseCategoryEnum, name="case_category", create_type=False), nullable=False
    )
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[LegalRequestStatusEnum] = mapped_column(
        Enum(LegalRequestStatusEnum, name="legal_request_status", create_type=False),
        default=LegalRequestStatusEnum.NEW,
    )
    priority: Mapped[PriorityLevelEnum] = mapped_column(
        Enum(PriorityLevelEnum, name="priority_level", create_type=False),
        default=PriorityLevelEnum.MEDIUM,
    )
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    chat_session_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("chat_sessions.id")
    )
    ai_summary_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ai_summaries.id")
    )
    ai_metadata: Mapped[dict | None] = mapped_column(JSONB, default=dict)

    appointments: Mapped[List["Appointment"]] = relationship(back_populates="request")
    case: Mapped["Case | None"] = relationship(back_populates="request", uselist=False)


class Appointment(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "appointments"

    request_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("legal_requests.id")
    )
    client_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    lawyer_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    appointment_date: Mapped[date] = mapped_column(Date, nullable=False)
    appointment_time: Mapped[time] = mapped_column(Time, nullable=False)
    consultation_type: Mapped[ConsultationTypeEnum] = mapped_column(
        Enum(ConsultationTypeEnum, name="consultation_type", create_type=False),
        default=ConsultationTypeEnum.ONLINE,
    )
    status: Mapped[AppointmentStatusEnum] = mapped_column(
        Enum(AppointmentStatusEnum, name="appointment_status", create_type=False),
        default=AppointmentStatusEnum.PENDING,
    )
    remarks: Mapped[str | None] = mapped_column(Text)

    request: Mapped["LegalRequest"] = relationship(back_populates="appointments")
    consultation_notes: Mapped[List["ConsultationNote"]] = relationship(
        back_populates="appointment"
    )
    outcomes: Mapped[List["ConsultationOutcome"]] = relationship(back_populates="appointment")


class Case(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "cases"

    case_number: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    request_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("legal_requests.id")
    )
    client_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    assigned_lawyer_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id")
    )
    assigned_paralegal_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id")
    )
    status_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("case_statuses.id"))
    case_category: Mapped[CaseCategoryEnum] = mapped_column(
        Enum(CaseCategoryEnum, name="case_category", create_type=False), nullable=False
    )
    source_type: Mapped[CaseSourceTypeEnum] = mapped_column(
        Enum(CaseSourceTypeEnum, name="case_source_type", create_type=False),
        default=CaseSourceTypeEnum.MANUAL,
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    priority: Mapped[PriorityLevelEnum] = mapped_column(
        Enum(PriorityLevelEnum, name="priority_level", create_type=False),
        default=PriorityLevelEnum.MEDIUM,
    )
    opened_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    status: Mapped["CaseStatus"] = relationship(back_populates="cases")
    request: Mapped["LegalRequest | None"] = relationship(back_populates="case")
    activities: Mapped[List["CaseActivity"]] = relationship(back_populates="case")
    assignments: Mapped[List["CaseAssignment"]] = relationship(back_populates="case")
    tasks: Mapped[List["Task"]] = relationship(back_populates="case")
    comments: Mapped[List["Comment"]] = relationship(back_populates="case")
    timelines: Mapped[List["Timeline"]] = relationship(back_populates="case")


class CaseActivity(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "case_activities"

    case_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("cases.id"))
    activity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    performed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB, default=dict)

    case: Mapped["Case"] = relationship(back_populates="activities")


class CaseAssignment(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "case_assignments"

    case_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("cases.id"))
    assignee_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    assignee_role: Mapped[AssigneeRoleEnum] = mapped_column(
        Enum(AssigneeRoleEnum, name="assignee_role", create_type=False)
    )
    assigned_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[str | None] = mapped_column(Text)
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    case: Mapped["Case"] = relationship(back_populates="assignments")


class ConsultationNote(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "consultation_notes"

    appointment_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("appointments.id")
    )
    request_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("legal_requests.id")
    )
    lawyer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    findings: Mapped[str | None] = mapped_column(Text)
    legal_assessment: Mapped[str | None] = mapped_column(Text)
    recommendations: Mapped[str | None] = mapped_column(Text)
    missing_requirements: Mapped[str | None] = mapped_column(Text)
    next_actions: Mapped[str | None] = mapped_column(Text)

    appointment: Mapped["Appointment | None"] = relationship(back_populates="consultation_notes")


class ConsultationOutcome(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "consultation_outcomes"

    appointment_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("appointments.id")
    )
    request_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("legal_requests.id")
    )
    outcome: Mapped[ConsultationOutcomeEnum] = mapped_column(
        Enum(ConsultationOutcomeEnum, name="consultation_outcome_type", create_type=False)
    )
    notes: Mapped[str | None] = mapped_column(Text)
    recorded_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))

    appointment: Mapped["Appointment | None"] = relationship(back_populates="outcomes")


class Task(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "tasks"

    case_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("cases.id"))
    request_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("legal_requests.id")
    )
    assigned_to: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[TaskStatusEnum] = mapped_column(
        Enum(TaskStatusEnum, name="task_status", create_type=False),
        default=TaskStatusEnum.PENDING,
    )
    priority: Mapped[PriorityLevelEnum] = mapped_column(
        Enum(PriorityLevelEnum, name="priority_level", create_type=False),
        default=PriorityLevelEnum.MEDIUM,
    )
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    case: Mapped["Case | None"] = relationship(back_populates="tasks")


class Comment(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "comments"

    case_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("cases.id"))
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    content: Mapped[str] = mapped_column(Text, nullable=False)
    parent_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("comments.id"))
    mentions: Mapped[list | None] = mapped_column(JSONB, default=list)

    case: Mapped["Case"] = relationship(back_populates="comments")


class Timeline(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "timelines"

    case_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("cases.id"))
    event_type: Mapped[TimelineEventTypeEnum] = mapped_column(
        Enum(TimelineEventTypeEnum, name="timeline_event_type", create_type=False),
        default=TimelineEventTypeEnum.OTHER,
    )
    event_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    source: Mapped[str] = mapped_column(String(50), default="manual")
    reference_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB, default=dict)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))

    case: Mapped["Case"] = relationship(back_populates="timelines")
