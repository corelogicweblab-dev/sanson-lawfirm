import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin


class DeploymentEnvironmentEnum(str, enum.Enum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"


class DeploymentStatusEnum(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    SUCCESS = "success"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"


class AlertSeverityEnum(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class AlertCategoryEnum(str, enum.Enum):
    API = "api"
    DATABASE = "database"
    STORAGE = "storage"
    AI = "ai"
    AUTH = "auth"
    DEPLOYMENT = "deployment"
    SEARCH = "search"
    SYSTEM = "system"


class MigrationRunStatusEnum(str, enum.Enum):
    PENDING = "pending"
    APPLIED = "applied"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"


class MigrationRun(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "migration_runs"

    version: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    checksum: Mapped[str | None] = mapped_column(String(64))
    status: Mapped[MigrationRunStatusEnum] = mapped_column(
        Enum(MigrationRunStatusEnum, name="migration_run_status", create_type=False),
        default=MigrationRunStatusEnum.APPLIED,
    )
    applied_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    applied_by: Mapped[str | None] = mapped_column(String(128))
    notes: Mapped[str | None] = mapped_column(Text)


class DeploymentLog(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "deployment_logs"

    environment: Mapped[DeploymentEnvironmentEnum] = mapped_column(
        Enum(DeploymentEnvironmentEnum, name="deployment_environment", create_type=False),
        default=DeploymentEnvironmentEnum.PRODUCTION,
    )
    service: Mapped[str] = mapped_column(String(64), nullable=False)
    version: Mapped[str | None] = mapped_column(String(64))
    git_ref: Mapped[str | None] = mapped_column(String(128))
    status: Mapped[DeploymentStatusEnum] = mapped_column(
        Enum(DeploymentStatusEnum, name="deployment_status", create_type=False),
        default=DeploymentStatusEnum.SUCCESS,
    )
    deployed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    deployed_by: Mapped[str | None] = mapped_column(String(128))
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, default=dict)


class SystemAlert(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "system_alerts"

    category: Mapped[AlertCategoryEnum] = mapped_column(
        Enum(AlertCategoryEnum, name="alert_category", create_type=False),
        default=AlertCategoryEnum.SYSTEM,
    )
    severity: Mapped[AlertSeverityEnum] = mapped_column(
        Enum(AlertSeverityEnum, name="alert_severity", create_type=False),
        default=AlertSeverityEnum.INFO,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[str | None] = mapped_column(String(80))
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    resolved_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
