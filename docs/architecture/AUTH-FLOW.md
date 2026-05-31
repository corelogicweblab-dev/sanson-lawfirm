# Authentication Flow

## Registration / Login

1. User authenticates with **Firebase** (email/password or Google)
2. Client receives **Firebase ID token**
3. Client calls `POST /api/v1/auth/sync` with Bearer token
4. Backend verifies token via **Firebase Admin SDK**
5. Backend creates or updates `users` + `user_profiles` in PostgreSQL
6. Backend logs `user.register` or `user.login` to `audit_logs`
7. Client stores user in Zustand auth store
8. Client redirects to role-specific dashboard

## Session Validation

Every protected API request:

1. Extract `Authorization: Bearer <token>`
2. Verify Firebase ID token
3. Load user by `firebase_uid`
4. Load permissions for user's role
5. Build `AuthenticatedUser` with permission checks
6. Enforce via `require_permission()` or `require_role()`

## Logout

1. Client calls `POST /api/v1/auth/logout`
2. Backend writes `user.logout` audit entry
3. Client calls Firebase `signOut()`
4. Redirect to `/login`

## Development Mode

When Firebase Admin credentials are not configured:

- Backend accepts `dev:email@example.com` as Bearer token for testing
- Frontend shows configuration error on auth pages

## MFA

Enable multi-factor authentication in Firebase Console. No backend changes required â€” Firebase handles MFA challenge before issuing ID tokens.

Powered By: **CoreLogic**

