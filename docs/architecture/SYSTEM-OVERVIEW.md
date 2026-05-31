# System Overview â€” SANSON Legal OS

## Phase 1 Scope

Phase 1 establishes the enterprise foundation:

- Monorepo architecture
- Firebase Authentication
- PostgreSQL user store (Supabase)
- RBAC with roles and permissions
- Audit logging
- Dashboard framework for all four roles
- Design system (`@sanson/ui`)

## High-Level Architecture

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     Firebase ID Token     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Next.js    â”‚ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¶â”‚   FastAPI   â”‚
â”‚ (Firebase)  â”‚                           â”‚  (Render)   â”‚
â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”˜                           â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”˜
       â”‚                                         â”‚
       â”‚ Firebase Auth                           â”‚ SQLAlchemy
       â–¼                                         â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                           â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Firebase   â”‚                           â”‚  Supabase   â”‚
â”‚    Auth     â”‚                           â”‚ PostgreSQL  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                           â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

## Layer Responsibilities

| Layer | Responsibility |
|-------|----------------|
| Presentation (Next.js) | UI, Firebase client auth, route guards |
| API (FastAPI) | Business logic, validation, RBAC enforcement |
| Repository | Database queries |
| Domain | Authenticated user model, business types |
| Infrastructure | Config, Firebase Admin, security middleware |

Powered By: **CoreLogic**

