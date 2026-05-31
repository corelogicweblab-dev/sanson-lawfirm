-- =============================================================================
-- Case Migration Center — legacy onboarding & bulk import
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE case_migration_item_status AS ENUM (
    'PENDING', 'VALIDATED', 'IMPORTED', 'FAILED', 'SKIPPED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE case_migration_job_type AS ENUM (
    'LEGACY_CASE', 'BULK_CASES', 'BULK_DOCUMENTS', 'ASSIGNMENT', 'VALIDATION'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS case_migration_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type case_migration_job_type NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'COMPLETED',
  created_by UUID NOT NULL REFERENCES users(id),
  total_items INT NOT NULL DEFAULT 0,
  success_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS case_migration_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES case_migration_jobs(id) ON DELETE CASCADE,
  legacy_reference VARCHAR(120),
  title VARCHAR(255) NOT NULL,
  client_email VARCHAR(255),
  case_category VARCHAR(50) DEFAULT 'CIVIL',
  status case_migration_item_status NOT NULL DEFAULT 'PENDING',
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  assigned_lawyer_id UUID REFERENCES users(id),
  assigned_paralegal_id UUID REFERENCES users(id),
  validation_notes TEXT,
  error_message TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL REFERENCES users(id),
  validated_by UUID REFERENCES users(id),
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_migration_items_status
  ON case_migration_items (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_case_migration_jobs_created
  ON case_migration_jobs (created_at DESC);
