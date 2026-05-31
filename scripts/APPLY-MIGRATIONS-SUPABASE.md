# Supabase — apply all migrations (fix login sync)

Login error `transaction has been rolled back` / `column does not exist` means **schema is incomplete**.

## Steps

1. Open [Supabase](https://supabase.com/dashboard) → your project → **SQL Editor**
2. Run each file **in order** from `scripts/migrations/`:

| # | File |
|---|------|
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
| 13 | **`013_phase7_schema.sql`** ← required for login audit/sessions |
| 14 | `014_phase7_seed.sql` |
| 15 | `015_phase8_schema.sql` |
| 16 | `016_phase8_seed.sql` |
| 17 | `017_case_migration_schema.sql` |
| 18 | `018_case_migration_seed.sql` |
| 19 | `019_case_source_schema.sql` |
| 20 | `020_operations_model_rbac.sql` |

3. If a file says `already exists`, OK — continue to next file.
4. Retry login at https://sansonlawfirm.web.app/login

## Verify roles exist

```sql
SELECT name FROM roles;
```

Expect: CLIENT, LAWYER, PARALEGAL, ADMIN
