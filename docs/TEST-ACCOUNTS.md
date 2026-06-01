# Test Accounts (Firebase)

Passwords are set in **Firebase Console → Authentication → Users**, not in this repo.

## Create users

| Role | Email | Suggested password |
|------|--------|-------------------|
| Admin | `admin@sansonlaw.ph` | `Admin@123456` |
| Lawyer (Managing Partner / CEO) | `lawyer@sansonlaw.ph` — **Rosebelle L. Sanson** | `Lawyer@123456` |
| Paralegal | `paralegal@sansonlaw.ph` | `Paralegal@123456` |
| Client | `client@sansonlaw.ph` | `Client@123456` |

## Dashboard routing (automatic)

Logging in with the emails above routes to the correct dashboard (`ADMIN` → `/dashboard/admin`, etc.). The API updates the role on each login for these known addresses.

Optional manual SQL if you use a different email:

```sql
UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'ADMIN') WHERE email = 'your-admin@email.com';
```

## Production note

Replace or disable test accounts before public go-live. See [GO-LIVE-CHECKLIST.md](GO-LIVE-CHECKLIST.md).
