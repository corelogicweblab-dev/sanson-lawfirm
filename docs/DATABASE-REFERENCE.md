# Database Reference

**Engine:** PostgreSQL 15+ (Supabase)

## Migration system

| Item | Location |
|------|----------|
| SQL files | `scripts/migrations/001` – `016` |
| Manifest | `scripts/migration-manifest.json` |
| Version tracking | `migration_runs` table (Phase 8) |
| Check CLI | `npm run db:check` |

### Apply order

Run files in numeric order. Never skip versions in production.

### Rollback strategy

- **No automatic rollback** in production
- Each phase has forward-only migrations
- Rollback = restore Supabase PITR backup + document incident
- Failed migration: mark `migration_runs.status = failed`, fix SQL, re-apply

### Seed strategy

- `*_seed.sql` files: idempotent `ON CONFLICT DO NOTHING`
- Roles, permissions, system settings, demo data per phase

## Phase 8 tables

| Table | Purpose |
|-------|---------|
| `migration_runs` | Applied migration versions |
| `deployment_logs` | CI/CD deployment history |
| `system_alerts` | Operational alerts |

## Core entity groups

| Group | Tables |
|-------|--------|
| Identity | `users`, `roles`, `permissions`, `role_permissions`, `user_profiles` |
| Workflow | `legal_requests`, `cases`, `tasks`, `appointments`, … |
| Documents | `documents`, `document_versions`, `evidence_items`, … |
| AI | `chat_sessions`, `chat_messages`, `ai_audit_logs` |
| Search | `search_history`, `knowledge_articles`, … |
| Mobile | `mobile_devices`, `push_tokens`, `notifications` |
| Security | `audit_logs`, `security_events`, `session_devices`, `token_blacklist` |
| Ops | `request_metrics`, `system_settings`, `backup_logs` |

## Indexes & performance

Phase 7–8 migrations add indexes on:

- `deployment_logs(environment, deployed_at)`
- `system_alerts(resolved, severity, created_at)`
- Prior phases: case status, document case_id, search history user_id

## Backup validation

1. Enable Supabase daily backups / PITR
2. Record via `POST /api/v1/system/backups/record`
3. Quarterly restore test to staging project

## Connection

Use **Transaction pooler** port `6543` on Render with `DATABASE_SSL=true`.

Password special characters must be URL-encoded (`@` → `%40`).
