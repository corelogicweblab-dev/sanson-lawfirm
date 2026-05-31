-- =============================================================================
-- SANSON Legal OS — Phase 4 Seed
-- =============================================================================

INSERT INTO document_categories (name, display_name, sort_order) VALUES
  ('CONTRACT', 'Contract', 1),
  ('EVIDENCE', 'Evidence', 2),
  ('AFFIDAVIT', 'Affidavit', 3),
  ('COURT_FILING', 'Court Filing', 4),
  ('IDENTIFICATION', 'Identification', 5),
  ('GOVERNMENT_RECORD', 'Government Record', 6),
  ('PHOTOGRAPH', 'Photograph', 7),
  ('SCREENSHOT', 'Screenshot', 8),
  ('MEDICAL_RECORD', 'Medical Record', 9),
  ('FINANCIAL_RECORD', 'Financial Record', 10),
  ('CORRESPONDENCE', 'Correspondence', 11),
  ('OTHER', 'Other', 99)
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (name, display_name, description, module) VALUES
  ('documents:read', 'Read Documents', 'View and download documents', 'documents'),
  ('documents:write', 'Write Documents', 'Upload and update documents', 'documents'),
  ('documents:delete', 'Delete Documents', 'Soft-delete documents', 'documents'),
  ('documents:review', 'Review Documents', 'Lawyer/staff document review', 'documents'),
  ('evidence:read', 'Read Evidence', 'View evidence repository', 'evidence'),
  ('evidence:write', 'Write Evidence', 'Manage evidence items', 'evidence'),
  ('ocr:run', 'Run OCR', 'Trigger OCR processing', 'ocr'),
  ('document_analysis:run', 'Run Document Analysis', 'Trigger AI document analysis', 'document_analysis'),
  ('evidence_timelines:read', 'Read Evidence Timelines', 'View AI evidence timelines', 'evidence_timelines'),
  ('evidence_timelines:write', 'Write Evidence Timelines', 'Create manual timeline entries', 'evidence_timelines')
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'CLIENT' AND p.name IN (
  'documents:read', 'documents:write', 'evidence:read', 'evidence:write',
  'evidence_timelines:read'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'LAWYER' AND p.name IN (
  'documents:read', 'documents:write', 'documents:delete', 'documents:review',
  'evidence:read', 'evidence:write', 'ocr:run', 'document_analysis:run',
  'evidence_timelines:read', 'evidence_timelines:write'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'PARALEGAL' AND p.name IN (
  'documents:read', 'documents:write', 'documents:review',
  'evidence:read', 'evidence:write', 'ocr:run', 'document_analysis:run',
  'evidence_timelines:read', 'evidence_timelines:write'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ADMIN' AND p.module IN (
  'documents', 'evidence', 'ocr', 'document_analysis', 'evidence_timelines'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;
