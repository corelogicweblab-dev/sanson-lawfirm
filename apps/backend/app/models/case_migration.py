import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin


class CaseMigrationItemStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    VALIDATED = "VALIDATED"
    IMPORTED = "IMPORTED"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"


class CaseMigrationJobTypeEnum(str, enum.Enum):
    LEGACY_CASE = "LEGACY_CASE"
    BULK_CASES = "BULK_CASES"
    BULK_DOCUMENTS = "BULK_DOCUMENTS"
    ASSIGNMENT = "ASSIGNMENT"
    VALIDATION = "VALIDATION"


class CaseMigrationJob(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "case_migration_jobs"

    job_type: Mapped[CaseMigrationJobTypeEnum] = mapped_column(
        Enum(CaseMigrationJobTypeEnum, name="case_migration_job_type", create_type=False),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(String(32), default="COMPLETED")
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    total_items: Mapped[int] = mapped_column(Integer, default=0)
    success_count: Mapped[int] = mapped_column(Integer, default=0)
    failed_count: Mapped[int] = mapped_column(Integer, default=0)
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class CaseMigrationItem(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "case_migration_items"

    job_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("case_migration_jobs.id", ondelete="CASCADE")
    )
    legacy_reference: Mapped[str | None] = mapped_column(String(120))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    client_email: Mapped[str | None] = mapped_column(String(255))
    case_category: Mapped[str] = mapped_column(String(50), default="CIVIL")
    status: Mapped[CaseMigrationItemStatusEnum] = mapped_column(
        Enum(CaseMigrationItemStatusEnum, name="case_migration_item_status", create_type=False),
        default=CaseMigrationItemStatusEnum.PENDING,
    )
    case_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("cases.id"))
    assigned_lawyer_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    assigned_paralegal_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id")
    )
    validation_notes: Mapped[str | None] = mapped_column(Text)
    error_message: Mapped[str | None] = mapped_column(Text)
    payload_: Mapped[dict] = mapped_column("payload", JSONB, default=dict)
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    validated_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    validated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
