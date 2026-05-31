-- Paralegal-centric file authority: paralegals manage files; lawyers review only

DELETE FROM role_permissions rp
USING roles r, permissions p
WHERE rp.role_id = r.id AND rp.permission_id = p.id
  AND r.name = 'LAWYER'
  AND p.name IN ('documents:write', 'documents:delete', 'evidence:write');

-- Ensure paralegal has full file + calendar ops (idempotent)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'PARALEGAL' AND p.name IN (
  'documents:read', 'documents:write', 'documents:delete', 'documents:review',
  'evidence:read', 'evidence:write',
  'ocr:run', 'document_analysis:run',
  'evidence_timelines:read', 'evidence_timelines:write',
  'appointments:read', 'appointments:write', 'appointments:schedule',
  'cases:assign', 'migration:read', 'migration:write',
  'legal_requests:read', 'legal_requests:write', 'legal_requests:create'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

UPDATE roles SET
  description = 'Primary legal operations operator — cases, files, calendar, intake, migration'
WHERE name = 'PARALEGAL';

UPDATE roles SET
  description = 'Legal review, strategy, approvals, and case closure — no routine file management'
WHERE name = 'LAWYER';
