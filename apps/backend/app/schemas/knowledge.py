from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    mode: str = Field(default="HYBRID", pattern="^(SEMANTIC|KEYWORD|HYBRID|METADATA)$")
    limit: int = Field(default=20, ge=1, le=50)
    filters: dict | None = None


class KnowledgeArticleCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=10)
    category_id: str | None = None
    summary: str | None = None
    visibility: str = "STAFF"
    status: str = "DRAFT"


class ContextRequest(BaseModel):
    entity_type: str = Field(..., pattern="^(case|document|evidence|timeline|knowledge)$")
    entity_id: str
