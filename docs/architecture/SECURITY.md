# Security Architecture â€” Phase 1

## Authentication

- **Provider:** Firebase Authentication
- **Token type:** Firebase ID Token (JWT)
- **Verification:** Firebase Admin SDK on backend
- **No custom password storage** in PostgreSQL

## Authorization (RBAC)

```
User â†’ Role â†’ RolePermissions â†’ Permissions
```

- Route-level guards: `require_permission("users:read")`
- Role guards: `require_role("ADMIN")`
- Admin role receives wildcard `*` permission

## Audit Trail

All security-relevant events logged to `audit_logs`:

| Action | Trigger |
|--------|---------|
| `user.login` | Successful sync (returning user) |
| `user.register` | First-time sync |
| `user.logout` | Logout endpoint |
| `profile.update` | Profile PATCH |
| `role.change` | Role PATCH |
| `user.activate` / `user.deactivate` | Status PATCH |

Fields: `action`, `entity_type`, `entity_id`, `performed_by`, `ip_address`, `user_agent`, `old_values`, `new_values`

## HTTP Security

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security` on HTTPS

## Rate Limiting

- slowapi default: 60 requests/minute per IP
- Configurable via `RATE_LIMIT_PER_MINUTE`

## Input Validation

- Pydantic schemas on all request bodies
- Email format validation
- Role enum pattern validation

## Data Protection

- Soft deletes (`deleted_at`) preserve audit integrity
- No payment or sensitive legal data in Phase 1

Powered By: **CoreLogic**

