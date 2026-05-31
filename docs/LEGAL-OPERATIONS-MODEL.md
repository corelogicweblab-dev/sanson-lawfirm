# SANSON Law Firm — Paralegal-Centric Legal Operations Model

## Critical business rule

**SANSON Legal OS is a Paralegal-Centric Legal Operations Platform.**

- **Paralegals** are the primary operators.
- **Lawyers** focus on legal review, strategy, approvals, and decisions.
- **System Admin** is platform-only (no legal operations).

> Paralegals manage the case. Lawyers manage the legal decisions.

---

## Paralegal responsibilities

Paralegals create and maintain case records:

- Client information entry
- Legacy case encoding & migration
- New case encoding (manual, walk-in, phone, referral)
- Document / evidence / photo / video / audio uploads
- Affidavits, contracts, court filings
- Timeline creation & updates
- Calendar: hearings, meetings, consultations, deadlines
- Task creation & assignment
- Case status updates (pre-approval)
- Internal notes & activity recording
- Case organization & file categorization

---

## Case creation workflow

Origins: **AI Legal Intake** · **Walk-in** · **Phone** · **Referral** · **Manual intake** · **Legacy migration**

```
Client Request
    ↓
Paralegal Review          (/dashboard/paralegal/intake)
    ↓
Paralegal Creates Draft   (/dashboard/paralegal/cases/new)
    ↓
Paralegal Uploads Files   (/dashboard/paralegal/documents)
    ↓
Paralegal Builds Timeline (/dashboard/case?id=)
    ↓
Paralegal Schedules       (/dashboard/paralegal/calendar)
    ↓
Paralegal Assigns Lawyer  (case workspace)
    ↓
Lawyer Review             (/dashboard/lawyer/approvals)
    ↓
Lawyer Approval           (case workspace → IN_PROGRESS)
    ↓
Official Active Case
```

---

## Legacy case migration

Paralegals use **Case Migration Center** (`/dashboard/paralegal/migration-center`):

- Create legacy cases
- Bulk import metadata
- Validate & import into centralized repository
- All cases use `source_type = LEGACY | AI_INTAKE | MANUAL`

---

## File management authority

| Action | Paralegal | Lawyer |
|--------|-----------|--------|
| Upload / categorize / organize files | ✓ | ✗ (read + review only) |
| OCR + AI processing | ✓ | View results |
| Evidence timelines | ✓ create | ✓ read |

Enforced in API: `POST /documents/upload` returns 403 for lawyers.

---

## Calendar management authority

Paralegals schedule via **Calendar** (`/dashboard/paralegal/calendar`):

- Hearings, meetings, consultations, follow-ups, filing deadlines
- Assigned lawyers receive appointments (API + notifications planned)

---

## Lawyer responsibilities

- Legal review & assessment
- Legal notes & strategy
- Case approval (`cases:approve`)
- Filing approval
- Case closure (`cases:close`)

UI: **Review Hub** · **Approvals** · **Review Documents** (read-only uploads)

---

## Role matrix (system)

| Capability | CLIENT | PARALEGAL | LAWYER | ADMIN |
|------------|--------|-----------|--------|-------|
| AI intake | ✓ | review | read | — |
| Create cases / intake on behalf | — | ✓ | — | blocked |
| File uploads | own | ✓ all case files | read only | — |
| Calendar create | view | ✓ | view assigned | — |
| Assign lawyer | — | ✓ | — | blocked |
| Approve / close case | — | — | ✓ | blocked |
| Legacy migration | — | ✓ | — | read monitor |
| Platform / security | — | — | — | ✓ |

---

## Database migrations

Apply in order through **`021_paralegal_file_authority.sql`** (after `020`):

- `019` — `cases.source_type`
- `020` — RBAC: admin stripped from legal ops
- `021` — Lawyer file write removed; paralegal file + calendar permissions reinforced

---

## Implementation status

| Area | Status |
|------|--------|
| Paralegal ops dashboard + workflow strip | ✓ |
| Intake queue + manual intake | ✓ |
| New draft case + from-request | ✓ |
| Document center (paralegal upload / lawyer read-only) | ✓ |
| Calendar scheduling UI | ✓ |
| Case workspace (assign lawyer, timeline, approve) | ✓ |
| Lawyer approvals queue | ✓ |
| API file authority (lawyer upload blocked) | ✓ |
| User directory for intake (`/users/directory`) | ✓ |
| Full calendar day/week/month views | Planned |
| File rename/move/archive UI | Planned |
| Push notifications to lawyers | Planned |

See: `docs/TEST-ACCOUNTS.md`, `scripts/APPLY-MIGRATIONS-SUPABASE.md`
