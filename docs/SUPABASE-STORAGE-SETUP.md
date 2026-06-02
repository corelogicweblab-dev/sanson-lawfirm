# Supabase Storage — case document uploads

Case files are stored in **Supabase Storage** (same project as your database), not inside Postgres rows.

## One-time setup (5 minutes)

### 1. Create bucket

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project  
2. **Storage** → **New bucket**  
3. Name: `documents`  
4. **Private** bucket (recommended)  
5. Create

### 2. Render environment variables

In **Render** → `sanson-lawfirm` → **Environment**:

| Variable | Value |
|----------|--------|
| `SUPABASE_URL` | `https://YOUR_PROJECT.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase → Settings → API → `service_role` (secret) |
| `SUPABASE_STORAGE_BUCKET` | `documents` |

You should already have `DATABASE_URL` pointing at the same Supabase project.

### 3. Redeploy

- **Render** → Manual Deploy  
- **Netlify** → Clear cache and deploy (after latest `main` build)

### 4. Test

1. Sign in as **PARALEGAL**  
2. Open a case → upload a small PDF (&lt; 6 MB)  
3. File should appear in the list; in Supabase Storage → `documents` you should see the object path.

## How it works

| Step | What happens |
|------|----------------|
| Upload | File → Supabase Storage; metadata → Postgres `documents` table |
| Download | Signed URL from Supabase (temporary link) |

No Cloudflare R2 required when Supabase Storage is configured.
