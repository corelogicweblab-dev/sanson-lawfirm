-- Allow system administrators to view and remove firm documents (platform ops)

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ADMIN' AND p.name IN ('documents:read', 'documents:delete')
ON CONFLICT (role_id, permission_id) DO NOTHING;
