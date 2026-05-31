# Go-Live Checklist

**SANSON Law Firm Legal OS · Production launch**

Mark each item before directing real client traffic.

---

## Security verification

- [ ] `ENVIRONMENT=production` on Render
- [ ] `FIELD_ENCRYPTION_KEY` set (32+ byte secret)
- [ ] Firebase Email/Password enabled; test users removed
- [ ] CORS includes production frontend URLs only (+ admin local if needed)
- [ ] Emergency lockout tested (enable/disable)
- [ ] Session revoke tested
- [ ] RBAC: non-admin cannot access `/ops/*` or admin routes

## API verification

- [ ] `GET /api/v1/health/` → 200
- [ ] `GET /api/v1/health/ready` → `database: connected`
- [ ] `GET /api/v1/ops/environment` → `valid: true`
- [ ] Rate limiting active (429 on burst test)
- [ ] Correlation ID present in responses

## Database verification

- [ ] Migrations 001–016 applied (`GET /ops/migrations`)
- [ ] Supabase backups enabled
- [ ] Connection pooler URI with encoded password
- [ ] Seed permissions include `ops:read`, `ops:write`

## Storage verification

- [ ] R2 bucket created, CORS configured
- [ ] Upload test document end-to-end
- [ ] Signed URL download works for lawyer role

## Authentication verification

- [ ] Client login → sync → dashboard
- [ ] Lawyer login → case list
- [ ] Admin login → Operations dashboard
- [ ] Logout blacklists session token
- [ ] Wrong password shows clear error (not "Failed to fetch")

## AI verification

- [ ] Client chat returns AI response (or graceful fallback)
- [ ] `ai_audit_logs` records interaction
- [ ] OpenAI key valid; circuit breaker recovers after failure
- [ ] Legal disclaimer visible in chat UI

## Search verification

- [ ] Semantic search returns results
- [ ] Qdrant collection populated (or hybrid fallback)
- [ ] Knowledge articles load

## Notification verification

- [ ] In-app notifications create/read
- [ ] Mobile push token registers (if mobile launched)
- [ ] FCM credentials on Render

## Mobile verification (if launching)

- [ ] Expo app connects to production API URL
- [ ] Role-based tabs correct per user
- [ ] Offline queue does not block login

## Frontend verification

- [ ] Mobile layout tested (sidebar, tables scroll, AI chat, search modal)
- [ ] Production build succeeds (`npm run build:web`)
- [ ] `NEXT_PUBLIC_API_URL` points to Render
- [ ] All admin Phase 8 pages load (Operations, Deployment, AI Ops)
- [ ] No console errors on login flow

## DevOps verification

- [ ] GitHub `main` protected branch rules
- [ ] CI workflow passes on latest commit
- [ ] Render auto-deploy from `main` enabled
- [ ] Vercel or Firebase production deploy complete
- [ ] Deployment recorded in `/ops/deployments`

## Legal & compliance

- [ ] AI disclaimer on client-facing chat
- [ ] Privacy notice accessible to clients
- [ ] Audit logging confirmed for case/document access
- [ ] Data retention policy documented for firm

## Sign-off

| Role | Name | Date |
|------|------|------|
| Firm Admin | | |
| Technical Lead | | |
| CoreLogic | | |

**Go-live approved:** ☐ Yes ☐ No

---

After go-live: monitor Operations dashboard for 48 hours. See `OPERATIONS-MANUAL.md`.
