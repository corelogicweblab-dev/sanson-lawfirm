-- =============================================================================
-- SANSON Legal OS — Phase 8: Production Ops, Deployments & Alerting
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE deployment_environment AS ENUM ('development', 'staging', 'production');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE deployment_status AS ENUM ('pending', 'in_progress', 'success', 'failed', 'rolled_back');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE alert_category AS ENUM (
    'api', 'database', 'storage', 'ai', 'auth', 'deployment', 'search', 'system'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE migration_run_status AS ENUM ('pending', 'applied', 'failed', 'rolled_back');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS migration_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version VARCHAR(32) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  checksum VARCHAR(64),
  status migration_run_status NOT NULL DEFAULT 'applied',
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  applied_by VARCHAR(128),
  notes TEXT,
  UNIQUE (version)
);

CREATE TABLE IF NOT EXISTS deployment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  environment deployment_environment NOT NULL DEFAULT 'production',
  service VARCHAR(64) NOT NULL,
  version VARCHAR(64),
  git_ref VARCHAR(128),
  status deployment_status NOT NULL DEFAULT 'success',
  deployed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deployed_by VARCHAR(128),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_deployment_logs_env_at
  ON deployment_logs (environment, deployed_at DESC);

CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category alert_category NOT NULL DEFAULT 'system',
  severity alert_severity NOT NULL DEFAULT 'info',
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  source VARCHAR(80),
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_alerts_open
  ON system_alerts (resolved, severity, created_at DESC);
