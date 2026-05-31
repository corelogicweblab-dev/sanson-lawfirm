-- =============================================================================
-- SANSON Legal OS — DROP ALL APPLICATION SCHEMA (public)
-- =============================================================================
-- WARNING: Deletes ALL tables, enums, and app functions in schema `public`.
--          All case/user/document data will be permanently removed.
--
-- Does NOT touch: auth.*, storage.*, Supabase system schemas.
--
-- After this succeeds, re-run migrations in order:
--   001_phase1_schema.sql → … → 020_operations_model_rbac.sql
-- =============================================================================

-- 1) Drop every table in public (CASCADE clears FKs, triggers, indexes)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', r.tablename);
  END LOOP;
END $$;

-- 2) Drop every custom ENUM in public
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT t.typname
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typtype = 'e'
  LOOP
    EXECUTE format('DROP TYPE IF EXISTS public.%I CASCADE', r.typname);
  END LOOP;
END $$;

-- 3) Drop app trigger functions (tables already gone)
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Verify clean slate (should return 0 rows)
SELECT COUNT(*) AS remaining_public_tables
FROM pg_tables
WHERE schemaname = 'public';

SELECT 'Schema cleared. Run 001_phase1_schema.sql next.' AS next_step;
