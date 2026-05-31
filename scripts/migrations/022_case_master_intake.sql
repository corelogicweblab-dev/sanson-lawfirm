-- Master case intake — extended client, opposing party, case metadata (JSONB)

ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS master_data JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS client_details JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS case_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  party_role VARCHAR(32) NOT NULL DEFAULT 'OPPOSING',
  party_type VARCHAR(32) NOT NULL DEFAULT 'INDIVIDUAL',
  full_name VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(30),
  contact_email VARCHAR(255),
  address TEXT,
  province VARCHAR(100),
  city VARCHAR(100),
  relationship_to_case VARCHAR(120),
  position_in_case VARCHAR(120),
  notes TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_parties_case ON case_parties (case_id);

INSERT INTO case_statuses (name, display_name, color, sort_order, is_terminal) VALUES
  ('DRAFT', 'Draft', '#a855f7', 0, FALSE)
ON CONFLICT (name) DO NOTHING;

-- Extended source types (run each; ignore if exists)
DO $$ BEGIN
  ALTER TYPE case_source_type ADD VALUE 'WALK_IN';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE case_source_type ADD VALUE 'REFERRAL';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE case_source_type ADD VALUE 'PHONE_INQUIRY';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE case_source_type ADD VALUE 'EMAIL_INQUIRY';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON COLUMN cases.master_data IS 'Enterprise case intake: facts, dates, team, notes, AI intake snapshot';
