-- =============================================================================
-- SANSON Legal OS — Phase 5 Schema
-- Embeddings, search history, knowledge base
-- =============================================================================

CREATE TYPE embedding_status AS ENUM ('PENDING', 'PROCESSING', 'INDEXED', 'FAILED');
CREATE TYPE search_mode AS ENUM ('SEMANTIC', 'KEYWORD', 'HYBRID', 'METADATA');
CREATE TYPE knowledge_visibility AS ENUM ('STAFF', 'LAWYERS', 'ALL_STAFF');
CREATE TYPE knowledge_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- -----------------------------------------------------------------------------
-- DOCUMENT CHUNKS (chunk tracking before/at Qdrant)
-- -----------------------------------------------------------------------------

CREATE TABLE document_chunks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index     INT NOT NULL,
  chunk_text      TEXT NOT NULL,
  char_start      INT NOT NULL DEFAULT 0,
  char_end        INT NOT NULL DEFAULT 0,
  embedding_status embedding_status NOT NULL DEFAULT 'PENDING',
  qdrant_point_id VARCHAR(64),
  version_number  INT NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (document_id, chunk_index, version_number)
);

CREATE INDEX idx_document_chunks_doc ON document_chunks(document_id);

-- -----------------------------------------------------------------------------
-- EMBEDDING REGISTRY TABLES
-- -----------------------------------------------------------------------------

CREATE TABLE document_embeddings (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id       UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_id          UUID REFERENCES document_chunks(id) ON DELETE CASCADE,
  collection_name   VARCHAR(80) NOT NULL DEFAULT 'documents_collection',
  qdrant_point_id   VARCHAR(64) NOT NULL,
  embedding_model   VARCHAR(80) NOT NULL,
  status            embedding_status NOT NULL DEFAULT 'INDEXED',
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_document_embeddings_doc ON document_embeddings(document_id);

CREATE TABLE case_embeddings (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id           UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  collection_name   VARCHAR(80) NOT NULL DEFAULT 'cases_collection',
  qdrant_point_id   VARCHAR(64) NOT NULL,
  source_text       TEXT NOT NULL,
  embedding_model   VARCHAR(80) NOT NULL,
  status            embedding_status NOT NULL DEFAULT 'INDEXED',
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE evidence_embeddings (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evidence_id       UUID NOT NULL REFERENCES evidence_items(id) ON DELETE CASCADE,
  collection_name   VARCHAR(80) NOT NULL DEFAULT 'evidence_collection',
  qdrant_point_id   VARCHAR(64) NOT NULL,
  source_text       TEXT NOT NULL,
  embedding_model   VARCHAR(80) NOT NULL,
  status            embedding_status NOT NULL DEFAULT 'INDEXED',
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- SEARCH
-- -----------------------------------------------------------------------------

CREATE TABLE search_queries (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id),
  query_text      TEXT NOT NULL,
  search_mode     search_mode NOT NULL DEFAULT 'HYBRID',
  filters         JSONB DEFAULT '{}',
  result_count    INT NOT NULL DEFAULT 0,
  duration_ms     INT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_search_queries_user ON search_queries(user_id, created_at DESC);

CREATE TABLE search_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id),
  query_text      TEXT NOT NULL,
  search_mode     search_mode NOT NULL,
  top_result_type VARCHAR(50),
  top_result_id   UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_search_history_user ON search_history(user_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- KNOWLEDGE BASE
-- -----------------------------------------------------------------------------

CREATE TABLE knowledge_categories (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(80) NOT NULL UNIQUE,
  display_name  VARCHAR(120) NOT NULL,
  description   TEXT,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE TABLE knowledge_articles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         VARCHAR(255) NOT NULL,
  slug          VARCHAR(255) NOT NULL UNIQUE,
  category_id   UUID REFERENCES knowledge_categories(id),
  content       TEXT NOT NULL,
  summary       TEXT,
  author_id     UUID REFERENCES users(id),
  visibility    knowledge_visibility NOT NULL DEFAULT 'STAFF',
  status        knowledge_status NOT NULL DEFAULT 'DRAFT',
  keywords      JSONB DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX idx_knowledge_articles_slug ON knowledge_articles(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_knowledge_articles_category ON knowledge_articles(category_id) WHERE deleted_at IS NULL;
