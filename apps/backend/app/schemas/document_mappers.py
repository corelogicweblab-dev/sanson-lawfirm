from sqlalchemy.orm.attributes import instance_state

from app.models.documents import (
    Document,
    DocumentAnalysis,
    DocumentCategory,
    DocumentVersion,
    EvidenceItem,
    EvidenceTimeline,
    OcrResult,
)


def _dt(v):
    return v.isoformat() if v else None


def _enum(v):
    return v.value if v and hasattr(v, "value") else v


def to_category(c: DocumentCategory) -> dict:
    return {
        "id": str(c.id),
        "name": c.name,
        "displayName": c.display_name,
        "description": c.description,
        "sortOrder": c.sort_order,
    }


def _loaded_category(d: Document) -> dict | None:
    """Never lazy-load category in async handlers (causes 500 MissingGreenlet)."""
    if "category" not in instance_state(d).dict:
        return None
    cat = instance_state(d).dict.get("category")
    return to_category(cat) if cat is not None else None


def to_document(d: Document, download_url: str | None = None) -> dict:
    return {
        "id": str(d.id),
        "fileName": d.file_name,
        "originalFileName": d.original_file_name,
        "fileSize": d.file_size,
        "mimeType": d.mime_type,
        "storagePath": d.storage_path,
        "uploadedBy": str(d.uploaded_by),
        "categoryId": str(d.category_id) if d.category_id else None,
        "category": _loaded_category(d),
        "caseId": str(d.case_id) if d.case_id else None,
        "legalRequestId": str(d.legal_request_id) if d.legal_request_id else None,
        "visibility": _enum(d.visibility),
        "reviewStatus": _enum(d.review_status),
        "versionNumber": d.version_number,
        "keywords": d.keywords or [],
        "entities": d.entities or {},
        "embeddingReady": d.embedding_ready,
        "downloadUrl": download_url,
        "createdAt": _dt(d.created_at),
        "updatedAt": _dt(d.updated_at),
    }


def to_version(v: DocumentVersion) -> dict:
    return {
        "id": str(v.id),
        "documentId": str(v.document_id),
        "versionNumber": v.version_number,
        "fileName": v.file_name,
        "fileSize": v.file_size,
        "mimeType": v.mime_type,
        "changeNotes": v.change_notes,
        "createdAt": _dt(v.created_at),
    }


def to_ocr(o: OcrResult) -> dict:
    score = float(o.confidence_score) if o.confidence_score is not None else None
    return {
        "id": str(o.id),
        "documentId": str(o.document_id),
        "status": _enum(o.status),
        "rawText": o.raw_text,
        "confidenceScore": score,
        "pageCount": o.page_count,
        "processingMeta": o.processing_meta or {},
        "createdAt": _dt(o.created_at),
    }


def to_analysis(a: DocumentAnalysis) -> dict:
    return {
        "id": str(a.id),
        "documentId": str(a.document_id),
        "summaryText": a.summary_text,
        "importantFindings": a.important_findings or [],
        "parties": a.parties or [],
        "datesFound": a.dates_found or [],
        "legalSignificance": a.legal_significance,
        "riskIndicators": a.risk_indicators or [],
        "missingAttachments": a.missing_attachments or [],
        "extractedEntities": a.extracted_entities or {},
        "keywords": a.keywords or [],
        "generatedAt": _dt(a.generated_at),
    }


def to_evidence(e: EvidenceItem) -> dict:
    return {
        "id": str(e.id),
        "documentId": str(e.document_id) if e.document_id else None,
        "caseId": str(e.case_id) if e.case_id else None,
        "legalRequestId": str(e.legal_request_id) if e.legal_request_id else None,
        "evidenceType": _enum(e.evidence_type),
        "title": e.title,
        "description": e.description,
        "status": _enum(e.status),
        "ownerId": str(e.owner_id),
        "reviewedBy": str(e.reviewed_by) if e.reviewed_by else None,
        "reviewedAt": _dt(e.reviewed_at),
        "reviewNotes": e.review_notes,
        "createdAt": _dt(e.created_at),
        "updatedAt": _dt(e.updated_at),
    }


def to_evidence_timeline(t: EvidenceTimeline) -> dict:
    score = float(t.confidence_score) if t.confidence_score is not None else None
    return {
        "id": str(t.id),
        "caseId": str(t.case_id) if t.case_id else None,
        "legalRequestId": str(t.legal_request_id) if t.legal_request_id else None,
        "documentId": str(t.document_id) if t.document_id else None,
        "eventDate": t.event_date.isoformat(),
        "eventTitle": t.event_title,
        "eventDescription": t.event_description,
        "location": t.location,
        "people": t.people or [],
        "organizations": t.organizations or [],
        "sourceType": _enum(t.source_type),
        "confidenceScore": score,
        "sortOrder": t.sort_order,
        "createdAt": _dt(t.created_at),
    }
