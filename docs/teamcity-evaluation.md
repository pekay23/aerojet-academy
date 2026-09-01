# CI/CD Evaluation: TeamCity

## Current Setup

| Component | Tool | Status |
|-----------|------|--------|
| Hosting | Vercel | ✅ Active |
| CI/CD | Vercel Build Pipeline | ✅ Active |
| Unit Tests | Vitest (local) | ✅ Passing |
| E2E Tests | Playwright (local) | ✅ Configured |
| Lint | ESLint (local) | ✅ Configured |
| Type Check | TypeScript (local) | ✅ Configured |

## Is TeamCity Necessary?

**Short answer: No, not for this project.**

### Why Vercel + GitHub is sufficient:

1. **Vercel already builds and deploys** — every push to `main` triggers a production build. Preview deployments happen automatically for PRs.
2. **No self-hosted infrastructure needed** — Vercel manages build agents, caching, and scaling.
3. **GitHub Actions would cover any gaps** — if you need scheduled builds, matrix testing, or custom workflows, GitHub Actions integrates directly.
4. **This is a single Next.js app** — not a monorepo with 50 packages. The build pipeline is straightforward: `bun install → bun run type-check → bun run test → bun run build`.

### When TeamCity would make sense:

| Scenario | TeamCity Value |
|----------|----------------|
| Self-hosted / air-gapped environment | High — no external CI dependency |
| Complex multi-service deployments | Medium — better orchestration than Vercel |
| Long-lived build artifacts | Medium — artifact retention policies |
| Advanced test analytics | Low-Medium — flaky test detection, history |
| On-premise databases / infrastructure | High — can run inside your network |
| Team management / approval gates | Medium — built-in approval workflows |

### What TeamCity would NOT solve:

- Faster builds (Vercel already caches aggressively)
- Better deployment previews (Vercel previews are excellent)
- Simpler configuration (TeamCity requires server setup, agent management)
- Cost savings (TeamCity is free for small teams, but you pay in operational overhead)

## Recommendation

**Keep the current stack: Vercel + GitHub Actions.**

If you need CI enhancements:
1. Add a `.github/workflows/ci.yml` for:
   - Type checking
   - Unit tests (`bun run test --run`)
   - E2E tests (`bun run test:e2e`)
   - Lint (`bun run lint`)
2. Enable Vercel Preview Deployments for all PRs
3. Add branch protection on `main` requiring CI to pass

**Only consider TeamCity if:**
- You need to run builds on-premise (air-gapped, compliance)
- You have multiple deployment targets beyond Vercel
- You want a unified dashboard across multiple projects
- Your team already has TeamCity expertise/infrastructure

## Playwright Visual Tests (Added)

Added `tests/e2e/analytics-visual.test.ts` with screenshots for:
- Overview tab (metrics, alerts)
- Funnels tab (conversion charts)
- Retention tab (cohort data)
- Features tab (adoption metrics)
- Page Views tab (top pages)
- User Journey tab (event timeline)
- Tab navigation flow

Screenshots saved to `tests/e2e/screenshots/` for visual verification.
