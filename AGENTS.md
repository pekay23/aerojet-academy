# AGENTS.md

## Learned User Preferences

- Bun is the package manager — use `bun` for all scripts (dev, build, test, lint, db commands)
- Windows PowerShell environment — avoid bash-isms in commands; use PowerShell-native syntax
- Project uses Next.js 16 App Router with 5 role-based portals (Staff, Student, Instructor, Applicant, Examiner)
- Prisma dual-client: use `prismaUnfiltered` in auth-gated pages, `prisma` only in lib/auth/helpers.ts and passkey routes
- User prefers the swarm-orchestrator pattern for multi-step tasks (decompose, delegate, verify, report)

## Learned Workspace Facts

- Aerojet Academy is an aviation training academy portal with EASA Part-147 compliance requirements
- Auth: NextAuth.js with email/password + TOTP 2FA, passkey support
- Database: Neon PostgreSQL (dev) with WebSocket adapter; pg pool for production
- Supabase is a secondary backend (document storage, realtime messages, logical replication replica)
- Audit logging via `lib/audit/logger.ts` — uses `description:` and `changes:` fields, NOT `metadata:`
- Cron jobs: 17 scheduled in vercel.json under `app/api/cron/*/route.ts`
- Docs site: `docs/` markdown → `docs/html/` via `bun run docs:html`
- Test suite: Vitest (unit/component) + Playwright (e2e); Windows requires `--no-file-parallelism`
- ESLint currently non-functional on Windows (flat config migration in progress)

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
