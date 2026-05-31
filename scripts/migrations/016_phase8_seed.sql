-- =============================================================================
-- SANSON Legal OS — Phase 8 Seed
-- =============================================================================

INSERT INTO permissions (name, display_name, description, module) VALUES
  ('ops:read', 'Operations Read', 'View deployment, monitoring, and ops dashboards', 'ops'),
  ('ops:write', 'Operations Write', 'Record deployments and resolve alerts', 'ops')
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ADMIN' AND p.name IN ('ops:read', 'ops:write')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO system_settings (key, value, description, is_public) VALUES
  ('scaling_readiness', '{"multi_branch_ready": true, "multi_tenant_enabled": false, "max_lawyers_hint": 50}', 'Future expansion flags (architecture only)', false),
  ('performance_targets', '{"api_avg_ms": 500, "dashboard_load_s": 2, "search_s": 2}', 'SLO targets for monitoring', false),
  ('alert_thresholds', '{"api_error_rate_pct": 5, "api_latency_ms": 2000, "ai_failure_count": 10}', 'Auto-alert thresholds', false)
ON CONFLICT (key) DO NOTHING;

INSERT INTO migration_runs (version, filename, checksum, status, applied_by, notes)
SELECT v, f, NULL, 'applied', 'phase8_seed', 'Baseline manifest entry'
FROM (VALUES
  ('001', '001_phase1_schema.sql'),
  ('002', '002_phase1_seed.sql'),
  ('003', '003_phase2_schema.sql'),
  ('004', '004_phase2_seed.sql'),
  ('005', '005_phase3_schema.sql'),
  ('006', '006_phase3_seed.sql'),
  ('007', '007_phase4_schema.sql'),
  ('008', '008_phase4_seed.sql'),
  ('009', '009_phase5_schema.sql'),
  ('010', '010_phase5_seed.sql'),
  ('011', '011_phase6_schema.sql'),
  ('012', '012_phase6_seed.sql'),
  ('013', '013_phase7_schema.sql'),
  ('014', '014_phase7_seed.sql'),
  ('015', '015_phase8_schema.sql'),
  ('016', '016_phase8_seed.sql')
) AS t(v, f)
ON CONFLICT (version) DO NOTHING;
