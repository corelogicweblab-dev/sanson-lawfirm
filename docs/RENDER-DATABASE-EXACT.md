# Render DATABASE_URL — exact copy-paste (SANSON)

**Hindi Prisma ang production API.** Ang Render FastAPI service ay `DATABASE_URL` lang (hindi `DIRECT_URL`).

## Step 1 — Supabase password

Gamitin ang **current** database password mula Supabase (hal. `Matthew541994032193`).

Kung may `@` sa password, encode: `@` → `%40`.

## Step 2 — Render `DATABASE_URL` (Transaction pooler 6543)

Palitan ang `postgresql://` ng `postgresql+asyncpg://`:

```
postgresql+asyncpg://postgres.gutawiiafzycrleddezv:Matthew541994032193@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres
```

## Step 3 — Other Render env

```
DATABASE_SSL=true
ENVIRONMENT=production
```

## Step 4 — Mandatory

1. **Save** environment
2. **Manual Deploy** (restart — hindi enough ang Save lang)
3. Wait **Live**
4. Test: https://sanson-lawfirm.onrender.com/api/v1/health/ready  
   → `"database":"connected"`

## Kung `unavailable` pa — subukan Session pooler (5432)

```
postgresql+asyncpg://postgres.gutawiiafzycrleddezv:Matthew541994032193@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres
```

Save → Manual Deploy ulit.

## Prisma (local only)

```env
DIRECT_URL=postgresql://postgres.gutawiiafzycrleddezv:Matthew541994032193@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres
DATABASE_URL=postgresql://postgres.gutawiiafzycrleddezv:Matthew541994032193@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

## Login sync failed pero health = connected

Run Supabase SQL migrations `001` through `020` (see `scripts/migrations/`).
