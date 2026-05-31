# Supabase — apply all migrations (fix login sync)

## IMPORTANT — huwag i-paste ang file na ito sa SQL Editor

Ang file na ito ay **Markdown** (`.md`), hindi SQL. Ang `#` sa simula ay nagdudulot ng error:

`syntax error at or near "#"`

**Sa SQL Editor, i-paste lang ang mga `.sql` file** mula sa folder `scripts/migrations/`.

---

## Fresh start (burahin lahat muna)

Kung gusto mong **zero** mula sa simula:

1. I-paste at **Run** ang **`000_drop_all_schema.sql`** (burahin lahat ng tables/enums sa `public`)
2. Pagkatapos, sunod-sunod ang **001 → 020** gaya sa ibaba

---

## Paano (tamang paraan)

1. Buksan ang folder sa computer: `scripts/migrations/`
2. Sa Supabase → **SQL Editor** → **New query**
3. Buksan ang **`001_phase1_schema.sql`** sa text editor → **Select All** → **Copy**
4. **Paste** sa Supabase SQL Editor → click **Run**
5. Ulitin para sa bawat file **sunod-sunod** (huwag laktawan)

Maaari mong buksan muna ang checklist: `scripts/migrations/000_RUN_ORDER.sql` (SQL comments lang — safe i-run).

---

## Order (20 files)

| # | File — buksan at i-paste ang buong laman |
|---|----------------------------------------|
| 1 | `001_phase1_schema.sql` |
| 2 | `002_phase1_seed.sql` |
| 3 | `003_phase2_schema.sql` |
| 4 | `004_phase2_seed.sql` |
| 5 | `005_phase3_schema.sql` |
| 6 | `006_phase3_seed.sql` |
| 7 | `007_phase4_schema.sql` |
| 8 | `008_phase4_seed.sql` |
| 9 | `009_phase5_schema.sql` |
| 10 | `010_phase5_seed.sql` |
| 11 | `011_phase6_schema.sql` |
| 12 | `012_phase6_seed.sql` |
| 13 | **`013_phase7_schema.sql`** (login / audit / sessions) |
| 14 | `014_phase7_seed.sql` |
| 15 | `015_phase8_schema.sql` |
| 16 | `016_phase8_seed.sql` |
| 17 | `017_case_migration_schema.sql` |
| 18 | `018_case_migration_seed.sql` |
| 19 | `019_case_source_schema.sql` |
| 20 | `020_operations_model_rbac.sql` |
| 21 | `021_paralegal_file_authority.sql` |
| 22 | `022_case_master_intake.sql` |

Kung may `already exists` / `duplicate_object` / `type "user_role" already exists`:

- **001** — i-run ulit ang updated `001_phase1_schema.sql` (idempotent na), o **skip to 002** kung tables na meron na
- **002+** — seed files gumagamit ng `ON CONFLICT DO NOTHING` — safe i-run ulit
- **003+** — karamihan may `IF NOT EXISTS` — magpatuloy sa susunod na file

---

## Verify (pagkatapos ng 002)

I-paste sa SQL Editor at Run:

```sql
SELECT name FROM roles;
```

Dapat: `CLIENT`, `LAWYER`, `PARALEGAL`, `ADMIN`

---

## Pagkatapos

Retry login: https://sansonlawfirm.web.app/login
