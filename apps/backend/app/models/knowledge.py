import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class EmbeddingStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    INDEXED = "INDEXED"
    FAILED = "FAILED"


class SearchModeEnum(str, enum.Enum):
    SEMANTIC = "SEMANTIC"
    KEYWORD = "KEYWORD"
    HYBRID = "HYBRID"
    METADATA = "METADATA"


class KnowledgeVisibilityEnum(str, enum.Enum):
    STAFF = "STAFF"
    LAWYERS = "LAWYERS"
    ALL_STAFF = "ALL_STAFF"


class KnowledgeStatusEnum(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"


COLLECTIONS = {
    "documents": "documents_collection",
    "cases": "cases_collection",
    "evidence": "evidence_collection",
    "summaries": "summaries_collection",
    "knowledge": "knowledge_collection",
}


class DocumentChunk(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "document_chunks"

    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE")
    )
    chunk_index: Mapped[int] = mapped_column(nullable=False)
    chunk_text: Mapped[str] = mapped_column(Text, nullable=False)
    char_start: Mapped[int] = mapped_column(default=0)
    char_end: Mapped[int] = mapped_column(default=0)
    embedding_status: Mapped[EmbeddingStatusEnum] = mapped_column(
        Enum(EmbeddingStatusEnum, name="embedding_status", create_type=False),
        default=EmbeddingStatusEnum.PENDING,
    )
    qdrant_point_id: Mapped[str | None] = mapped_column(String(64))
    version_number: Mapped[int] = mapped_column(default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class DocumentEmbedding(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "document_embeddings"

    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE")
    )
    chunk_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("document_chunks.id", ondelete="CASCADE")
    )
    collection_name: Mapped[str] = mapped_column(String(80), default="documents_collection")
    qdrant_point_id: Mapped[str] = mapped_column(String(64), nullable=False)
    embedding_model: Mapped[str] = mapped_column(String(80), nullable=False)
    status: Mapped[EmbeddingStatusEnum] = mapped_column(
        Enum(EmbeddingStatusEnum, name="embedding_status", create_type=False),
        default=EmbeddingStatusEnum.INDEXED,
    )
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class CaseEmbedding(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "case_embeddings"

    case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cases.id", ondelete="CASCADE")
    )
    collection_name: Mapped[str] = mapped_column(String(80), default="cases_collection")
    qdrant_point_id: Mapped[str] = mapped_column(String(64), nullable=False)
    source_text: Mapped[str] = mapped_column(Text, nullable=False)
    embedding_model: Mapped[str] = mapped_column(String(80), nullable=False)
    status: Mapped[EmbeddingStatusEnum] = mapped_column(
        Enum(EmbeddingStatusEnum, name="embedding_status", create_type=False),
    )
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class EvidenceEmbedding(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "evidence_embeddings"

    evidence_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("evidence_items.id", ondelete="CASCADE")
    )
    collection_name: Mapped[str] = mapped_column(String(80), default="evidence_collection")
    qdrant_point_id: Mapped[str] = mapped_column(String(64), nullable=False)
    source_text: Mapped[str] = mapped_column(Text, nullable=False)
    embedding_model: Mapped[str] = mapped_column(String(80), nullable=False)
    status: Mapped[EmbeddingStatusEnum] = mapped_column(
        Enum(EmbeddingStatusEnum, name="embedding_status", create_type=False),
    )
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class SearchQuery(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "search_queries"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    query_text: Mapped[str] = mapped_column(Text, nullable=False)
    search_mode: Mapped[SearchModeEnum] = mapped_column(
        Enum(SearchModeEnum, name="search_mode", create_type=False),
        default=SearchModeEnum.HYBRID,
    )
    filters: Mapped[dict | None] = mapped_column(JSONB, default=dict)
    result_count: Mapped[int] = mapped_column(default=0)
    duration_ms: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class SearchHistory(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "search_history"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    query_text: Mapped[str] = mapped_column(Text, nullable=False)
    search_mode: Mapped[SearchModeEnum] = mapped_column(
        Enum(SearchModeEnum, name="search_mode", create_type=False)
    )
    top_result_type: Mapped[str | None] = mapped_column(String(50))
    top_result_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class KnowledgeCategory(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "knowledge_categories"

    name: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(default=0)

    articles: Mapped[list["KnowledgeArticle"]] = relationship(back_populates="category")


class KnowledgeArticle(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "knowledge_articles"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("knowledge_categories.id")
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    summary: Mapped[str | None] = mapped_column(Text)
    author_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    visibility: Mapped[KnowledgeVisibilityEnum] = mapped_column(
        Enum(KnowledgeVisibilityEnum, name="knowledge_visibility", create_type=False),
        default=KnowledgeVisibilityEnum.STAFF,
    )
    status: Mapped[KnowledgeStatusEnum] = mapped_column(
        Enum(KnowledgeStatusEnum, name="knowledge_status", create_type=False),
        default=KnowledgeStatusEnum.DRAFT,
    )
    keywords: Mapped[dict | None] = mapped_column(JSONB, default=list)

    category: Mapped["KnowledgeCategory | None"] = relationship(back_populates="articles")
