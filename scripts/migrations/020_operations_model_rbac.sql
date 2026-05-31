-- Paralegal-centric operations model — separate platform ADMIN from legal operations

UPDATE roles SET
  display_name = 'System Administrator',
  description = 'Technical platform administrator — no legal operations'
WHERE name = 'ADMIN';

UPDATE roles SET
  description = 'Primary legal operations operator — intake, cases, calendar, coordination'
WHERE name = 'PARALEGAL';

-- Lawyer approval / closure
INSERT INTO permissions (name, display_name, description, module) VALUES
  ('cases:approve', 'Approve Cases', 'Approve cases and official filings', 'cases'),
  ('cases:close', 'Close Cases', 'Close cases and terminal status changes', 'cases')
ON CONFLICT (name) DO NOTHING;

-- Remove all ADMIN legal-operation permissions (platform-only admin)
DELETE FROM role_permissions rp
USING roles r
WHERE rp.role_id = r.id AND r.name = 'ADMIN';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ADMIN' AND p.name IN (
  'profile:read', 'profile:write', 'dashboard:admin',
  'users:read', 'users:write', 'users:delete',
  'roles:read', 'roles:write', 'permissions:read', 'permissions:write',
  'audit:read',
  'security:read', 'security:write',
  'system:read', 'system:write',
  'sessions:read', 'sessions:write',
  'ai_audit:read',
  'ops:read', 'ops:write',
  'cases:read', 'legal_requests:read', 'migration:read'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Paralegal — primary operator (draft cases, calendar, intake, migration)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'PARALEGAL' AND p.name IN (
  'legal_requests:read', 'legal_requests:write', 'legal_requests:create',
  'appointments:read', 'appointments:write', 'appointments:schedule',
  'cases:read', 'cases:write', 'cases:assign',
  'tasks:read', 'tasks:write',
  'comments:read', 'comments:write',
  'consultations:read', 'consultations:write',
  'timelines:read', 'timelines:write',
  'migration:read', 'migration:write'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Lawyer — review, approve, close (not routine data entry)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'LAWYER' AND p.name IN ('cases:approve', 'cases:close')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Revoke migration write from ADMIN if re-added elsewhere
DELETE FROM role_permissions rp
USING roles r, permissions p
WHERE rp.role_id = r.id AND rp.permission_id = p.id
  AND r.name = 'ADMIN'
  AND p.name IN ('migration:write', 'cases:write', 'cases:assign');
