# Phase 1 â€” Enterprise Foundation & Security

**SANSON Legal OS** | Powered By: CoreLogic

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Authentication | Firebase Auth | MFA-ready, Google OAuth, password reset |
| API Auth | Firebase ID token verification | Backend validates via Admin SDK |
| User sync | POST `/auth/sync` on login | Links `firebase_uid` to PostgreSQL |
| Authorization | RBAC with `roles`, `permissions`, `role_permissions` | Granular, auditable access control |
| API structure | Layered FastAPI (routes â†’ services â†’ repositories) | Maintainable enterprise pattern |
| API response | `{ success, message, data, meta, errors }` | Consistent client contract |
| Database | Supabase PostgreSQL | Managed Postgres with future Realtime |
| Design system | `@sanson/ui` package | Reusable ShadCN-style components |
| Monorepo | Turborepo workspaces | Shared types across web/backend boundary |

## Folder Structure

```
/apps
  /web              Next.js 15 â€” auth pages, dashboards, design system
  /backend          FastAPI â€” auth, users, roles, permissions, audit
/packages
  /ui               Reusable UI components (Premium Black / Neon Pink)
  /shared           Constants, permissions, audit actions
  /types            TypeScript interfaces
  /utils            Helpers (cn, permissions, paths)
/docs
  /architecture     System overview, auth flow, security
/scripts
  /migrations       SQL schema + seed data
```

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `roles` | CLIENT, LAWYER, PARALEGAL, ADMIN |
| `permissions` | Granular permission definitions |
| `role_permissions` | Many-to-many role â†” permission |
| `users` | Firebase-linked user records |
| `user_profiles` | Name, phone, address, photo |
| `audit_logs` | Security and activity audit trail |

### Standards Applied

- UUID primary keys
- `created_at`, `updated_at`, `deleted_at` (soft delete)
- Foreign keys with indexes
- `updated_at` triggers on all mutable tables

### Migration Files

1. `scripts/migrations/001_phase1_schema.sql` â€” DDL
2. `scripts/migrations/002_phase1_seed.sql` â€” Roles, permissions, matrix

## API Endpoints

Base path: `/api/v1`

### Health
| Method | Path | Auth |
|--------|------|------|
| GET | `/health/` | Public |
| GET | `/health/ready` | Public |

### Authentication
| Method | Path | Auth |
|--------|------|------|
| POST | `/auth/sync` | Bearer (Firebase ID token) |
| GET | `/auth/me` | Required |
| POST | `/auth/logout` | Required |
| GET | `/auth/status` | Public |

### Users
| Method | Path | Permission |
|--------|------|------------|
| GET | `/users/` | `users:read` |
| GET | `/users/stats` | `dashboard:admin` |
| GET | `/users/{id}` | Own or `users:read` |
| PATCH | `/users/{id}/profile` | Own or `users:write` |
| PATCH | `/users/{id}/role` | `roles:write` |
| PATCH | `/users/{id}/status` | `users:write` |

### Roles
| Method | Path | Permission |
|--------|------|------------|
| GET | `/roles/` | `roles:read` |
| GET | `/roles/matrix` | `roles:read` |
| GET | `/roles/{id}` | `roles:read` |

### Permissions
| Method | Path | Permission |
|--------|------|------------|
| GET | `/permissions/` | `permissions:read` |

### Audit
| Method | Path | Permission |
|--------|------|------------|
| GET | `/audit/` | `audit:read` |
| GET | `/audit/recent` | `audit:read` |

## Permission Matrix

| Permission | CLIENT | LAWYER | PARALEGAL | ADMIN |
|------------|--------|--------|-----------|-------|
| profile:read | âœ“ | âœ“ | âœ“ | âœ“ |
| profile:write | âœ“ | âœ“ | âœ“ | âœ“ |
| dashboard:client | âœ“ | | | âœ“ |
| dashboard:lawyer | | âœ“ | | âœ“ |
| dashboard:paralegal | | | âœ“ | âœ“ |
| dashboard:admin | | | | âœ“ |
| users:read | | âœ“ | âœ“ | âœ“ |
| users:write | | | | âœ“ |
| roles:read | | | | âœ“ |
| roles:write | | | | âœ“ |
| permissions:read | | | | âœ“ |
| audit:read | | | | âœ“ |

ADMIN receives `*` (all permissions).

## Security Design

- **Firebase ID token** verified on every protected route
- **RBAC middleware** via `require_permission()` and `require_role()`
- **Rate limiting** via slowapi (configurable per minute)
- **Security headers** middleware (XSS, frame deny, HSTS on HTTPS)
- **Audit logging** on login, logout, register, profile update, role change
- **Input validation** via Pydantic schemas
- **MFA-ready** via Firebase Authentication (enable in Firebase Console)
- **Soft deletes** on all core tables
- **CORS** restricted to configured origins

## Completed Components

### Backend
- [x] FastAPI application with versioning
- [x] Firebase Admin SDK integration
- [x] SQLAlchemy async models
- [x] Repository layer
- [x] Service layer (auth, user, rbac, audit)
- [x] API modules: auth, users, roles, permissions, audit, health
- [x] Standardized API responses
- [x] Rate limiting architecture
- [x] Security headers middleware

### Frontend
- [x] Next.js 15 App Router
- [x] Firebase client auth (email, Google, password reset)
- [x] Auth pages: login, register, forgot-password, reset-password
- [x] Role dashboards: client, lawyer, paralegal, admin
- [x] Dashboard shell (sidebar, header, breadcrumbs, profile menu)
- [x] Notifications placeholder, search placeholder
- [x] Auth guards and route protection
- [x] Admin stats widgets and audit activity feed
- [x] Powered By: CoreLogic branding

### Packages
- [x] `@sanson/types` â€” shared interfaces
- [x] `@sanson/shared` â€” constants, permissions, roles
- [x] `@sanson/utils` â€” helpers
- [x] `@sanson/ui` â€” design system components

### Infrastructure
- [x] Docker backend image
- [x] Render deployment config
- [x] Firebase Hosting config for web (`firebase.json`, static export)
- [x] SQL migrations and seeders

## Pending Modules (Future Phases)

| Module | Phase |
|--------|-------|
| AI Legal Assistant / Intake | Phase 2 |
| Document Upload & R2 Storage | Phase 2 |
| Case Management | Phase 3 |
| Appointment Scheduling | Phase 3 |
| Notifications (FCM) | Phase 3 |
| Supabase Realtime | Phase 3 |
| Smart Search & AI Analysis | Phase 4 |
| Mobile App (Expo) | Phase 4 |

## Setup Checklist

1. Copy `.env.example` to `.env` and configure Firebase + Supabase
2. Run `001_phase1_schema.sql` then `002_phase1_seed.sql` in Supabase
3. `npm install` from monorepo root
4. `pip install -r apps/backend/requirements.txt`
5. `npm run dev:backend` and `npm run dev:web`

## Default Admin User

Create manually in Firebase, then sync via `/auth/sync`. Update role to ADMIN via:

```http
PATCH /api/v1/users/{id}/role
{ "role": "ADMIN" }
```

(Requires existing admin or direct database update for first admin.)

