# Security Architecture

## Layers

```
┌─────────────────────────────────────────┐
│  CDN / Vercel / Firebase Hosting        │
├─────────────────────────────────────────┤
│  CORS + Security Headers + Rate Limits  │
├─────────────────────────────────────────┤
│  Firebase Auth + Session + Blacklist    │
├─────────────────────────────────────────┤
│  RBAC (permissions per route)           │
├─────────────────────────────────────────┤
│  Audit + Security Events + AI Audit     │
├─────────────────────────────────────────┤
│  Field encryption + R2 signed URLs      │
├─────────────────────────────────────────┤
│  Supabase PostgreSQL (SSL, RLS-ready)   │
└─────────────────────────────────────────┘
```

## Identity

- Firebase ID tokens verified server-side
- Sessions tracked in `session_devices`
- Concurrent session limits from `security_policy`
- Token blacklist on logout/revoke
- MFA-ready flag (`mfa_required`) — enrollment UI Phase 9+

## RBAC

Permissions enforced via `require_permission()`. Admin has Phase 7–8 ops permissions including `ops:read`, `ops:write`.

Case-level and document-level access enforced in service layer (lawyer assignment, client ownership).

## Data protection

| Control | Implementation |
|---------|----------------|
| Transit | HTTPS everywhere |
| At rest | Supabase encryption + optional `FIELD_ENCRYPTION_KEY` |
| Files | Private R2, signed URLs, TTL |
| Secrets | Render/Vercel env only |
| PII in logs | Structured logs avoid raw document content |

## API security

- SlowAPI rate limiting
- `api_rate_limits` per route pattern
- Maintenance mode + emergency lockout
- Payload validation (Pydantic)
- AI prompt injection filtering

## Compliance readiness

- Full audit trail (`audit_logs`, `ai_audit_logs`)
- Access logging on auth and case/document access
- Data retention settings (`data_retention_days`)
- Soft delete on core entities
- Export/right-to-access: API-ready, UX planned

## Incident response

1. Enable emergency lockout (Control Center)
2. Revoke sessions (Sessions admin)
3. Review security events + audit logs
4. Rotate Firebase/R2/DB credentials if breach suspected

See `docs/OPERATIONS-MANUAL.md` for escalation.
