# SANSON Legal OS

AI-Powered Legal Operating System for **SANSON Law Firm**.

**Powered By: CoreLogic**

## Status — Production Ready (Phases 1–8)

Full AI-Powered Legal Operating System for SANSON Law Firm. See `docs/GO-LIVE-CHECKLIST.md` before launch.

| Phase | Focus |
|-------|--------|
| 1–2 | Auth, RBAC, legal workflow |
| 3–4 | AI intake, documents, R2 |
| 5 | Semantic search, knowledge |
| 6 | Mobile, push, realtime |
| 7 | Security, audit, sessions |
| 8 | CI/CD, ops, go-live |

**Deploy:** `docs/PRODUCTION-DEPLOYMENT.md` · **Ops:** `docs/OPERATIONS-MANUAL.md` · **Test logins:** `docs/TEST-ACCOUNTS.md`

## Architecture

```
/apps
  /web       → Next.js 15 (Vercel or Firebase Hosting)
  /backend   → FastAPI (Render)
  /mobile    → Expo (React Native)
/packages
  /ui        → ShadCN design system
  /shared    → Constants & helpers
  /types     → Shared TypeScript types
  /utils     → Utility functions
/docs        → Architecture & phase documentation
/scripts     → DB migrations & seeders
```

## Quick Start

### 1. Environment

```bash
cp .env.example .env
# Configure Firebase, Supabase, and API keys
```

### 2. Install Dependencies

```bash
npm install
cd apps/backend && python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

### 3. Database

Apply schema and seed data via Supabase SQL editor or:

```bash
npm run db:migrate
npm run db:seed
```

### 4. Run Development

```bash
# Terminal 1 — Backend
npm run dev:backend

# Terminal 2 — Web
npm run dev:web
```

- Web: http://localhost:3000
- API Docs: http://localhost:8100/api/v1/docs

## Tech Stack (Phase 1)

| Layer | Technology |
|-------|-----------|
| Web | Next.js 15, TypeScript, Tailwind CSS, ShadCN UI |
| Backend | FastAPI, Python 3.12 |
| Database | PostgreSQL (Supabase) |
| Auth | Firebase Authentication |
| Hosting | Vercel or Firebase (web), Render (API) |

## Production URLs

- **Web (Firebase Hosting):** https://sansonlawfirm.web.app
- **API (Render):** https://sanson-lawfirm.onrender.com
- **API docs:** https://sanson-lawfirm.onrender.com/api/v1/docs
- **Firebase project:** `sansonlawfirm`

## Phase 6 — Mobile App (Expo)

- App: `apps/mobile` — `npm run dev:mobile`
- Docs: [docs/PHASE-6-SUMMARY.md](docs/PHASE-6-SUMMARY.md)
- Run migrations `011` and `012` on Supabase

## Phase 5 — AI Knowledge Engine & Semantic Search

- Routes: `/dashboard/lawyer/search`, `/dashboard/lawyer/knowledge`, `/dashboard/admin/search-analytics`
- Docs: [docs/PHASE-5-SUMMARY.md](docs/PHASE-5-SUMMARY.md)
- Requires `QDRANT_URL`, `QDRANT_API_KEY`, and `OPENAI_API_KEY` for semantic search; keyword search works without Qdrant

## Phase 4 — Documents & Evidence

- Routes: `/dashboard/client/documents`, lawyer/paralegal document & evidence pages
- Docs: [docs/PHASE-4-SUMMARY.md](docs/PHASE-4-SUMMARY.md)
- Requires Cloudflare R2 + OpenAI for full pipeline

## Phase 3 — AI Legal Assistant

- Client route: `/dashboard/client/ai-assistant`
- Docs: [docs/PHASE-3-SUMMARY.md](docs/PHASE-3-SUMMARY.md)
- Requires `OPENAI_API_KEY` on the backend (Render)

## Deploy web to Firebase Hosting

```bash
npm install
npm run deploy:hosting
```

## Phase 8 — Production & Go-Live

- Ops dashboard: `/dashboard/admin/operations`
- Docs: [docs/PHASE-8-SUMMARY.md](docs/PHASE-8-SUMMARY.md)
- Run migrations `015` and `016` on Supabase
- CI/CD: `.github/workflows/`

## Documentation

- [Production Deployment](docs/PRODUCTION-DEPLOYMENT.md)
- [Go-Live Checklist](docs/GO-LIVE-CHECKLIST.md)
- [Operations Manual](docs/OPERATIONS-MANUAL.md)
- [System Architecture](docs/SYSTEM-ARCHITECTURE.md)
- [API Reference](docs/API-REFERENCE.md)
- [Database Reference](docs/DATABASE-REFERENCE.md)
- [Security Architecture](docs/SECURITY-ARCHITECTURE.md)
- [Deployment (legacy)](docs/DEPLOYMENT.md)
- [Phase 1 Summary](docs/PHASE-1-SUMMARY.md)
- [Phase 2 Summary](docs/PHASE-2-SUMMARY.md)
- [Architecture](docs/architecture/SYSTEM-OVERVIEW.md)
- [Auth Flow](docs/architecture/AUTH-FLOW.md)
- [Security](docs/architecture/SECURITY.md)
