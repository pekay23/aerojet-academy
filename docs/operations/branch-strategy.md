# Branch Strategy

## Branches

| Branch   | Purpose                                                        | Protected |
| -------- | ------------------------------------------------------------- | --------- |
| `main`   | Production-ready code. Live on Vercel.                         | Yes       |
| `dev`    | Integration branch for all in-progress and unverified work.   | No        |

> **Simplified from `dev → staging → main` to `dev → main`**. On free-tier
> GitHub (no branch protection, no Actions CI) and Vercel Hobby (no staging
> deploy environment), the `staging` branch added overhead without value. All
> work lands on `dev` first; when approved, merge `dev` into `main` and tag
> the release.

## Workflow

```
dev → main (PR or direct merge)
```

1. **Development**: Commit all in-progress and unverified changes directly to `dev`.
2. **Verification**: Run `bun x tsc --noEmit` and `bun run test --run --no-file-parallelism --no-color` on `dev`.
3. **Promotion**: When `dev` is ready for production, merge it into `main` (via Pull Request or direct push if no PR review is needed).
4. **Release**: Tag `main` with a semantic version (e.g., `git tag v1.2.7 main`).

## Rules

- **All work goes to `dev` first.** Do not commit features directly to `main`.
- **`main` is always deployable and tagged.** Only merge here after verification.
- **Commit messages**: Use conventional commits (`feat:`, `fix:`, `chore:`, etc.) for automated versioning.
- **Pre-push hooks**: `bun x tsc --noEmit` and `bun run test --run --no-file-parallelism --no-color` must pass before any push. Use `git push --no-verify` only when the pre-existing type errors are known and accepted.
- **Version bumps**: Driven by `bun run release:main` (release-it with conventional commits). The pre-commit hook does **not** bump versions — it only runs `lint-staged` (Prettier).
- **Feature isolation**: Not required for solo development. Use `git stash` for quick context switches. For larger work, create a temporary feature branch and delete it after merging to `dev`.

## Promotion Process

1. Work complete on `dev` (commits accumulate here).
2. Local verification: `bun x tsc --noEmit && bun run test --run --no-file-parallelism --no-color`
3. Push to `origin/dev`.
4. Merge `dev` into `main` (via PR or direct merge with `--no-ff`).
5. Tag `main`: `git tag v1.2.7 main && git push origin v1.2.7`

## Current State

- `main`: production-ready, contains audit remediation + tiptap security update
- `dev`: integration branch, 1 commit ahead of `main` (audit remediation wave 6)
- Deleted branches (recoverable via GitHub reflog for 90 days): `staging`, `preview/*`, `feature/v1.4.0-audit-and-refactor`, `v1-archive`, `v2-ui`, `v2-update`, `renovate/*`, `vercel/*`
