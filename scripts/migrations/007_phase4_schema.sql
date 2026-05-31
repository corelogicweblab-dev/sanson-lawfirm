-- =============================================================================
-- SANSON Legal OS — Phase 4 Schema
-- Documents, evidence, OCR, analysis, evidence timelines
-- =============================================================================

CREATE TYPE document_visibility AS ENUM ('PRIVATE', 'CLIENT', 'STAFF', 'CASE_TEAM');
CREATE TYPE document_review_status AS ENUM ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED');
CREATE TYPE evidence_type AS ENUM (
  'PHOTO', 'SCREENSHOT', 'VIDEO_REFERENCE', 'DOCUMENT', 'CONTRACT',
  'RECEIPT', 'MEDICAL_RECORD', 'COMMUNICATION_RECORD', 'OTHER'
);
CREATE TYPE evidence_status AS ENUM ('UPLOADED', 'PROCESSING', 'REVIEWED', 'FLAGGED', 'ARCHIVED');
CREATE TYPE ocr_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE document_link_type AS ENUM ('CASE', 'LEGAL_REQUEST', 'EVIDENCE', 'CHAT_SESSION');
CREATE TYPE timeline_source_type AS ENUM ('DOCUMENT', 'AI_EXTRACTION', 'MANUAL', 'EVIDENCE');

-- -----------------------------------------------------------------------------
-- DOCUMENT CATEGORIES
-- -----------------------------------------------------------------------------

CREATE TABLE document_categories (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(80) NOT NULL UNIQUE,
  display_name  VARCHAR(120) NOT NULL,
  description   TEXT,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

-- -----------------------------------------------------------------------------
-- DOCUMENTS
-- -----------------------------------------------------------------------------

CREATE TABLE documents (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name           VARCHAR(255) NOT NULL,
  original_file_name  VARCHAR(255) NOT NULL,
  file_size           BIGINT NOT NULL DEFAULT 0,
  mime_type           VARCHAR(120) NOT NULL,
  storage_path        TEXT NOT NULL,
  uploaded_by         UUID NOT NULL REFERENCES users(id),
  category_id         UUID REFERENCES document_categories(id),
  case_id             UUID REFERENCES cases(id),
  legal_request_id    UUID REFERENCES legal_requests(id),
  visibility          document_visibility NOT NULL DEFAULT 'CLIENT',
  review_status       document_review_status NOT NULL DEFAULT 'PENDING',
  version_number      INT NOT NULL DEFAULT 1,
  keywords            JSONB DEFAULT '[]',
  entities            JSONB DEFAULT '{}',
  embedding_ready     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_case ON documents(case_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_request ON documents(legal_request_id) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- DOCUMENT VERSIONS
-- -----------------------------------------------------------------------------

CREATE TABLE document_versions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id         UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number      INT NOT NULL,
  file_name           VARCHAR(255) NOT NULL,
  file_size           BIGINT NOT NULL,
  mime_type           VARCHAR(120) NOT NULL,
  storage_path        TEXT NOT NULL,
  uploaded_by         UUID NOT NULL REFERENCES users(id),
  change_notes        TEXT,
  metadata            JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (document_id, version_number)
);

-- -----------------------------------------------------------------------------
-- DOCUMENT TAGS
-- -----------------------------------------------------------------------------

CREATE TABLE document_tags (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(80) NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE document_tag_links (
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  tag_id      UUID NOT NULL REFERENCES document_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (document_id, tag_id)
);

-- -----------------------------------------------------------------------------
-- DOCUMENT LINKS (polymorphic associations)
-- -----------------------------------------------------------------------------

CREATE TABLE document_links (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id   UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  link_type     document_link_type NOT NULL,
  link_id       UUID NOT NULL,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_document_links_doc ON document_links(document_id);
CREATE INDEX idx_document_links_target ON document_links(link_type, link_id);

-- -----------------------------------------------------------------------------
-- OCR RESULTS
-- -----------------------------------------------------------------------------

CREATE TABLE ocr_results (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id       UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_id        UUID REFERENCES document_versions(id),
  status            ocr_status NOT NULL DEFAULT 'PENDING',
  raw_text          TEXT,
  confidence_score  NUMERIC(5,2),
  page_count        INT,
  processing_meta   JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ocr_results_document ON ocr_results(document_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- DOCUMENT ANALYSES
-- -----------------------------------------------------------------------------

CREATE TABLE document_analyses (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id             UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  summary_text            TEXT,
  important_findings      JSONB DEFAULT '[]',
  parties                 JSONB DEFAULT '[]',
  dates_found             JSONB DEFAULT '[]',
  legal_significance      TEXT,
  risk_indicators         JSONB DEFAULT '[]',
  missing_attachments     JSONB DEFAULT '[]',
  extracted_entities      JSONB DEFAULT '{}',
  keywords                JSONB DEFAULT '[]',
  embedding_text          TEXT,
  generated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_document_analyses_doc ON document_analyses(document_id, generated_at DESC);

-- -----------------------------------------------------------------------------
-- EVIDENCE ITEMS
-- -----------------------------------------------------------------------------

CREATE TABLE evidence_items (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id         UUID REFERENCES documents(id),
  case_id             UUID REFERENCES cases(id),
  legal_request_id    UUID REFERENCES legal_requests(id),
  evidence_type       evidence_type NOT NULL DEFAULT 'DOCUMENT',
  title               VARCHAR(255) NOT NULL,
  description         TEXT,
  status              evidence_status NOT NULL DEFAULT 'UPLOADED',
  owner_id            UUID NOT NULL REFERENCES users(id),
  reviewed_by         UUID REFERENCES users(id),
  reviewed_at         TIMESTAMPTZ,
  review_notes        TEXT,
  metadata            JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_evidence_case ON evidence_items(case_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_evidence_owner ON evidence_items(owner_id) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- EVIDENCE TIMELINES (Phase 4 — document-derived)
-- -----------------------------------------------------------------------------

CREATE TABLE evidence_timelines (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id             UUID REFERENCES cases(id),
  legal_request_id    UUID REFERENCES legal_requests(id),
  document_id         UUID REFERENCES documents(id),
  event_date          DATE NOT NULL,
  event_title         VARCHAR(255) NOT NULL,
  event_description   TEXT,
  location            VARCHAR(255),
  people              JSONB DEFAULT '[]',
  organizations       JSONB DEFAULT '[]',
  source_type         timeline_source_type NOT NULL DEFAULT 'AI_EXTRACTION',
  confidence_score    NUMERIC(5,2),
  sort_order          INT NOT NULL DEFAULT 0,
  created_by          UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_evidence_timelines_case ON evidence_timelines(case_id, event_date);
CREATE INDEX idx_evidence_timelines_request ON evidence_timelines(legal_request_id, event_date);
