-- =============================================================================
-- SANSON Legal OS — Phase 6 Schema
-- Mobile devices, push, notifications, sync logs
-- =============================================================================

CREATE TYPE device_platform AS ENUM ('IOS', 'ANDROID', 'WEB');
CREATE TYPE push_delivery_status AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');
CREATE TYPE notification_channel AS ENUM (
  'APPOINTMENT_CONFIRMED',
  'APPOINTMENT_RESCHEDULED',
  'CONSULTATION_REMINDER',
  'CASE_UPDATED',
  'TASK_ASSIGNED',
  'DOCUMENT_UPLOADED',
  'LAWYER_ASSIGNMENT',
  'AI_PROCESSING_COMPLETE',
  'SYSTEM_ALERT',
  'GENERAL'
);
CREATE TYPE sync_event_type AS ENUM (
  'CASE_UPDATE',
  'ASSIGNMENT_CHANGE',
  'APPOINTMENT_CHANGE',
  'DOCUMENT_UPLOAD',
  'AI_SUMMARY',
  'TASK_UPDATE',
  'COMMENT',
  'TIMELINE_UPDATE',
  'NOTIFICATION'
);

-- -----------------------------------------------------------------------------
-- MOBILE DEVICES
-- -----------------------------------------------------------------------------

CREATE TABLE mobile_devices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_name     VARCHAR(120) NOT NULL,
  platform        device_platform NOT NULL DEFAULT 'ANDROID',
  device_uuid     VARCHAR(128) NOT NULL,
  app_version     VARCHAR(32),
  os_version      VARCHAR(32),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen_at    TIMESTAMPTZ,
  biometric_ready BOOLEAN NOT NULL DEFAULT FALSE,
  revoked_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, device_uuid)
);

CREATE INDEX idx_mobile_devices_user ON mobile_devices(user_id);

-- -----------------------------------------------------------------------------
-- PUSH TOKENS (FCM)
-- -----------------------------------------------------------------------------

CREATE TABLE push_tokens (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id       UUID REFERENCES mobile_devices(id) ON DELETE CASCADE,
  fcm_token       TEXT NOT NULL,
  platform        device_platform NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (fcm_token)
);

CREATE INDEX idx_push_tokens_user ON push_tokens(user_id);

-- -----------------------------------------------------------------------------
-- NOTIFICATION PREFERENCES
-- -----------------------------------------------------------------------------

CREATE TABLE notification_preferences (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  push_enabled          BOOLEAN NOT NULL DEFAULT TRUE,
  email_enabled         BOOLEAN NOT NULL DEFAULT FALSE,
  appointment_alerts    BOOLEAN NOT NULL DEFAULT TRUE,
  case_alerts           BOOLEAN NOT NULL DEFAULT TRUE,
  task_alerts           BOOLEAN NOT NULL DEFAULT TRUE,
  document_alerts       BOOLEAN NOT NULL DEFAULT TRUE,
  ai_alerts             BOOLEAN NOT NULL DEFAULT TRUE,
  system_alerts         BOOLEAN NOT NULL DEFAULT TRUE,
  quiet_hours_start     TIME,
  quiet_hours_end       TIME,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- IN-APP + PUSH NOTIFICATION QUEUE
-- -----------------------------------------------------------------------------

CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel         notification_channel NOT NULL DEFAULT 'GENERAL',
  title           VARCHAR(255) NOT NULL,
  body            TEXT NOT NULL,
  payload         JSONB DEFAULT '{}',
  entity_type     VARCHAR(80),
  entity_id       UUID,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  read_at         TIMESTAMPTZ,
  push_status     push_delivery_status NOT NULL DEFAULT 'PENDING',
  push_sent_at    TIMESTAMPTZ,
  push_error      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- -----------------------------------------------------------------------------
-- SYNC LOGS (realtime / offline recovery)
-- -----------------------------------------------------------------------------

CREATE TABLE sync_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type      sync_event_type NOT NULL,
  entity_type     VARCHAR(80) NOT NULL,
  entity_id       UUID,
  actor_id        UUID REFERENCES users(id),
  payload         JSONB DEFAULT '{}',
  channel_name    VARCHAR(120),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sync_logs_created ON sync_logs(created_at DESC);
CREATE INDEX idx_sync_logs_entity ON sync_logs(entity_type, entity_id);
