# Production Deployment Guide

**SANSON Legal OS · Powered By CoreLogic**

## Architecture

| Component | Platform | URL |
|-----------|----------|-----|
| Web (Next.js static) | **Vercel** (primary) or Firebase Hosting | `https://*.vercel.app` or `https://sansonlawfirm.web.app` |
| API (FastAPI) | **Render** | `https://sanson-lawfirm.onrender.com` |
| Database | **Supabase PostgreSQL** | Connection pooler `:6543` |
| Storage | **Cloudflare R2** | Private bucket + signed URLs |
| Auth | **Firebase Authentication** | Email/password |
| AI | **OpenAI** | `gpt-4o-mini` |
| Vector search | **Qdrant Cloud** | Semantic search |
| Push (mobile) | **FCM** | Via Firebase Admin |

## Environments

| Env | Branch | Backend | Frontend |
|-----|--------|---------|----------|
| Development | `development` | Local `:8100` | `localhost:3000` |
| Staging | `staging` | Render staging service | Vercel preview |
| Production | `main` | Render `sanson-lawfirm` | Vercel prod / Firebase |

Copy templates:

```bash
cp .env.development.example .env      # local
# Set Render/Vercel secrets from .env.production.example
```

Validate:

```bash
npm run validate:env
npm run validate:env:prod
```

## Backend (Render)

1. Connect GitHub repo → Render Web Service
2. Root: `apps/backend`, build: `pip install -r requirements.txt`
3. Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Health check: `/api/v1/health/ready`
5. Set `ENVIRONMENT=production`, `DATABASE_SSL=true`, encoded `DATABASE_URL`
6. Add all keys from `.env.production.example`

## Frontend (Vercel)

1. Import repo in Vercel, root directory: `apps/web`
2. Build uses monorepo `vercel.json` (`cd ../.. && npm run build:web`)
3. Set all `NEXT_PUBLIC_*` variables
4. Set `NEXT_PUBLIC_API_URL` to Render API URL
5. Add Vercel domain to Render `CORS_ORIGINS`

### Firebase Hosting (alternate)

```bash
npm run deploy:hosting
```

## Database migrations

1. Run `npm run db:check` locally
2. Apply `scripts/migrations/*.sql` in order via Supabase SQL Editor
3. Verify: `GET /api/v1/ops/migrations` (admin token)

## CI/CD (GitHub Actions)

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | PR | Lint, typecheck, manifest |
| `deploy-backend.yml` | push `main`/`staging` | Env checklist + Render note |
| `deploy-frontend.yml` | push `main`/`staging` | Build artifact, optional Vercel/Firebase |
| `database-migrate.yml` | manual | Migration gate |

## Post-deploy verification

```bash
curl https://sanson-lawfirm.onrender.com/api/v1/health/ready
curl https://sanson-lawfirm.onrender.com/api/v1/ops/environment
```

Record deployment (admin API):

```http
POST /api/v1/ops/deployments
Authorization: Bearer <admin-token>
{"service":"render-api","git_ref":"<sha>","environment":"production"}
```

## Secret management

- **Never** commit `.env` files
- Store secrets in Render / Vercel / GitHub Secrets only
- Rotate `FIELD_ENCRYPTION_KEY` and DB password on schedule
- Use Supabase connection pooler URI with URL-encoded password
