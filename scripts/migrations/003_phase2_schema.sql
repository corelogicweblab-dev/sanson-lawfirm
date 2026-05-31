-- =============================================================================
-- SANSON Legal OS â€” Phase 2 Schema
-- Legal requests, appointments, cases, tasks, consultations, timelines
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ENUMS
-- -----------------------------------------------------------------------------

CREATE TYPE case_category AS ENUM (
  'CRIMINAL', 'CIVIL', 'FAMILY', 'LABOR', 'CYBERCRIME', 'ADMINISTRATIVE',
  'CORPORATE', 'PROPERTY', 'CONTRACT_DISPUTES', 'CONSUMER_PROTECTION', 'OTHER'
);

CREATE TYPE priority_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

CREATE TYPE legal_request_status AS ENUM (
  'NEW', 'UNDER_REVIEW', 'WAITING_FOR_SCHEDULE', 'SCHEDULED',
  'CONSULTED', 'APPROVED', 'DECLINED', 'CONVERTED_TO_CASE'
);

CREATE TYPE consultation_type AS ENUM ('ONLINE', 'ONSITE');

CREATE TYPE appointment_status AS ENUM (
  'PENDING', 'CONFIRMED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'
);

CREATE TYPE task_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

CREATE TYPE assignee_role AS ENUM ('LAWYER', 'PARALEGAL');

CREATE TYPE consultation_outcome_type AS ENUM (
  'PROCEED_WITH_CASE', 'REQUIRE_MORE_DOCUMENTS',
  'REFER_TO_OTHER_COUNSEL', 'DECLINED', 'CLOSED'
);

CREATE TYPE timeline_event_type AS ENUM (
  'CONSULTATION', 'ASSIGNMENT', 'STATUS_CHANGE', 'DOCUMENT_REQUEST',
  'COURT_ACTIVITY', 'TASK', 'COMMENT', 'NOTE', 'OTHER'
);

-- -----------------------------------------------------------------------------
-- CASE STATUSES (lookup)
-- -----------------------------------------------------------------------------

CREATE TABLE case_statuses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(50) NOT NULL UNIQUE,
  display_name  VARCHAR(100) NOT NULL,
  description   TEXT,
  color         VARCHAR(20),
  sort_order    INT NOT NULL DEFAULT 0,
  is_terminal   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX idx_case_statuses_name ON case_statuses(name) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- LEGAL REQUESTS
-- -----------------------------------------------------------------------------

CREATE TABLE legal_requests (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id           UUID NOT NULL REFERENCES users(id),
  request_reference   VARCHAR(30) NOT NULL UNIQUE,
  case_category       case_category NOT NULL,
  subject             VARCHAR(255) NOT NULL,
  description         TEXT NOT NULL,
  status              legal_request_status NOT NULL DEFAULT 'NEW',
  priority            priority_level NOT NULL DEFAULT 'MEDIUM',
  requested_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_legal_requests_client ON legal_requests(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_legal_requests_status ON legal_requests(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_legal_requests_reference ON legal_requests(request_reference);

-- -----------------------------------------------------------------------------
-- APPOINTMENTS
-- -----------------------------------------------------------------------------

CREATE TABLE appointments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id          UUID NOT NULL REFERENCES legal_requests(id),
  client_id           UUID NOT NULL REFERENCES users(id),
  lawyer_id           UUID REFERENCES users(id),
  appointment_date    DATE NOT NULL,
  appointment_time    TIME NOT NULL,
  consultation_type   consultation_type NOT NULL DEFAULT 'ONLINE',
  status              appointment_status NOT NULL DEFAULT 'PENDING',
  remarks             TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_appointments_request ON appointments(request_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_client ON appointments(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_lawyer ON appointments(lawyer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_date ON appointments(appointment_date) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- CASES
-- -----------------------------------------------------------------------------

CREATE TABLE cases (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_number             VARCHAR(30) NOT NULL UNIQUE,
  request_id              UUID REFERENCES legal_requests(id),
  client_id               UUID NOT NULL REFERENCES users(id),
  assigned_lawyer_id      UUID REFERENCES users(id),
  assigned_paralegal_id   UUID REFERENCES users(id),
  status_id               UUID NOT NULL REFERENCES case_statuses(id),
  case_category           case_category NOT NULL,
  title                   VARCHAR(255) NOT NULL,
  description             TEXT,
  priority                priority_level NOT NULL DEFAULT 'MEDIUM',
  opened_at               TIMESTAMPTZ,
  closed_at               TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ
);

CREATE INDEX idx_cases_client ON cases(client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_cases_lawyer ON cases(assigned_lawyer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_cases_paralegal ON cases(assigned_paralegal_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_cases_status ON cases(status_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_cases_number ON cases(case_number);

-- -----------------------------------------------------------------------------
-- CASE ACTIVITIES
-- -----------------------------------------------------------------------------

CREATE TABLE case_activities (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id         UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  activity_type   VARCHAR(100) NOT NULL,
  description     TEXT,
  performed_by    UUID REFERENCES users(id),
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_case_activities_case ON case_activities(case_id) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- CASE ASSIGNMENTS (history + active)
-- -----------------------------------------------------------------------------

CREATE TABLE case_assignments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id         UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  assignee_id     UUID NOT NULL REFERENCES users(id),
  assignee_role   assignee_role NOT NULL,
  assigned_by     UUID NOT NULL REFERENCES users(id),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  notes           TEXT,
  assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_case_assignments_case ON case_assignments(case_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_case_assignments_assignee ON case_assignments(assignee_id) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- CONSULTATION NOTES
-- -----------------------------------------------------------------------------

CREATE TABLE consultation_notes (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id          UUID REFERENCES appointments(id),
  request_id              UUID REFERENCES legal_requests(id),
  lawyer_id               UUID NOT NULL REFERENCES users(id),
  findings                TEXT,
  legal_assessment        TEXT,
  recommendations         TEXT,
  missing_requirements    TEXT,
  next_actions            TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ
);

CREATE INDEX idx_consultation_notes_appointment ON consultation_notes(appointment_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_consultation_notes_request ON consultation_notes(request_id) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- CONSULTATION OUTCOMES
-- -----------------------------------------------------------------------------

CREATE TABLE consultation_outcomes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id  UUID REFERENCES appointments(id),
  request_id      UUID REFERENCES legal_requests(id),
  outcome         consultation_outcome_type NOT NULL,
  notes           TEXT,
  recorded_by     UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_consultation_outcomes_request ON consultation_outcomes(request_id) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- TASKS
-- -----------------------------------------------------------------------------

CREATE TABLE tasks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id         UUID REFERENCES cases(id) ON DELETE CASCADE,
  request_id      UUID REFERENCES legal_requests(id) ON DELETE SET NULL,
  assigned_to     UUID REFERENCES users(id),
  created_by      UUID NOT NULL REFERENCES users(id),
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  status          task_status NOT NULL DEFAULT 'PENDING',
  priority        priority_level NOT NULL DEFAULT 'MEDIUM',
  due_date        TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_tasks_case ON tasks(case_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_status ON tasks(status) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- COMMENTS (internal)
-- -----------------------------------------------------------------------------

CREATE TABLE comments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id         UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id),
  content         TEXT NOT NULL,
  parent_id       UUID REFERENCES comments(id),
  mentions        JSONB DEFAULT '[]',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_comments_case ON comments(case_id) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- TIMELINES
-- -----------------------------------------------------------------------------

CREATE TABLE timelines (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id         UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  event_type      timeline_event_type NOT NULL DEFAULT 'OTHER',
  event_date      TIMESTAMPTZ NOT NULL,
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  source          VARCHAR(50) DEFAULT 'manual',
  reference_id    UUID,
  metadata        JSONB DEFAULT '{}',
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_timelines_case ON timelines(case_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_timelines_date ON timelines(event_date) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- TRIGGERS
-- -----------------------------------------------------------------------------

CREATE TRIGGER trg_case_statuses_updated_at BEFORE UPDATE ON case_statuses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_legal_requests_updated_at BEFORE UPDATE ON legal_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_cases_updated_at BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_case_activities_updated_at BEFORE UPDATE ON case_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_case_assignments_updated_at BEFORE UPDATE ON case_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_consultation_notes_updated_at BEFORE UPDATE ON consultation_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_consultation_outcomes_updated_at BEFORE UPDATE ON consultation_outcomes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_timelines_updated_at BEFORE UPDATE ON timelines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


