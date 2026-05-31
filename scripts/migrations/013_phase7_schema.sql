-- =============================================================================
-- SANSON Legal OS — Phase 7 Schema
-- Enterprise security, audit intelligence, system control
-- =============================================================================

CREATE TYPE security_event_severity AS ENUM ('INFO', 'WARNING', 'CRITICAL');
CREATE TYPE session_status AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');
CREATE TYPE backup_status AS ENUM ('STARTED', 'COMPLETED', 'FAILED');

-- -----------------------------------------------------------------------------
-- ENHANCE AUDIT LOGS (enterprise fields)
-- -----------------------------------------------------------------------------

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS actor_role VARCHAR(50),
  ADD COLUMN IF NOT EXISTS resource_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS resource_id UUID,
  ADD COLUMN IF NOT EXISTS before_state JSONB,
  ADD COLUMN IF NOT EXISTS after_state JSONB,
  ADD COLUMN IF NOT EXISTS device_id UUID,
  ADD COLUMN IF NOT EXISTS correlation_id VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_audit_logs_correlation ON audit_logs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(performed_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Backfill resource columns from legacy names
UPDATE audit_logs SET resource_type = entity_type WHERE resource_type IS NULL;
UPDATE audit_logs SET resource_id = entity_id WHERE resource_id IS NULL;
UPDATE audit_logs SET before_state = old_values WHERE before_state IS NULL;
UPDATE audit_logs SET after_state = new_values WHERE after_state IS NULL;

-- -----------------------------------------------------------------------------
-- AI AUDIT LOGS
-- -----------------------------------------------------------------------------

CREATE TABLE ai_audit_logs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES users(id),
  session_id        UUID,
  prompt_type       VARCHAR(80) NOT NULL,
  model_name        VARCHAR(80) NOT NULL,
  tokens_input      INT DEFAULT 0,
  tokens_output     INT DEFAULT 0,
  output_summary    TEXT,
  confidence_score  NUMERIC(5,2),
  recommendation    JSONB,
  correlation_id    VARCHAR(64),
  ip_address        INET,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_audit_user ON ai_audit_logs(user_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- SECURITY EVENTS
-- -----------------------------------------------------------------------------

CREATE TABLE security_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(id),
  event_type      VARCHAR(80) NOT NULL,
  severity        security_event_severity NOT NULL DEFAULT 'INFO',
  description     TEXT NOT NULL,
  ip_address      INET,
  user_agent      TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_security_events_type ON security_events(event_type, created_at DESC);

-- -----------------------------------------------------------------------------
-- SESSION DEVICES (web + mobile sessions)
-- -----------------------------------------------------------------------------

CREATE TABLE session_devices (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mobile_device_id  UUID REFERENCES mobile_devices(id) ON DELETE SET NULL,
  session_token_hash VARCHAR(128) NOT NULL,
  status            session_status NOT NULL DEFAULT 'ACTIVE',
  platform          VARCHAR(32),
  ip_address        INET,
  user_agent        TEXT,
  last_active_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at        TIMESTAMPTZ,
  revoked_at        TIMESTAMPTZ,
  revoke_reason     VARCHAR(255),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_session_devices_user ON session_devices(user_id, status);

-- -----------------------------------------------------------------------------
-- REFRESH TOKEN BLACKLIST
-- -----------------------------------------------------------------------------

CREATE TABLE token_blacklist (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_hash      VARCHAR(128) NOT NULL UNIQUE,
  user_id         UUID REFERENCES users(id),
  revoked_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason          VARCHAR(255)
);

-- -----------------------------------------------------------------------------
-- API RATE LIMIT RULES
-- -----------------------------------------------------------------------------

CREATE TABLE api_rate_limits (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_pattern   VARCHAR(200) NOT NULL UNIQUE,
  requests_per_minute INT NOT NULL DEFAULT 60,
  burst_limit     INT NOT NULL DEFAULT 10,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- SYSTEM SETTINGS (feature flags, maintenance, limits)
-- -----------------------------------------------------------------------------

CREATE TABLE system_settings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key             VARCHAR(100) NOT NULL UNIQUE,
  value           JSONB NOT NULL DEFAULT '{}',
  description     TEXT,
  is_public       BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- BACKUP LOGS
-- -----------------------------------------------------------------------------

CREATE TABLE backup_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  backup_type     VARCHAR(50) NOT NULL,
  status          backup_status NOT NULL DEFAULT 'STARTED',
  storage_target  VARCHAR(120),
  size_bytes      BIGINT,
  notes           TEXT,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

-- -----------------------------------------------------------------------------
-- REQUEST METRICS (observability samples)
-- -----------------------------------------------------------------------------

CREATE TABLE request_metrics (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route           VARCHAR(200) NOT NULL,
  method          VARCHAR(10) NOT NULL,
  status_code     INT NOT NULL,
  duration_ms     INT NOT NULL,
  correlation_id  VARCHAR(64),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_request_metrics_route ON request_metrics(route, created_at DESC);
