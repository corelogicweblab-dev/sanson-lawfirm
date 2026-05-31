-- =============================================================================
-- SANSON Legal OS — Phase 6 Seed
-- =============================================================================

INSERT INTO permissions (name, display_name, description, module) VALUES
  ('mobile:read', 'Mobile Access', 'Access mobile API and dashboards', 'mobile'),
  ('devices:register', 'Register Device', 'Register mobile device and push token', 'mobile'),
  ('notifications:read', 'Read Notifications', 'View notification center', 'notifications'),
  ('notifications:write', 'Manage Notifications', 'Update notification preferences', 'notifications'),
  ('sync:read', 'Read Sync Events', 'Subscribe to realtime sync feed', 'sync')
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'CLIENT' AND p.name IN (
  'mobile:read', 'devices:register', 'notifications:read', 'notifications:write', 'sync:read'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'LAWYER' AND p.name IN (
  'mobile:read', 'devices:register', 'notifications:read', 'notifications:write', 'sync:read'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'PARALEGAL' AND p.name IN (
  'mobile:read', 'devices:register', 'notifications:read', 'notifications:write', 'sync:read'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ADMIN' AND p.name IN (
  'mobile:read', 'devices:register', 'notifications:read', 'notifications:write', 'sync:read'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;
