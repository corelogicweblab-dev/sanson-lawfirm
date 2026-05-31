# Deployment — SANSON Legal OS

**Powered By: CoreLogic**

## Architecture

| Layer | Platform | URL |
|-------|----------|-----|
| Web (Next.js static) | **Firebase Hosting** | `https://sansonlawfirm.web.app` (default) |
| API (FastAPI) | **Render** | https://sanson-lawfirm.onrender.com |
| Auth | **Firebase Authentication** | Project `sansonlawfirm` |
| Database | **Supabase PostgreSQL** | — |

---

## Firebase Hosting (Web)

The web app is built as a **static export** (`output: "export"`) and deployed to Firebase Hosting.

### Default URLs

- https://sansonlawfirm.web.app
- https://sansonlawfirm.firebaseapp.com

### Build-time environment (`apps/web/.env.local` or CI secrets)

`NEXT_PUBLIC_*` variables are embedded at **build time**. Set these before `npm run build:web`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBjKnYYKg5eOh-419mZWGZQjU2eDjVGGmk
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=sansonlawfirm.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=sansonlawfirm
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=sansonlawfirm.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=76558169320
NEXT_PUBLIC_FIREBASE_APP_ID=1:76558169320:web:259dcf615a900b64c8855d
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-33Z7BDTPDY
NEXT_PUBLIC_API_URL=https://sanson-lawfirm.onrender.com
```

### Deploy from repo root

```bash
npm install
npm run deploy:hosting
```

Or step by step:

```bash
npm run build:web
firebase login
firebase deploy --only hosting
```

Project is pinned in `.firebaserc` → `sansonlawfirm`.

### Firebase Console — Auth authorized domains

**Authentication** → Settings → **Authorized domains** should include:

- `localhost`
- `sansonlawfirm.web.app`
- `sansonlawfirm.firebaseapp.com`
- Any custom domain you connect in Hosting

### Optional: custom domain

Firebase Console → **Hosting** → **Add custom domain** (e.g. `app.sansonlaw.ph`).

---

## Render (Backend API)

**URL:** https://sanson-lawfirm.onrender.com  
**Health:** https://sanson-lawfirm.onrender.com/api/v1/health/  
**Docs:** https://sanson-lawfirm.onrender.com/api/v1/docs

### Required Render environment variables

| Variable | Example / notes |
|----------|-----------------|
| `DATABASE_URL` | Supabase `postgresql+asyncpg://...` |
| `DATABASE_SSL` | `true` |
| `FIREBASE_PROJECT_ID` | `sansonlawfirm` |
| `FIREBASE_CLIENT_EMAIL` | Service account email |
| `FIREBASE_PRIVATE_KEY` | Service account key (`\n` for newlines) |
| `CORS_ORIGINS` | See below |

### CORS for Firebase Hosting

Set `CORS_ORIGINS` on Render to include your Hosting URLs:

```
https://sansonlawfirm.web.app,https://sansonlawfirm.firebaseapp.com,http://localhost:3000
```

Add your custom domain when configured.

### Firebase Admin SDK (backend token verification)

1. Firebase Console → Project settings → **Service accounts**
2. **Generate new private key** (JSON)
3. Map to Render:
   - `FIREBASE_PROJECT_ID` = `project_id`
   - `FIREBASE_CLIENT_EMAIL` = `client_email`
   - `FIREBASE_PRIVATE_KEY` = `private_key`

Without these, login works in the browser but API calls will fail token verification.

---

## Local development

```bash
npm install
npm run dev:web              # http://localhost:3000

# Optional: local API instead of Render
# In apps/web/.env.local set NEXT_PUBLIC_API_URL=http://localhost:8100
npm run dev:backend          # http://localhost:8100
```

---

## Database migrations (Supabase SQL Editor)

1. `scripts/migrations/001_phase1_schema.sql`
2. `scripts/migrations/002_phase1_seed.sql`
3. `scripts/migrations/003_phase2_schema.sql`
4. `scripts/migrations/004_phase2_seed.sql`
