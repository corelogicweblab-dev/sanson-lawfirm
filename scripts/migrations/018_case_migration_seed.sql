-- Case Migration Center permissions + paralegal assign rights

INSERT INTO permissions (name, display_name, description, module) VALUES
  ('migration:read', 'Migration Read', 'View case migration queue and jobs', 'migration'),
  ('migration:write', 'Migration Write', 'Import legacy cases, bulk data, validate records', 'migration')
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'PARALEGAL' AND p.name IN (
  'migration:read', 'migration:write', 'cases:assign'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ADMIN' AND p.name IN ('migration:read', 'migration:write')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'PARALEGAL' AND p.name = 'cases:assign'
ON CONFLICT (role_id, permission_id) DO NOTHING;
