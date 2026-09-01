# Branch Strategy

## Branches

| Branch | Purpose | Protected |
|--------|---------|-----------|
| `main` | Production-ready code. Live on Vercel. | Yes |
| `staging` | Pre-production testing. Deployed to Vercel preview/staging environment. | No |
| `dev` | Integration branch for features. All feature branches merge here first. | No |
| `feature/*` | Individual features (e.g., `feature/analytics-dashboard`). | No |

## Workflow

```
feature/* → dev → staging → main
```

1. **Feature development**: Create `feature/<name>` from `dev`. Work and commit locally.
2. **Integration**: Merge `feature/*` into `dev` via PR or direct push. Run tests locally.
3. **Staging**: Merge `dev` into `staging`. Deploy to staging environment for QA.
4. **Production**: After QA sign-off, merge `staging` into `main`. Deploy to production.

## Rules

- **Never push directly to `main`**. All changes must flow through `dev` → `staging` → `main`.
- **`main` is always deployable**. Only merge here after staging validation.
- **`staging` mirrors production**. Use it for final QA, client review, and user acceptance testing.
- **`dev` is the integration branch**. Merge features here first; run full test suite before promoting to staging.
- **Commit messages**: Use conventional commits (`feat:`, `fix:`, `chore:`, etc.).
- **Pre-push hooks**: `bun run type-check` and `bun run test --run` must pass before any push.

## Promotion Process

1. Feature complete on `feature/*` branch
2. Local verification: `bun run type-check && bun run test --run && bun run lint`
3. Merge to `dev`
4. QA on `staging` deployment
5. Bug fixes on `feature/*` or `dev`, re-merge to `staging`
6. Final sign-off from project owner
7. Merge `staging` → `main`
8. Tag release if needed

## Current State

- `main`: `b36d5ada` — stable, production-ready
- `dev`: `68aa17e1` — analytics system (ready for staging)
- `staging`: `68aa17e1` — mirrors dev until QA begins
