# Deploy SANSON Legal OS to Netlify (from GitHub)

The **web app** deploys on Netlify. The **API** stays on [Render](https://sanson-lawfirm.onrender.com).  
Netlify **proxies** `/api/*` to Render so the browser never hits `onrender.com` directly (fixes NetworkError).

## 1. Connect GitHub to Netlify

1. Open [Netlify](https://app.netlify.com/) → **Add new site** → **Import an existing project**.
2. Choose **GitHub** → authorize → select repo: `corelogicweblab-dev/sanson-lawfirm` (or your fork).
3. Branch: **`main`**
4. Netlify reads **`netlify.toml`** at the repo root automatically:
   - **Build command:** `npm ci && npm run build:web`
   - **Publish directory:** `apps/web/out`
   - **Node:** 20

5. Click **Deploy site** (first build ~3–5 minutes).

### If build fails: "Exposed secrets detected"

Firebase `NEXT_PUBLIC_*` values are **meant to be in the browser bundle**. Netlify may flag them by mistake.

`netlify.toml` already sets `SECRETS_SCAN_OMIT_KEYS` for Firebase. If it still fails, add the same variable in **Site settings → Environment variables**:

```text
SECRETS_SCAN_OMIT_KEYS=NEXT_PUBLIC_FIREBASE_API_KEY,NEXT_PUBLIC_FIREBASE_APP_ID,NEXT_PUBLIC_FIREBASE_PROJECT_ID,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
```

Then **Clear cache and deploy** again.

## 2. Required environment variables (Netlify UI)

**Site settings → Environment variables → Production** (and Deploy previews if needed):

| Variable | Example / notes |
|----------|-----------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | From Firebase Console |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | From Firebase (e.g. `your-project.firebaseapp.com`) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | From Firebase project settings |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | From Firebase |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | From Firebase |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | From Firebase |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Optional |

**Do not** set `NEXT_PUBLIC_API_URL` to `onrender.com` on Netlify — leave empty so the app uses same-origin `/api` (proxied in `netlify.toml`).

Copy values from `apps/web/.env.local` or Firebase project settings.

## 3. Firebase authorized domains

Firebase Console → **Authentication** → **Settings** → **Authorized domains** → add:

- `your-site-name.netlify.app`
- Custom domain (if you add one in Netlify)

## 4. Render CORS (optional)

If you test the API directly on Render, add your Netlify URL to Render env `CORS_ORIGINS`:

```text
https://your-site.netlify.app,https://sansonlawfirm.web.app,...
```

Proxied traffic from Netlify does **not** need CORS for normal app use.

## 5. Auto-deploy from GitHub

Every **push to `main`** triggers a new Netlify build when **Build hooks / Continuous deployment** is enabled (default after import).

## 6. Custom domain (optional)

Netlify → **Domain management** → add domain → update DNS per Netlify instructions → add domain to Firebase authorized domains.

## 7. Verify after deploy

1. Open `https://<your-netlify-subdomain>.netlify.app/login/`
2. Sign in as lawyer or paralegal
3. Open browser DevTools → Network → dashboard load should call **`/api/v1/...`** on the **same host** (not `onrender.com`)
4. Health via proxy: `https://<site>.netlify.app/api/v1/health/`

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails on `npm ci` | Check Node 20 in Netlify; retry deploy |
| Login works but dashboard NetworkError | Clear cache; confirm `NEXT_PUBLIC_API_URL` is empty on Netlify |
| Firebase auth error | Add Netlify URL to Firebase authorized domains |
| API 502 on `/api/*` | Render API sleeping — wait 30s and refresh; keep-alive workflow on GitHub helps |

## Primary URLs

| Service | URL |
|---------|-----|
| API (direct) | https://sanson-lawfirm.onrender.com |
| Web (Netlify) | Your `*.netlify.app` or custom domain |
| Web (Firebase redirect) | https://sansonlawfirm.web.app → redirects to Render unified app |
