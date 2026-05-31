-- =============================================================================
-- SANSON Legal OS — Phase 1 Database Schema (idempotent — safe to re-run)
-- PostgreSQL (Supabase)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- ENUMS
-- -----------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('CLIENT', 'LAWYER', 'PARALEGAL', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- ROLES
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS roles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          user_role NOT NULL UNIQUE,
  display_name  VARCHAR(100) NOT NULL,
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- PERMISSIONS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS permissions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(100) NOT NULL UNIQUE,
  display_name  VARCHAR(150) NOT NULL,
  description   TEXT,
  module        VARCHAR(50) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- ROLE PERMISSIONS (junction)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS role_permissions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id         UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id   UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  UNIQUE(role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- USERS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid    VARCHAR(128) NOT NULL UNIQUE,
  email           VARCHAR(255) NOT NULL UNIQUE,
  role_id         UUID NOT NULL REFERENCES roles(id),
  status          user_status NOT NULL DEFAULT 'ACTIVE',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- USER PROFILES
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  first_name      VARCHAR(100) NOT NULL,
  middle_name     VARCHAR(100),
  last_name       VARCHAR(100) NOT NULL,
  suffix          VARCHAR(20),
  phone           VARCHAR(30),
  address         TEXT,
  profile_photo   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user ON user_profiles(user_id) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- AUDIT LOGS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action          VARCHAR(100) NOT NULL,
  entity_type     VARCHAR(100) NOT NULL,
  entity_id       UUID,
  performed_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address      INET,
  user_agent      TEXT,
  old_values      JSONB,
  new_values      JSONB,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by ON audit_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- -----------------------------------------------------------------------------
-- UPDATED_AT TRIGGER
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_roles_updated_at ON roles;
CREATE TRIGGER trg_roles_updated_at BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_permissions_updated_at ON permissions;
CREATE TRIGGER trg_permissions_updated_at BEFORE UPDATE ON permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_role_permissions_updated_at ON role_permissions;
CREATE TRIGGER trg_role_permissions_updated_at BEFORE UPDATE ON role_permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_audit_logs_updated_at ON audit_logs;
CREATE TRIGGER trg_audit_logs_updated_at BEFORE UPDATE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
