-- =============================================================================
-- SANSON Legal OS — Phase 7 Seed
-- =============================================================================

INSERT INTO permissions (name, display_name, description, module) VALUES
  ('security:read', 'Security Read', 'View security events and policies', 'security'),
  ('security:write', 'Security Write', 'Manage security settings and lockouts', 'security'),
  ('system:read', 'System Read', 'View system health and settings', 'system'),
  ('system:write', 'System Write', 'Manage system settings and maintenance', 'system'),
  ('sessions:read', 'Sessions Read', 'View active user sessions', 'sessions'),
  ('sessions:write', 'Sessions Write', 'Revoke user sessions', 'sessions'),
  ('ai_audit:read', 'AI Audit Read', 'View AI usage audit logs', 'ai_audit')
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ADMIN' AND p.name IN (
  'security:read', 'security:write', 'system:read', 'system:write',
  'sessions:read', 'sessions:write', 'ai_audit:read'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO api_rate_limits (route_pattern, requests_per_minute, burst_limit) VALUES
  ('/api/v1/auth/*', 30, 5),
  ('/api/v1/ai/*', 20, 3),
  ('/api/v1/search/*', 40, 8),
  ('/api/v1/documents/upload', 15, 3),
  ('/api/v1/*', 120, 20)
ON CONFLICT (route_pattern) DO NOTHING;

INSERT INTO system_settings (key, value, description, is_public) VALUES
  ('maintenance_mode', '{"enabled": false, "message": "Scheduled maintenance"}', 'Platform maintenance mode', true),
  ('ai_usage_limits', '{"daily_tokens_per_user": 100000, "enabled": true}', 'AI token limits per user per day', false),
  ('feature_flags', '{"semantic_search": true, "mobile_app": true, "ai_assistant": true}', 'Global feature toggles', false),
  ('security_policy', '{"max_concurrent_sessions": 5, "mfa_required": false, "session_timeout_hours": 24}', 'Identity security policy', false),
  ('data_retention_days', '{"audit_logs": 365, "soft_deleted": 90}', 'Data retention policy', false),
  ('emergency_lockout', '{"enabled": false, "reason": null}', 'Emergency platform lockout', false)
ON CONFLICT (key) DO NOTHING;
