# API Reference

Base URL: `https://sanson-lawfirm.onrender.com/api/v1`

Interactive docs: `/api/v1/docs`

## Authentication

All protected routes require:

```
Authorization: Bearer <firebase-id-token>
```

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/sync` | Sync Firebase user to DB |
| GET | `/auth/me` | Current user profile |
| POST | `/auth/logout` | Logout + audit |

## Health & ops

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health/` | No | Liveness |
| GET | `/health/live` | No | Alive probe |
| GET | `/health/ready` | No | DB + env readiness |
| GET | `/ops/environment` | No | Safe env summary |
| GET | `/ops/dashboard` | `ops:read` | Operations dashboard |
| GET | `/ops/deployments` | `ops:read` | Deployment history |
| POST | `/ops/deployments` | `ops:write` | Record deployment |
| GET | `/ops/migrations` | `ops:read` | Migration status |
| GET | `/ops/alerts` | `ops:read` | System alerts |
| POST | `/ops/alerts/{id}/resolve` | `ops:write` | Resolve alert |

## System (Phase 7)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/system/health` | Health metrics |
| GET | `/system/settings` | Admin settings |
| PATCH | `/system/settings/{key}` | Update setting |

## Core domains

| Prefix | Domain |
|--------|--------|
| `/users` | User management |
| `/legal-requests` | Client intake requests |
| `/cases` | Case management |
| `/documents` | Document CRUD + processing |
| `/evidence` | Evidence items |
| `/search` | Semantic search |
| `/knowledge` | Knowledge base |
| `/chat` | AI client chat |
| `/mobile` | Mobile bootstrap |
| `/notifications` | Push notifications |
| `/audit` | Audit logs + `/audit/ai` |
| `/security` | Security events, lockout |
| `/sessions` | Session management |

## Response format

```json
{
  "success": true,
  "message": "Human-readable message",
  "data": { },
  "meta": { "page": 1, "total": 100 }
}
```

## Rate limits

Default: `RATE_LIMIT_PER_MINUTE` (SlowAPI). Per-route overrides in `api_rate_limits` table.

## Correlation

Responses include `X-Correlation-ID` for log tracing.
