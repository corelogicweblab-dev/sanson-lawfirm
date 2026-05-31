-- =============================================================================
-- SANSON Legal OS — Phase 3 Schema
-- AI Legal Assistant, chat sessions, classifications, summaries, intake
-- =============================================================================

-- Extend case categories for Phase 3 classifier
ALTER TYPE case_category ADD VALUE IF NOT EXISTS 'IMMIGRATION';
ALTER TYPE case_category ADD VALUE IF NOT EXISTS 'ESTATE_PROBATE';
ALTER TYPE case_category ADD VALUE IF NOT EXISTS 'TAX';

CREATE TYPE chat_session_status AS ENUM (
  'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'
);

CREATE TYPE chat_sender_type AS ENUM ('CLIENT', 'AI', 'SYSTEM');

CREATE TYPE chat_message_type AS ENUM ('TEXT', 'SYSTEM', 'ACTION');

CREATE TYPE ai_urgency_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TYPE ai_recommendation_type AS ENUM (
  'CONTINUE_CONVERSATION',
  'UPLOAD_DOCUMENTS',
  'GATHER_EVIDENCE',
  'REQUEST_REPRESENTATION',
  'SEEK_IMMEDIATE_ADVICE'
);

CREATE TYPE session_decision_type AS ENUM (
  'CONTINUE_CHAT',
  'RETURN_LATER',
  'REQUEST_LEGAL_REPRESENTATION'
);

-- -----------------------------------------------------------------------------
-- CHAT SESSIONS
-- -----------------------------------------------------------------------------

CREATE TABLE chat_sessions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id           UUID NOT NULL REFERENCES users(id),
  session_reference   VARCHAR(30) NOT NULL UNIQUE,
  status              chat_session_status NOT NULL DEFAULT 'ACTIVE',
  legal_request_id    UUID REFERENCES legal_requests(id),
  started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at            TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_chat_sessions_client ON chat_sessions(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_chat_sessions_status ON chat_sessions(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_chat_sessions_reference ON chat_sessions(session_reference);

-- -----------------------------------------------------------------------------
-- CHAT MESSAGES
-- -----------------------------------------------------------------------------

CREATE TABLE chat_messages (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id    UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  sender_type   chat_sender_type NOT NULL,
  message       TEXT NOT NULL,
  message_type  chat_message_type NOT NULL DEFAULT 'TEXT',
  token_usage   INT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id, created_at);

-- -----------------------------------------------------------------------------
-- AI CLASSIFICATIONS
-- -----------------------------------------------------------------------------

CREATE TABLE ai_classifications (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id            UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  category              case_category,
  subcategory           VARCHAR(150),
  priority              priority_level,
  urgency               ai_urgency_level,
  confidence_score      NUMERIC(5,2),
  potential_legal_area  VARCHAR(255),
  raw_result            JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_classifications_session ON ai_classifications(session_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- AI SUMMARIES
-- -----------------------------------------------------------------------------

CREATE TABLE ai_summaries (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id            UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  client_id             UUID NOT NULL REFERENCES users(id),
  summary_text          TEXT NOT NULL,
  key_facts             JSONB,
  parties_involved      JSONB,
  relevant_dates        JSONB,
  evidence_mentioned    JSONB,
  missing_information   JSONB,
  recommended_next_steps JSONB,
  classification_id     UUID REFERENCES ai_classifications(id),
  urgency               ai_urgency_level,
  generated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_summaries_session ON ai_summaries(session_id, generated_at DESC);

-- -----------------------------------------------------------------------------
-- AI INTAKE RESPONSES
-- -----------------------------------------------------------------------------

CREATE TABLE ai_intake_responses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  question_key    VARCHAR(100) NOT NULL,
  question_text   TEXT NOT NULL,
  answer_text     TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_intake_session ON ai_intake_responses(session_id);

-- -----------------------------------------------------------------------------
-- AI RECOMMENDATIONS
-- -----------------------------------------------------------------------------

CREATE TABLE ai_recommendations (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id          UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  recommendation_type ai_recommendation_type NOT NULL,
  message             TEXT NOT NULL,
  metadata            JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_recommendations_session ON ai_recommendations(session_id, created_at DESC);

-- Link legal requests to AI intake
ALTER TABLE legal_requests
  ADD COLUMN IF NOT EXISTS chat_session_id UUID REFERENCES chat_sessions(id),
  ADD COLUMN IF NOT EXISTS ai_summary_id UUID REFERENCES ai_summaries(id),
  ADD COLUMN IF NOT EXISTS ai_metadata JSONB DEFAULT '{}';

CREATE INDEX idx_legal_requests_chat_session ON legal_requests(chat_session_id)
  WHERE chat_session_id IS NOT NULL AND deleted_at IS NULL;
