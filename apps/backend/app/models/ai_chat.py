import enum
import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, List

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.legal import CaseCategoryEnum, PriorityLevelEnum

if TYPE_CHECKING:
    from app.models import User
    from app.models.legal import LegalRequest


class ChatSessionStatusEnum(str, enum.Enum):
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"


class ChatSenderTypeEnum(str, enum.Enum):
    CLIENT = "CLIENT"
    AI = "AI"
    SYSTEM = "SYSTEM"


class ChatMessageTypeEnum(str, enum.Enum):
    TEXT = "TEXT"
    SYSTEM = "SYSTEM"
    ACTION = "ACTION"


class AiUrgencyLevelEnum(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AiRecommendationTypeEnum(str, enum.Enum):
    CONTINUE_CONVERSATION = "CONTINUE_CONVERSATION"
    UPLOAD_DOCUMENTS = "UPLOAD_DOCUMENTS"
    GATHER_EVIDENCE = "GATHER_EVIDENCE"
    REQUEST_REPRESENTATION = "REQUEST_REPRESENTATION"
    SEEK_IMMEDIATE_ADVICE = "SEEK_IMMEDIATE_ADVICE"


class SessionDecisionTypeEnum(str, enum.Enum):
    CONTINUE_CHAT = "CONTINUE_CHAT"
    RETURN_LATER = "RETURN_LATER"
    REQUEST_LEGAL_REPRESENTATION = "REQUEST_LEGAL_REPRESENTATION"


class ChatSession(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "chat_sessions"

    client_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    session_reference: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    status: Mapped[ChatSessionStatusEnum] = mapped_column(
        Enum(ChatSessionStatusEnum, name="chat_session_status", create_type=False),
        default=ChatSessionStatusEnum.ACTIVE,
    )
    legal_request_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("legal_requests.id")
    )
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    last_activity_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    messages: Mapped[List["ChatMessage"]] = relationship(back_populates="session")
    classifications: Mapped[List["AiClassification"]] = relationship(back_populates="session")
    summaries: Mapped[List["AiSummary"]] = relationship(back_populates="session")
    intake_responses: Mapped[List["AiIntakeResponse"]] = relationship(back_populates="session")
    recommendations: Mapped[List["AiRecommendation"]] = relationship(back_populates="session")


class ChatMessage(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "chat_messages"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("chat_sessions.id", ondelete="CASCADE")
    )
    sender_type: Mapped[ChatSenderTypeEnum] = mapped_column(
        Enum(ChatSenderTypeEnum, name="chat_sender_type", create_type=False)
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    message_type: Mapped[ChatMessageTypeEnum] = mapped_column(
        Enum(ChatMessageTypeEnum, name="chat_message_type", create_type=False),
        default=ChatMessageTypeEnum.TEXT,
    )
    token_usage: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    session: Mapped["ChatSession"] = relationship(back_populates="messages")


class AiClassification(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "ai_classifications"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("chat_sessions.id", ondelete="CASCADE")
    )
    category: Mapped[CaseCategoryEnum | None] = mapped_column(
        Enum(CaseCategoryEnum, name="case_category", create_type=False)
    )
    subcategory: Mapped[str | None] = mapped_column(String(150))
    priority: Mapped[PriorityLevelEnum | None] = mapped_column(
        Enum(PriorityLevelEnum, name="priority_level", create_type=False)
    )
    urgency: Mapped[AiUrgencyLevelEnum | None] = mapped_column(
        Enum(AiUrgencyLevelEnum, name="ai_urgency_level", create_type=False)
    )
    confidence_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    potential_legal_area: Mapped[str | None] = mapped_column(String(255))
    raw_result: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    session: Mapped["ChatSession"] = relationship(back_populates="classifications")


class AiSummary(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "ai_summaries"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("chat_sessions.id", ondelete="CASCADE")
    )
    client_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    summary_text: Mapped[str] = mapped_column(Text, nullable=False)
    key_facts: Mapped[dict | None] = mapped_column(JSONB)
    parties_involved: Mapped[dict | None] = mapped_column(JSONB)
    relevant_dates: Mapped[dict | None] = mapped_column(JSONB)
    evidence_mentioned: Mapped[dict | None] = mapped_column(JSONB)
    missing_information: Mapped[dict | None] = mapped_column(JSONB)
    recommended_next_steps: Mapped[dict | None] = mapped_column(JSONB)
    classification_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ai_classifications.id")
    )
    urgency: Mapped[AiUrgencyLevelEnum | None] = mapped_column(
        Enum(AiUrgencyLevelEnum, name="ai_urgency_level", create_type=False)
    )
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    session: Mapped["ChatSession"] = relationship(back_populates="summaries")


class AiIntakeResponse(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "ai_intake_responses"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("chat_sessions.id", ondelete="CASCADE")
    )
    question_key: Mapped[str] = mapped_column(String(100), nullable=False)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    answer_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    session: Mapped["ChatSession"] = relationship(back_populates="intake_responses")


class AiRecommendation(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "ai_recommendations"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("chat_sessions.id", ondelete="CASCADE")
    )
    recommendation_type: Mapped[AiRecommendationTypeEnum] = mapped_column(
        Enum(AiRecommendationTypeEnum, name="ai_recommendation_type", create_type=False)
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    session: Mapped["ChatSession"] = relationship(back_populates="recommendations")
