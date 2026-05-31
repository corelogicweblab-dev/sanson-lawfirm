# SANSON Legal OS

AI-Powered Legal Operating System for **SANSON Law Firm**.

**Powered By: CoreLogic**

## Phase 1 — Enterprise Foundation

This phase establishes authentication, RBAC, user management, audit logging, design system, and dashboard framework.

## Architecture

```
/apps
  /web       → Next.js 15 (Firebase Hosting)
  /backend   → FastAPI (Render)
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
| Hosting | Firebase Hosting (web), Render (API) |

## Production URLs

- **Web (Firebase Hosting):** https://sansonlawfirm.web.app
- **API (Render):** https://sanson-lawfirm.onrender.com
- **API docs:** https://sanson-lawfirm.onrender.com/api/v1/docs
- **Firebase project:** `sansonlawfirm`

## Deploy web to Firebase Hosting

```bash
npm install
npm run deploy:hosting
```

## Documentation

- [Deployment (Firebase Hosting + Render)](docs/DEPLOYMENT.md)
- [Phase 1 Summary](docs/PHASE-1-SUMMARY.md)
- [Phase 2 Summary](docs/PHASE-2-SUMMARY.md)
- [Architecture](docs/architecture/SYSTEM-OVERVIEW.md)
- [Auth Flow](docs/architecture/AUTH-FLOW.md)
- [Security](docs/architecture/SECURITY.md)
