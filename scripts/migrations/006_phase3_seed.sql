-- =============================================================================
-- SANSON Legal OS — Phase 3 Seed Data (permissions)
-- =============================================================================

INSERT INTO permissions (name, display_name, description, module) VALUES
  ('chat:read', 'Read Chat Sessions', 'View AI chat sessions and history', 'chat'),
  ('chat:write', 'Write Chat Sessions', 'Send messages and manage chat sessions', 'chat'),
  ('chat:create', 'Create Chat Sessions', 'Start AI legal assistant sessions', 'chat'),
  ('ai:read', 'Read AI Insights', 'View AI classifications and summaries', 'ai'),
  ('ai:generate', 'Generate AI Insights', 'Trigger classification and summary generation', 'ai')
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'CLIENT' AND p.name IN ('chat:read', 'chat:write', 'chat:create', 'ai:read')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'LAWYER' AND p.name IN ('chat:read', 'ai:read', 'ai:generate')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'PARALEGAL' AND p.name IN ('chat:read', 'ai:read')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ADMIN' AND p.module IN ('chat', 'ai')
ON CONFLICT (role_id, permission_id) DO NOTHING;
