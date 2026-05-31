# Firebase Login Setup — admin@sansonlaw.ph

**Error:** `Firebase: Error (auth/configuration-not-found)`  
**Meaning:** Email/Password sign-in is **not enabled** (or Authentication was never set up) in project `sansonlawfirm`.

---

## Step 1 — Enable Email/Password

1. Open [Firebase Console](https://console.firebase.google.com/) → project **sansonlawfirm**
2. **Build** → **Authentication**
3. If you see **Get started**, click it
4. Tab **Sign-in method**
5. Click **Email/Password** → turn **Enable** ON → **Save**

---

## Step 2 — Create admin user

1. **Authentication** → tab **Users**
2. **Add user**
   - Email: `admin@sansonlaw.ph`
   - Password: `Admin@123456` (or your chosen password)
3. **Add user**

> The app does **not** store passwords in Supabase. Login is **only** through Firebase Auth.

---

## Step 3 — Authorized domains

**Authentication** → **Settings** → **Authorized domains** — must include:

- `sansonlawfirm.web.app`
- `sansonlawfirm.firebaseapp.com`
- `localhost` (for local dev)

---

## Step 4 — Set ADMIN role in database (after first login)

First login creates the user in PostgreSQL as **CLIENT** by default.

In **Supabase SQL Editor**:

```sql
UPDATE users u
SET role_id = (SELECT id FROM roles WHERE name = 'ADMIN')
WHERE u.email = 'admin@sansonlaw.ph';
```

Or use API `PATCH /api/v1/users/{id}/role` once another admin exists.

---

## Error: `Failed to fetch` — database offline (common)

Check: https://sanson-lawfirm.onrender.com/api/v1/health/ready

If `"database":"unavailable"` → **Render cannot connect to Supabase.**

**Fix `DATABASE_URL` on Render:**

1. Supabase → **Project Settings** → **Database** → **Connection string**
2. Use **Transaction pooler** (port **6543**) or **Session pooler**
3. Format for this API:

```
postgresql+asyncpg://postgres.PROJECT_REF:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
```

4. Set `DATABASE_SSL=true` on Render
5. **Save** → Manual Deploy / restart service
6. Re-test `/api/v1/health/ready` until `"database":"connected"`

Then run migrations `001`–`010` in Supabase SQL Editor if not done yet.

---

## Error: `Failed to fetch` after Sign In (wrong API URL)

Firebase login succeeded, but the app could not call the **Render API** (`/auth/sync`).

**Common cause:** Web was built **without** `NEXT_PUBLIC_API_URL`, so the browser tried `http://localhost:8100` from `sansonlawfirm.web.app` (blocked / unreachable).

**Fix:**

1. Create `apps/web/.env.local` (see `apps/web/.env.production.example`)
2. Set `NEXT_PUBLIC_API_URL=https://sanson-lawfirm.onrender.com`
3. Redeploy: `npm run deploy:hosting`

**Also check Render:**

- Service is **Live** (open https://sanson-lawfirm.onrender.com/api/v1/health/)
- `CORS_ORIGINS` includes `https://sansonlawfirm.web.app,https://sansonlawfirm.firebaseapp.com`
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` are set

---

## Step 5 — Redeploy web (if env changed)

If you updated `NEXT_PUBLIC_FIREBASE_*`, rebuild and deploy:

```bash
# apps/web/.env.local must match Firebase project sansonlawfirm
npm run deploy:hosting
```

---

## Step 6 — Render API (after login works in browser)

Without Firebase Admin on Render, login succeeds but API calls fail.

| Variable | Value |
|----------|--------|
| `FIREBASE_PROJECT_ID` | `sansonlawfirm` |
| `FIREBASE_CLIENT_EMAIL` | From service account JSON |
| `FIREBASE_PRIVATE_KEY` | From service account JSON |
| `CORS_ORIGINS` | `https://sansonlawfirm.web.app,https://sansonlawfirm.firebaseapp.com,http://localhost:3000` |

Service account: Firebase → Project settings → **Service accounts** → **Generate new private key**.

---

## Quick checklist

| Check | Where |
|-------|--------|
| Email/Password **enabled** | Authentication → Sign-in method |
| User `admin@sansonlaw.ph` **exists** | Authentication → Users |
| Domain `sansonlawfirm.web.app` **listed** | Authentication → Authorized domains |
| Role **ADMIN** in DB | Supabase `users` table |
| `CORS_ORIGINS` includes Hosting URL | Render environment |

---

## Optional — Google sign-in

**Sign-in method** → **Google** → Enable, set support email, save.
