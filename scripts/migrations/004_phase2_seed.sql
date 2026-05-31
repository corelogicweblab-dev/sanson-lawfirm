-- =============================================================================
-- SANSON Legal OS â€” Phase 2 Seed Data
-- =============================================================================

-- Case Statuses
INSERT INTO case_statuses (name, display_name, color, sort_order, is_terminal) VALUES
  ('OPEN', 'Open', '#ec4899', 1, FALSE),
  ('IN_PROGRESS', 'In Progress', '#3b82f6', 2, FALSE),
  ('WAITING_DOCUMENTS', 'Waiting Documents', '#f59e0b', 3, FALSE),
  ('UNDER_REVIEW', 'Under Review', '#8b5cf6', 4, FALSE),
  ('FOR_FILING', 'For Filing', '#06b6d4', 5, FALSE),
  ('FILED', 'Filed', '#10b981', 6, FALSE),
  ('IN_COURT', 'In Court', '#6366f1', 7, FALSE),
  ('RESOLVED', 'Resolved', '#22c55e', 8, FALSE),
  ('CLOSED', 'Closed', '#6b7280', 9, TRUE),
  ('ARCHIVED', 'Archived', '#374151', 10, TRUE)
ON CONFLICT (name) DO NOTHING;

-- Phase 2 Permissions
INSERT INTO permissions (name, display_name, description, module) VALUES
  ('legal_requests:read', 'Read Legal Requests', 'View legal representation requests', 'legal_requests'),
  ('legal_requests:write', 'Write Legal Requests', 'Update legal requests', 'legal_requests'),
  ('legal_requests:create', 'Create Legal Requests', 'Submit representation requests', 'legal_requests'),
  ('appointments:read', 'Read Appointments', 'View appointments', 'appointments'),
  ('appointments:write', 'Write Appointments', 'Manage appointments', 'appointments'),
  ('appointments:schedule', 'Schedule Appointments', 'Create and schedule consultations', 'appointments'),
  ('cases:read', 'Read Cases', 'View cases', 'cases'),
  ('cases:write', 'Write Cases', 'Update cases', 'cases'),
  ('cases:assign', 'Assign Cases', 'Assign lawyers and paralegals', 'cases'),
  ('tasks:read', 'Read Tasks', 'View tasks', 'tasks'),
  ('tasks:write', 'Write Tasks', 'Create and update tasks', 'tasks'),
  ('comments:read', 'Read Comments', 'View internal comments', 'comments'),
  ('comments:write', 'Write Comments', 'Post internal comments', 'comments'),
  ('consultations:read', 'Read Consultations', 'View consultation notes and outcomes', 'consultations'),
  ('consultations:write', 'Write Consultations', 'Record consultation notes and outcomes', 'consultations'),
  ('timelines:read', 'Read Timelines', 'View case timelines', 'timelines'),
  ('timelines:write', 'Write Timelines', 'Add timeline events', 'timelines')
ON CONFLICT (name) DO NOTHING;

-- CLIENT permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'CLIENT' AND p.name IN (
  'legal_requests:read', 'legal_requests:create',
  'appointments:read', 'cases:read', 'timelines:read'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- LAWYER permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'LAWYER' AND p.name IN (
  'legal_requests:read', 'legal_requests:write',
  'appointments:read', 'appointments:write', 'appointments:schedule',
  'cases:read', 'cases:write', 'cases:assign',
  'tasks:read', 'tasks:write',
  'comments:read', 'comments:write',
  'consultations:read', 'consultations:write',
  'timelines:read', 'timelines:write'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- PARALEGAL permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'PARALEGAL' AND p.name IN (
  'legal_requests:read',
  'appointments:read',
  'cases:read', 'cases:write',
  'tasks:read', 'tasks:write',
  'comments:read', 'comments:write',
  'consultations:read',
  'timelines:read', 'timelines:write'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ADMIN gets all new permissions (already has all via full insert in phase 1, add any missing)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ADMIN' AND p.module IN (
  'legal_requests', 'appointments', 'cases', 'tasks', 'comments', 'consultations', 'timelines'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;


