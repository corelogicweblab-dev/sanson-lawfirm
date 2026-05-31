# Operations Manual

## Daily monitoring

1. Open **Admin → Operations** dashboard
2. Confirm database `connected`, open alerts = 0 critical
3. Review API latency vs SLO (500ms avg target)
4. Check AI token usage trend

## Weekly tasks

- Review audit logs for anomalous access
- Confirm Supabase backup status
- Review deployment history after releases
- Run `npm run db:check` before any schema change

## Maintenance procedures

### Planned maintenance

1. Announce via firm channels
2. Enable **Maintenance Mode** (Control Center)
3. Deploy backend/frontend
4. Run migrations if needed
5. Verify `/health/ready`
6. Disable maintenance mode

### Emergency lockout

Use when security incident suspected. Blocks API except auth/health paths.

## Alerting

Auto-generated alerts (thresholds in `alert_thresholds` setting):

| Category | Trigger |
|----------|---------|
| API | Error rate > 5% |
| API | Avg latency > 2000ms |
| Database | Readiness check fails |
| AI | OpenAI not configured |

Resolve via **Operations** or `POST /ops/alerts/{id}/resolve`.

Optional: set `ALERT_WEBHOOK_URL` for Slack/Teams (integrate in Phase 9).

## Support workflow

| Tier | Scope | Response |
|------|-------|----------|
| L1 | Login, password, client portal | Paralegal / admin |
| L2 | Case workflow, documents | Lawyer + admin |
| L3 | API, DB, AI, search outages | CoreLogic / technical admin |

## Issue escalation

1. L1 documents issue + correlation ID from browser network tab
2. L2 checks case permissions and document status
3. L3 checks Render logs, Supabase status, `/ops/dashboard`
4. Critical: enable lockout, revoke sessions, open incident log

## Incident management

1. **Detect** — alerts, user reports, health check failure
2. **Contain** — maintenance or lockout if needed
3. **Diagnose** — Render logs, `X-Correlation-ID`, audit trail
4. **Recover** — rollback deploy or restore DB from PITR
5. **Review** — post-incident notes in deployment metadata

## Release management

1. Branch `feature/*` → PR to `development`
2. Merge to `staging`, QA checklist
3. PR to `main`, CI green
4. Apply migrations on staging first, then production
5. Render auto-deploy + Vercel/Firebase deploy
6. Record deployment via `/ops/deployments`
7. Run go-live verification (see `GO-LIVE-CHECKLIST.md`)

## Disaster recovery

See `PRODUCTION-DEPLOYMENT.md` and below.

### Recovery order

1. Restore Supabase from backup / PITR
2. Verify `DATABASE_URL` on Render
3. Redeploy API if needed
4. Redeploy frontend
5. Re-index Qdrant if document index corrupted
6. Full go-live checklist

### RTO / RPO targets (recommended)

| Metric | Target |
|--------|--------|
| RPO | 24h (Supabase daily) / 1h with PITR |
| RTO | 4h for full platform restore |

## Performance targets

| Metric | Target |
|--------|--------|
| API average | < 500ms |
| Dashboard load | < 2s |
| Search | < 2s |
| Document upload | Queued async processing |

Configured in `system_settings.performance_targets`.

## Post-launch operations

- Monthly security review (sessions, failed logins)
- Quarterly DR drill on staging
- Rotate secrets annually
- Monitor OpenAI cost via AI Operations dashboard
