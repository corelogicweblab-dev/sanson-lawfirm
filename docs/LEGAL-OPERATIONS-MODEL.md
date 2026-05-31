# SANSON Law Firm — Legal Operations Model

**Core principle:** Paralegal-centric Legal Operating System. AI intake → Paralegal operations → Lawyer review/approval. System Admin is **platform-only** (no legal operations).

## Role matrix

| Capability | CLIENT | PARALEGAL | LAWYER | ADMIN |
|------------|--------|-----------|--------|-------|
| AI Legal Assistant | ✓ | ✓ (review intake) | ✓ | — |
| Submit legal requests | ✓ | ✓ (on behalf) | read | read-only monitor |
| Create draft / official cases | — | ✓ | review | **blocked** |
| Legacy migration center | — | ✓ | — | read-only monitor |
| Assign lawyer/paralegal | — | ✓ | ✓ | **blocked** |
| Approve / close cases | — | — | ✓ | **blocked** |
| Calendar & appointments | view own | create/manage | assigned events | — |
| System / security / ops | — | — | — | ✓ |

## Case repository (single system)

All cases live in one `cases` table. No separate “legacy” vs “new” apps.

| `source_type` | Meaning |
|---------------|---------|
| `LEGACY` | Imported via Case Migration Center |
| `AI_INTAKE` | Created from legal request after AI/client intake |
| `MANUAL` | Paralegal draft / manual entry |

**Workflow:** Client → AI Assistant → Legal Request → Paralegal review → Lawyer review → Approval → Official case → Shared workspace.

## Shared case workspace

Route: `/dashboard/case?id=` — lawyers and paralegals see the same case (documents, timeline, tasks, assignments).

## Calendar (target)

Paralegals create events; lawyers receive assignments. Views: day / week / month / agenda (UI planned).

## Database migrations

Apply after existing `001`–`018`:

1. `019_case_source_schema.sql` — `cases.source_type`
2. `020_operations_model_rbac.sql` — ADMIN legal ops removed; paralegal/lawyer permissions aligned

## Implementation status

| Area | Status |
|------|--------|
| `source_type` on cases | ✓ schema + API |
| ADMIN blocked from legal mutations | ✓ API `require_legal_operator` + RBAC seed |
| Paralegal full case list | ✓ list API |
| Lawyer-only close/approve | ✓ PATCH guard |
| Case Migration Center | ✓ paralegal UI |
| Shared case workspace shell | ✓ basic page |
| Calendar day/week/month UI | Planned |
| CSV/Excel bulk import | Planned (JSON bulk today) |

See also: `docs/TEST-ACCOUNTS.md`, `docs/GO-LIVE-CHECKLIST.md`.
