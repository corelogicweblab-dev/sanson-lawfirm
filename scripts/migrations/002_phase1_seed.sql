-- =============================================================================
-- SANSON Legal OS â€” Phase 1 Seed Data
-- Roles, Permissions, Role-Permission Matrix
-- =============================================================================

-- Default Roles
INSERT INTO roles (name, display_name, description) VALUES
  ('CLIENT', 'Client', 'Law firm client with portal access'),
  ('LAWYER', 'Lawyer', 'Licensed attorney with case management access'),
  ('PARALEGAL', 'Paralegal', 'Legal support staff'),
  ('ADMIN', 'Administrator', 'System administrator with full access')
ON CONFLICT (name) DO NOTHING;

-- Default Permissions
INSERT INTO permissions (name, display_name, description, module) VALUES
  ('users:read', 'Read Users', 'View user records', 'users'),
  ('users:write', 'Write Users', 'Create and update user records', 'users'),
  ('users:delete', 'Delete Users', 'Deactivate or remove users', 'users'),
  ('roles:read', 'Read Roles', 'View roles and assignments', 'roles'),
  ('roles:write', 'Write Roles', 'Manage role assignments', 'roles'),
  ('permissions:read', 'Read Permissions', 'View permission definitions', 'permissions'),
  ('permissions:write', 'Write Permissions', 'Manage permission assignments', 'permissions'),
  ('audit:read', 'Read Audit Logs', 'View audit trail', 'audit'),
  ('profile:read', 'Read Profile', 'View own profile', 'profile'),
  ('profile:write', 'Write Profile', 'Update own profile', 'profile'),
  ('dashboard:client', 'Client Dashboard', 'Access client dashboard', 'dashboard'),
  ('dashboard:lawyer', 'Lawyer Dashboard', 'Access lawyer dashboard', 'dashboard'),
  ('dashboard:paralegal', 'Paralegal Dashboard', 'Access paralegal dashboard', 'dashboard'),
  ('dashboard:admin', 'Admin Dashboard', 'Access admin dashboard', 'dashboard')
ON CONFLICT (name) DO NOTHING;

-- Role-Permission Matrix
-- CLIENT
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'CLIENT' AND p.name IN (
  'profile:read', 'profile:write', 'dashboard:client'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- LAWYER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'LAWYER' AND p.name IN (
  'profile:read', 'profile:write', 'dashboard:lawyer', 'users:read'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- PARALEGAL
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'PARALEGAL' AND p.name IN (
  'profile:read', 'profile:write', 'dashboard:paralegal', 'users:read'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ADMIN (all permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ADMIN'
ON CONFLICT (role_id, permission_id) DO NOTHING;

