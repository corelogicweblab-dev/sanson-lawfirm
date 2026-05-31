# Git Branch Strategy

| Branch | Purpose | Deploy target |
|--------|---------|---------------|
| `main` | Production | Render API + Vercel/Firebase web |
| `staging` | Pre-production QA | Staging Render + Vercel preview |
| `development` | Integration | Local / dev Render preview |
| `feature/*` | Feature work | PR → development |
| `hotfix/*` | Urgent production fixes | PR → main (+ backport to staging) |
| `release/*` | Release candidates | PR → main |

## Rules

1. **No direct push to `main`** — use pull requests with review.
2. **CI must pass** — `ci.yml` runs lint, typecheck, migration manifest check.
3. **Merge flow:** `feature/*` → `development` → `staging` → `main`.
4. **Hotfixes:** branch from `main`, merge to `main`, then cherry-pick to `staging` and `development`.

## Protected branches (configure in GitHub)

- `main`: require PR, require status checks, no force push
- `staging`: require PR, require status checks
