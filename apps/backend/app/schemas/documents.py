from pydantic import BaseModel, Field


class DocumentUploadMeta(BaseModel):
    category_id: str | None = None
    case_id: str | None = None
    legal_request_id: str | None = None
    visibility: str = "CLIENT"


class PresignUploadRequest(BaseModel):
    file_name: str = Field(..., min_length=1, max_length=255)
    mime_type: str = Field(..., min_length=3, max_length=120)
    file_size: int = Field(..., gt=0)


class DocumentReviewUpdate(BaseModel):
    review_status: str = Field(..., pattern="^(PENDING|IN_REVIEW|APPROVED|REJECTED|ARCHIVED)$")


class EvidenceCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    evidence_type: str = "DOCUMENT"
    document_id: str | None = None
    case_id: str | None = None
    legal_request_id: str | None = None
    description: str | None = None


class EvidenceReviewUpdate(BaseModel):
    status: str
    review_notes: str | None = None


class ProcessDocumentRequest(BaseModel):
    run_ocr: bool = True
    run_analysis: bool = True
    run_timeline: bool = True
