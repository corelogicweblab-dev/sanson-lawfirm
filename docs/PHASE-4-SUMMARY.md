# Phase 4 Summary — Document Management & Evidence Processing

**Powered By: CoreLogic**

## Objective

Enterprise document and evidence management: Cloudflare R2 storage, OCR, AI document analysis, evidence repository, and AI-generated evidence timelines — preparing metadata for Phase 5 semantic search (no vectors yet).

## Database (`007`, `008`)

| Table | Purpose |
|-------|---------|
| `document_categories` | 12 default categories |
| `documents` | Core file records + case/request links |
| `document_versions` | Version history |
| `document_tags` / `document_tag_links` | Tagging |
| `document_links` | Polymorphic links |
| `ocr_results` | Extracted text + confidence |
| `document_analyses` | AI summaries, entities, keywords |
| `evidence_items` | Evidence repository |
| `evidence_timelines` | Chronological events from documents |

## Storage — Cloudflare R2

- S3-compatible API via `boto3`
- Private objects + presigned upload/download URLs
- File validation (type, size max 25MB)
- Env: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_ENDPOINT_URL`

Without R2: multipart upload still works with `local-fallback/` path (dev only).

## OCR

- PDF: `pypdf`
- DOCX: `python-docx`
- TXT: direct read
- Images: OpenAI vision when `OPENAI_API_KEY` set

## AI Document Analysis

- Entity extraction (people, orgs, dates, amounts, etc.)
- Summary, risk indicators, missing attachments
- `embedding_text` stored for Phase 5 (no Qdrant yet)

## API Endpoints

| Method | Path |
|--------|------|
| GET | `/api/v1/documents/categories` |
| GET/POST | `/api/v1/documents/` |
| POST | `/api/v1/documents/upload` |
| GET/DELETE | `/api/v1/documents/{id}` |
| PATCH | `/api/v1/documents/{id}/review` |
| POST | `/api/v1/documents/{id}/process` |
| POST | `/api/v1/uploads/presign` |
| GET/POST | `/api/v1/evidence/` |
| POST/GET | `/api/v1/ocr/{document_id}` |
| POST/GET | `/api/v1/document-analysis/{document_id}` |
| GET/POST | `/api/v1/evidence-timelines/` |

## Frontend

| Role | Routes |
|------|--------|
| Client | `/dashboard/client/documents` |
| Lawyer | `/dashboard/lawyer/documents`, `/evidence` |
| Paralegal | `/dashboard/paralegal/documents` |

Components: `DocumentCenter`, `TimelineViewer` — drag-drop upload, OCR+AI process, timeline viz.

## Security

- RBAC permissions per module
- Client ownership on documents
- MIME + extension allowlist
- Signed URL TTL
- Audit: upload, delete, OCR, analysis, timeline

## Migrations

1. `scripts/migrations/007_phase4_schema.sql`
2. `scripts/migrations/008_phase4_seed.sql`

## Not Built (Phase 5+)

- Qdrant / vector search
- Semantic search UI
- Virus scan (integration-ready hooks)
- Mobile app
- Advanced realtime

## Workflow

```
Upload → R2 → OCR → AI Analysis → Evidence Timeline → Lawyer Review
```
