# Test Accounts (Firebase)

Passwords are set in **Firebase Console → Authentication → Users**, not in this repo.

## Create users

| Role | Email | Suggested password |
|------|--------|-------------------|
| Admin | `admin@sansonlaw.ph` | `Admin@123456` |
| Lawyer | `lawyer@sansonlaw.ph` | `Lawyer@123456` |
| Paralegal | `paralegal@sansonlaw.ph` | `Paralegal@123456` |
| Client | `client@sansonlaw.ph` | `Client@123456` |

## Set roles (Supabase SQL, after first login)

```sql
UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'ADMIN') WHERE email = 'admin@sansonlaw.ph';
UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'LAWYER') WHERE email = 'lawyer@sansonlaw.ph';
UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'PARALEGAL') WHERE email = 'paralegal@sansonlaw.ph';
-- client@sansonlaw.ph stays CLIENT by default
```

## Production note

Replace or disable test accounts before public go-live. See [GO-LIVE-CHECKLIST.md](GO-LIVE-CHECKLIST.md).
