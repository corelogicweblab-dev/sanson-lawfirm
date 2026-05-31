import enum
import uuid
from datetime import date, datetime
from typing import List

from sqlalchemy import BigInteger, Boolean, Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class DocumentVisibilityEnum(str, enum.Enum):
    PRIVATE = "PRIVATE"
    CLIENT = "CLIENT"
    STAFF = "STAFF"
    CASE_TEAM = "CASE_TEAM"


class DocumentReviewStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    IN_REVIEW = "IN_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    ARCHIVED = "ARCHIVED"


class EvidenceTypeEnum(str, enum.Enum):
    PHOTO = "PHOTO"
    SCREENSHOT = "SCREENSHOT"
    VIDEO_REFERENCE = "VIDEO_REFERENCE"
    DOCUMENT = "DOCUMENT"
    CONTRACT = "CONTRACT"
    RECEIPT = "RECEIPT"
    MEDICAL_RECORD = "MEDICAL_RECORD"
    COMMUNICATION_RECORD = "COMMUNICATION_RECORD"
    OTHER = "OTHER"


class EvidenceStatusEnum(str, enum.Enum):
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    REVIEWED = "REVIEWED"
    FLAGGED = "FLAGGED"
    ARCHIVED = "ARCHIVED"


class OcrStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class DocumentLinkTypeEnum(str, enum.Enum):
    CASE = "CASE"
    LEGAL_REQUEST = "LEGAL_REQUEST"
    EVIDENCE = "EVIDENCE"
    CHAT_SESSION = "CHAT_SESSION"


class TimelineSourceTypeEnum(str, enum.Enum):
    DOCUMENT = "DOCUMENT"
    AI_EXTRACTION = "AI_EXTRACTION"
    MANUAL = "MANUAL"
    EVIDENCE = "EVIDENCE"


class DocumentCategory(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "document_categories"

    name: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(default=0)


class Document(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "documents"

    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    original_file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size: Mapped[int] = mapped_column(BigInteger, default=0)
    mime_type: Mapped[str] = mapped_column(String(120), nullable=False)
    storage_path: Mapped[str] = mapped_column(Text, nullable=False)
    uploaded_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("document_categories.id")
    )
    case_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("cases.id"))
    legal_request_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("legal_requests.id")
    )
    visibility: Mapped[DocumentVisibilityEnum] = mapped_column(
        Enum(DocumentVisibilityEnum, name="document_visibility", create_type=False),
        default=DocumentVisibilityEnum.CLIENT,
    )
    review_status: Mapped[DocumentReviewStatusEnum] = mapped_column(
        Enum(DocumentReviewStatusEnum, name="document_review_status", create_type=False),
        default=DocumentReviewStatusEnum.PENDING,
    )
    version_number: Mapped[int] = mapped_column(default=1)
    keywords: Mapped[dict | None] = mapped_column(JSONB, default=list)
    entities: Mapped[dict | None] = mapped_column(JSONB, default=dict)
    embedding_ready: Mapped[bool] = mapped_column(Boolean, default=False)

    category: Mapped["DocumentCategory | None"] = relationship()
    versions: Mapped[List["DocumentVersion"]] = relationship(back_populates="document")


class DocumentVersion(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "document_versions"

    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE")
    )
    version_number: Mapped[int] = mapped_column(nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(120), nullable=False)
    storage_path: Mapped[str] = mapped_column(Text, nullable=False)
    uploaded_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    change_notes: Mapped[str | None] = mapped_column(Text)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    document: Mapped["Document"] = relationship(back_populates="versions")


class DocumentTag(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "document_tags"

    name: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class DocumentLink(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "document_links"

    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE")
    )
    link_type: Mapped[DocumentLinkTypeEnum] = mapped_column(
        Enum(DocumentLinkTypeEnum, name="document_link_type", create_type=False)
    )
    link_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class OcrResult(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "ocr_results"

    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE")
    )
    version_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("document_versions.id")
    )
    status: Mapped[OcrStatusEnum] = mapped_column(
        Enum(OcrStatusEnum, name="ocr_status", create_type=False),
        default=OcrStatusEnum.PENDING,
    )
    raw_text: Mapped[str | None] = mapped_column(Text)
    confidence_score: Mapped[float | None] = mapped_column(Numeric(5, 2))
    page_count: Mapped[int | None] = mapped_column(Integer)
    processing_meta: Mapped[dict | None] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class DocumentAnalysis(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "document_analyses"

    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE")
    )
    summary_text: Mapped[str | None] = mapped_column(Text)
    important_findings: Mapped[dict | None] = mapped_column(JSONB, default=list)
    parties: Mapped[dict | None] = mapped_column(JSONB, default=list)
    dates_found: Mapped[dict | None] = mapped_column(JSONB, default=list)
    legal_significance: Mapped[str | None] = mapped_column(Text)
    risk_indicators: Mapped[dict | None] = mapped_column(JSONB, default=list)
    missing_attachments: Mapped[dict | None] = mapped_column(JSONB, default=list)
    extracted_entities: Mapped[dict | None] = mapped_column(JSONB, default=dict)
    keywords: Mapped[dict | None] = mapped_column(JSONB, default=list)
    embedding_text: Mapped[str | None] = mapped_column(Text)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class EvidenceItem(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "evidence_items"

    document_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id")
    )
    case_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("cases.id"))
    legal_request_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("legal_requests.id")
    )
    evidence_type: Mapped[EvidenceTypeEnum] = mapped_column(
        Enum(EvidenceTypeEnum, name="evidence_type", create_type=False),
        default=EvidenceTypeEnum.DOCUMENT,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[EvidenceStatusEnum] = mapped_column(
        Enum(EvidenceStatusEnum, name="evidence_status", create_type=False),
        default=EvidenceStatusEnum.UPLOADED,
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    review_notes: Mapped[str | None] = mapped_column(Text)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB, default=dict)


class EvidenceTimeline(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "evidence_timelines"

    case_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("cases.id"))
    legal_request_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("legal_requests.id")
    )
    document_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id")
    )
    event_date: Mapped[date] = mapped_column(Date, nullable=False)
    event_title: Mapped[str] = mapped_column(String(255), nullable=False)
    event_description: Mapped[str | None] = mapped_column(Text)
    location: Mapped[str | None] = mapped_column(String(255))
    people: Mapped[dict | None] = mapped_column(JSONB, default=list)
    organizations: Mapped[dict | None] = mapped_column(JSONB, default=list)
    source_type: Mapped[TimelineSourceTypeEnum] = mapped_column(
        Enum(TimelineSourceTypeEnum, name="timeline_source_type", create_type=False),
        default=TimelineSourceTypeEnum.AI_EXTRACTION,
    )
    confidence_score: Mapped[float | None] = mapped_column(Numeric(5, 2))
    sort_order: Mapped[int] = mapped_column(default=0)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
