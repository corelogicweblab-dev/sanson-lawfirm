# Render — Ayusin Lahat (Checklist)

## Root cause ng screenshot mo

| Problema | Solusyon |
|----------|----------|
| **"Unable to access GitHub repository"** | Mali o walang access ang repo — tingnan Step 1 |
| Repo sa Render: `sansonlawfirm` | **Mali** — dapat **`sanson-lawfirm`** (may gitling) |
| Runtime: **Node** | **Mali** — dapat **Python 3** |
| Deploy commit `20cdd2e` (luma) | I-deploy ang latest sa `main` pag na-fix ang GitHub |
| `npm run start:prod` | **Wala** sa project — huwag gamitin |

**Tamang GitHub repo:**  
https://github.com/corelogicweblab-dev/sanson-lawfirm

---

## Step 1 — GitHub access (Render)

1. Buksan: https://github.com/settings/installations  
2. **Render** → **Configure**  
3. Piliin ang organization **`corelogicweblab-dev`**  
4. Payagan ang repository **`sanson-lawfirm`** (may gitling `-`)  
5. Sa Render → **Account Settings** → **Git Providers** → **Reconnect GitHub**  
6. Sa service **sanson-lawfirm** → **Settings** → **Build & Deploy**:
   - **Repository:** `corelogicweblab-dev / sanson-lawfirm`  
   - **Branch:** `main`  
   - Huwag `sansonlawfirm` (walang gitling)

Kung private ang repo: kailangan ng Render na may access sa org, o gawing public ang repo pansamantala.

---

## Step 2 — Build settings (Python, walang Docker)

**Settings → Build & Deploy**

| Field | Ilagay |
|-------|--------|
| **Runtime** | **Python 3** |
| **Root Directory** | `apps/backend` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

**Kung Node pa rin ang runtime** (OK na gamitin ang default):
- Build: `npm install; npm run build` → auto pip install sa Render
- Start: `npm run start:prod` → uvicorn API

**Mas mainam (Python):** Root Directory `apps/backend`, huwag npm.

**Tanggalin** kung naka-Python ka na: duplicate/wrong start commands.

**Health Check Path:** `/api/v1/health/`

---

## Step 3 — Environment variables

**Reload** ang Environment page bago mag-edit. **I-edit** ang existing keys — huwag mag-duplicate.

| Key | Notes |
|-----|--------|
| `DATABASE_URL` | Buong URI mula Supabase — **encode `@` sa password bilang `%40`** (tingnan ibaba) |
| `DATABASE_SSL` | `true` |
| `FIREBASE_PROJECT_ID` | `sansonlawfirm` |
| `FIREBASE_CLIENT_EMAIL` | mula service account JSON |
| `FIREBASE_PRIVATE_KEY` | isang line, `\n` sa gitna |
| `CORS_ORIGINS` | `https://sansonlawfirm.web.app,https://sansonlawfirm.firebaseapp.com,http://localhost:3000` |
| `OPENAI_API_KEY` | `sk-...` |
| `OPENAI_MODEL` | `gpt-4o-mini` |

### Mali sa screenshot (tuldok imbes colon) — **pinaka-karaniwang error**

**MALI** (nakita sa Render — password nasa username):

```
postgresql+asyncpg://postgres.yutawilaizycileduezv.matthew%40341554%40%40@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres
                                      ↑ TULDOK — mali
```

**TAMA** (colon `:` pagkatapos ng project ref, bago ang password):

```
postgresql+asyncpg://postgres.yutawilaizycileduezv:matthew%40341554%40%40@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres
                                      ↑ COLON — tama
```

I-copy ang buong string mula **Supabase → Project Settings → Database → Connection string → URI → Transaction pooler**, tapos palitan ang `postgresql://` ng `postgresql+asyncpg://` kung wala pa.

### Password may `@` (karaniwang sanhi ng `database: unavailable`)

Kung ang password ay hal. `Matthew@541994@@`, **huwag** ilagay ang raw `@` sa URL — babasahin ng parser na host na ang `541994@@db...`.

| Character sa password | Ilagay sa URL |
|----------------------|---------------|
| `@` | `%40` |

Halimbawa:

```
postgresql+asyncpg://postgres:Matthew%40541994%40%40@db.gutawiiafzycrleddezv.supabase.co:6543/postgres
```

(`Matthew@541994@@` → `Matthew%40541994%40%40`)

**Pinakamabuti:** Supabase → **Database** → **Connection string** → **URI** → **Transaction pooler** → **Copy** (auto-encoded na).

**Halimbawa DATABASE_URL (Supabase pooler):**
```
postgresql+asyncpg://postgres.PROJECT_REF:ENCODED_PASSWORD@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
```

Pagkatapos i-save, test: `/api/v1/health/ready` → `"database":"connected"` at walang `database_url_issues`.

---

## Step 4 — Deploy

1. **Save** settings  
2. **Manual Deploy** → **Deploy latest commit**  
3. Hintayin ang green **Live**  
4. Test:
   - https://sanson-lawfirm.onrender.com/api/v1/health/ → 200  
   - https://sanson-lawfirm.onrender.com/api/v1/health/ready → `database: connected`

---

## Step 5 — Web (hiwalay sa Render)

Ang website ay **Firebase Hosting**, hindi Render:

```bash
npm run deploy:hosting
```

Sa `apps/web/.env.local`:
```
NEXT_PUBLIC_API_URL=https://sanson-lawfirm.onrender.com
```

---

## Kung may error pa sa Logs

| Log message | Fix |
|-------------|-----|
| `ModuleNotFoundError` | Root Directory = `apps/backend` |
| `No module named 'app'` | Start command mula sa `apps/backend` context |
| Database / SSL error | Ayusin `DATABASE_URL` + `DATABASE_SSL=true` |
| Firebase auth error | Ayusin `FIREBASE_PRIVATE_KEY` format |
| Port binding | Start command dapat may `$PORT` |
