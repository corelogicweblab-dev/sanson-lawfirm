-- Case source tracking — single centralized repository (LEGACY | AI_INTAKE | MANUAL)

DO $$ BEGIN
  CREATE TYPE case_source_type AS ENUM ('LEGACY', 'AI_INTAKE', 'MANUAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS source_type case_source_type NOT NULL DEFAULT 'MANUAL';

CREATE INDEX IF NOT EXISTS idx_cases_source_type ON cases (source_type);

COMMENT ON COLUMN cases.source_type IS 'Origin: LEGACY (migration), AI_INTAKE (from legal request), MANUAL (paralegal draft)';
