## Summary

<!-- What does this PR change and why? -->

## Type

- [ ] Feature
- [ ] Bug fix
- [ ] Ops / deployment
- [ ] Documentation

## Checklist

- [ ] No secrets committed (`.env`, keys, passwords)
- [ ] `npm run lint` and `npm run typecheck` pass locally
- [ ] Database migrations added to `scripts/migrations/` and `migration-manifest.json` if schema changed
- [ ] Render / Vercel env vars documented if new variables added
- [ ] Tested against staging or local API

## Branch rules

- Target `development` or `staging` first; `main` requires review
- No direct pushes to `main`
