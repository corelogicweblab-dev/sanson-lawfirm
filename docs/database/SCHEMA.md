# Database Documentation â€” Phase 1

## ERD (Simplified)

```
roles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
  â”‚                 â”‚
  â”‚    role_permissions â”€â”€â”€ permissions
  â”‚
  â””â”€â”€ users â”€â”€â”€ user_profiles

audit_logs â”€â”€ (performed_by) â”€â”€ users
```

## Table Reference

### roles
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| name | user_role ENUM | UNIQUE |
| display_name | VARCHAR(100) | |
| description | TEXT | |
| created_at, updated_at, deleted_at | TIMESTAMPTZ | |

### permissions
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| name | VARCHAR(100) | UNIQUE, e.g. `users:read` |
| display_name | VARCHAR(150) | |
| module | VARCHAR(50) | Grouping |

### role_permissions
| Column | Type | Notes |
|--------|------|-------|
| role_id | UUID | FK â†’ roles |
| permission_id | UUID | FK â†’ permissions |

### users
| Column | Type | Notes |
|--------|------|-------|
| firebase_uid | VARCHAR(128) | UNIQUE, Firebase UID |
| email | VARCHAR(255) | UNIQUE |
| role_id | UUID | FK â†’ roles |
| status | user_status ENUM | ACTIVE, INACTIVE, etc. |
| is_active | BOOLEAN | |
| last_login_at | TIMESTAMPTZ | |

### user_profiles
| Column | Type | Notes |
|--------|------|-------|
| user_id | UUID | FK â†’ users, UNIQUE |
| first_name, last_name | VARCHAR(100) | Required |
| middle_name, suffix | VARCHAR | Optional |
| phone, address, profile_photo | | |

### audit_logs
| Column | Type | Notes |
|--------|------|-------|
| action | VARCHAR(100) | e.g. `user.login` |
| entity_type | VARCHAR(100) | e.g. `users` |
| entity_id | UUID | Target record |
| performed_by | UUID | FK â†’ users |
| ip_address | INET | |
| user_agent | TEXT | |
| old_values, new_values | JSONB | Change tracking |

Powered By: **CoreLogic**

