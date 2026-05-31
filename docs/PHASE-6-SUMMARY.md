# Phase 6 Summary — Mobile Ecosystem, Realtime & Client Engagement

**Powered By: CoreLogic**

## Objective

Cross-platform mobile access for **Client**, **Lawyer**, **Paralegal**, and **Admin** with push notifications, realtime sync hooks, secure auth, and offline-ready architecture.

## Mobile Stack

| Layer | Technology |
|-------|------------|
| Framework | React Native + **Expo** (~52) + **Expo Router** |
| Language | TypeScript |
| Auth | Firebase Authentication |
| API | FastAPI `/api/v1` |
| Push | Firebase Cloud Messaging (via Firebase Admin) |
| Realtime | Supabase Realtime + `sync_logs` poll fallback |
| Local storage | `expo-secure-store` + AsyncStorage cache/queue |

**App path:** `apps/mobile/`

```bash
cd apps/mobile
cp .env.example .env
npm install   # from monorepo root: npm install
npm run dev
```

## Mobile Architecture

```
Expo App (role-based tabs)
    ↓ Firebase Auth → ID token
    ↓ POST /auth/sync
    ↓ GET /mobile/bootstrap (dashboard + realtime config)
    ↓ POST /devices/register (FCM token)
    ↓ Tabs: Home, AI, Cases, Documents, Notifications, Profile
    ↓ Supabase channels OR GET /sync/events poll
```

## Role Experiences

### Client
- Dashboard widgets: AI chats, pending requests, appointments, cases, notifications
- Tabs: Home, AI Assistant, Cases, Documents, Requests, Alerts, Profile

### Lawyer
- Widgets: consultations, urgent cases, pending doc reviews, tasks
- Tabs: Home, Cases, Documents, Consultations, Tasks, Alerts, Profile

### Paralegal
- Widgets: assigned tasks, notifications
- Tabs: Home, Cases, Documents, Tasks, Alerts, Profile

### Admin
- Widgets: user/case counts, notifications
- Tabs: Home, Cases, Admin, Alerts, Profile

## Database (`011`, `012`)

| Table | Purpose |
|-------|---------|
| `mobile_devices` | Device registration, biometric-ready flag, revoke |
| `push_tokens` | FCM tokens per device |
| `notification_preferences` | Per-user alert toggles + quiet hours |
| `notifications` | In-app inbox + push delivery status |
| `sync_logs` | Realtime/offline sync event stream |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/mobile/bootstrap` | Post-login payload |
| GET | `/mobile/dashboard` | Role dashboard widgets |
| POST | `/devices/register` | Register device + optional FCM |
| GET | `/devices/` | List user devices |
| POST | `/devices/push-token` | Update FCM token |
| DELETE | `/devices/{id}` | Revoke device session |
| GET | `/notifications/` | Notification center |
| POST | `/notifications/{id}/read` | Mark read |
| POST | `/notifications/read-all` | Mark all read |
| GET/PATCH | `/notifications/preferences` | Push preferences |
| GET | `/sync/events` | Poll sync log (offline recovery) |
| GET | `/sync/realtime-config` | Supabase channel map |

Existing APIs reused: `/auth/sync`, `/cases`, `/documents`, `/appointments`, `/tasks`, `/chat`, `/search`.

## Push Notification Architecture

1. Event occurs → `RealtimeService.emit()` → `NotificationService.create_and_push()`
2. Row in `notifications` + respect `notification_preferences`
3. `PushService` sends FCM if Firebase Admin configured
4. Audit: `push.delivered`, `notification.read`

**Channels:** `APPOINTMENT_CONFIRMED`, `CASE_UPDATED`, `TASK_ASSIGNED`, `DOCUMENT_UPLOADED`, `AI_PROCESSING_COMPLETE`, etc.

## Realtime Architecture

- **Primary:** Supabase Realtime channels (`sanson:cases`, `sanson:appointments`, …)
- **Backend:** Every emit writes `sync_logs` for audit + mobile poll
- **Fallback:** `GET /sync/events?since=ISO`

Enable Supabase Realtime on tables in Phase 7 or via dashboard; mobile client uses `@supabase/supabase-js`.

## Offline Strategy

| Feature | Implementation |
|---------|----------------|
| Offline cache | `AsyncStorage` via `cacheGet` / `cacheSet` |
| Pending queue | `offline-queue.ts` — enqueue failed mutations |
| Background sync | `flushQueue()` on reconnect |
| Dashboard fallback | Cached bootstrap on launch |

## Security

- Firebase ID tokens on all API calls
- `expo-secure-store` for tokens (biometric gate ready)
- Device registration + remote revoke (`DELETE /devices/{id}`)
- RBAC permissions: `mobile:read`, `devices:register`, `notifications:*`, `sync:read`

## Audit Events

- `mobile.login`, `mobile.device_registered`, `mobile.device_revoked`
- `push.delivered`, `notification.read`
- `mobile.dashboard_access`, `mobile.case_access` (extend per screen)

## Performance

- Paginated notifications
- Lazy tab data fetch on focus
- Dashboard single bootstrap call
- Sync poll limit 50–100
- Image/upload via presigned URLs (no binary through API)

## Pending (Phase 7)

- Production deployment & app store builds (EAS)
- Full Supabase Realtime postgres_changes wiring
- `expo-local-authentication` biometric unlock
- Native document viewer (PDF)
- Monitoring & disaster recovery
- Multi-tenant / multi-branch

## Migrations

1. `scripts/migrations/011_phase6_schema.sql`
2. `scripts/migrations/012_phase6_seed.sql`

## Environment

**Mobile (`apps/mobile/.env`):**
- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_FIREBASE_*`
- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`

**Backend (existing + FCM via Firebase Admin):**
- `FIREBASE_*` service account (push + auth verify)
