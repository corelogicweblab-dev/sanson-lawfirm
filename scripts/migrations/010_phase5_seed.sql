-- =============================================================================
-- SANSON Legal OS — Phase 5 Seed
-- =============================================================================

INSERT INTO knowledge_categories (name, display_name, sort_order) VALUES
  ('PROCEDURES', 'Legal Procedures', 1),
  ('GUIDELINES', 'Firm Guidelines', 2),
  ('TEMPLATES', 'Templates', 3),
  ('POLICIES', 'Policies', 4),
  ('REFERENCES', 'Internal References', 5),
  ('TRAINING', 'Training Materials', 6),
  ('RESEARCH', 'Legal Research Notes', 7)
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (name, display_name, description, module) VALUES
  ('search:read', 'Search', 'Perform semantic and keyword search', 'search'),
  ('search:admin', 'Search Analytics', 'View search analytics and metrics', 'search'),
  ('knowledge:read', 'Read Knowledge', 'View knowledge base articles', 'knowledge'),
  ('knowledge:write', 'Write Knowledge', 'Create and edit knowledge articles', 'knowledge'),
  ('embeddings:run', 'Run Embeddings', 'Trigger embedding generation', 'embeddings'),
  ('recommendations:read', 'Read Recommendations', 'View AI recommendations', 'recommendations'),
  ('context:read', 'Read AI Context', 'Generate case/document context', 'context')
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'CLIENT' AND p.name IN ('search:read', 'knowledge:read')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'LAWYER' AND p.name IN (
  'search:read', 'knowledge:read', 'knowledge:write',
  'embeddings:run', 'recommendations:read', 'context:read'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'PARALEGAL' AND p.name IN (
  'search:read', 'knowledge:read', 'embeddings:run', 'recommendations:read', 'context:read'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ADMIN' AND p.module IN (
  'search', 'knowledge', 'embeddings', 'recommendations', 'context'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;
