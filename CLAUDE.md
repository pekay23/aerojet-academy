# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js 16 App Router aviation training academy portal with 5 role-based portals: Staff, Student, Instructor, Applicant, Examiner.
Prisma ORM, Neon PostgreSQL, NextAuth.js sessions, Vercel deployment. Package manager: **bun**.

## Common Commands

```bash
bun dev              # Start dev server (Next.js Turbopack)
bun run build        # Production build (requires .env)
bun run lint         # ESLint
bun run lint:fix     # ESLint auto-fix
bun run type-check   # npx tsc --noEmit
bun run format       # Prettier
bun run storybook    # Storybook on port 6006

# Testing
bun run test                           # Vitest (all unit/component)
bun run test tests/path/to/file.test.ts  # Vitest (single file)
bun run test:ui                        # Vitest with browser UI
bun run test:e2e                       # Playwright (Chromium only)
bun run test:e2e tests/e2e/file.spec.ts  # Playwright (single file)
bun run test:e2e:all                   # Playwright (all browsers, CI mode)

# Database
bun run db:generate       # prisma generate
bun run db:push           # prisma db push (Neon — this project has no migration history; db:push is the workflow)
bun run db:push:supabase  # mirror schema to Supabase replica (runs scripts/sync-supabase-schema.sh)
bun run db:migrate        # prisma migrate dev (rarely used here — kept for emergencies)
bun run db:studio         # prisma studio (GUI)
bun run db:seed           # seed from prisma/seed.ts
bun run db:seed:mock      # seed mock data
```

## Git Hooks (Husky)

- **pre-commit**: runs `node scripts/bump-version.js` (bumps `package.json` version) then `npx lint-staged` — `lint-staged` config only formats with **Prettier** on staged `*.{ts,tsx,js,json,md,css}` files. **ESLint does NOT run on commit.**
- **pre-push**: runs `bun run type-check` and `bun run test --run` (Vitest) — push fails on type errors or test failures. Lint is also not in pre-push; run `bun run lint` manually before opening a PR.

## Architecture

### Route Groups & Portals

```
app/
  (auth)/       — Login, register, verify-email, forgot/reset-password
  (public)/     — Marketing site, courses catalog, admissions, newsroom, contact
  staff/        — Admin/staff dashboard (SUPER_ADMIN, ADMIN, STAFF roles)
  student/      — Student portal
  instructor/   — Instructor portal
  applicant/    — Applicant forms & status tracking
  examiner/     — Exam administration
  api/          — REST API endpoints
```

Auth is enforced in **three layers**:

1. **Edge middleware** at `middleware.ts:37` (active) — `ROUTE_ROLE_MAP` gates `/staff`, `/instructor`, `/student`, `/examiner`, `/applicant` and their `/api/*` siblings. Unauthenticated users get redirected to `/login?callbackUrl=…` (pages) or `401 JSON` (API). Wrong-role users get redirected to their own portal (e.g. STUDENT hitting `/staff` → `/student`).
2. **Portal layouts** — each portal's `layout.tsx` calls `requireStaff`/`requireInstructor`/`requireStudent`/etc. from `lib/auth/helpers.ts` as a second check and to pass `session.user` into the tree.
3. **Route handlers / server actions** — call `requireAdmin()`/`requireAuth()`/etc. directly; thrown `'Unauthorized'`/`'Forbidden'` strings are caught by `withErrorHandler` and converted to 401/403.

> **Next.js 16 note**: the `middleware` file convention is deprecated in favor of `proxy.ts`. Migration: `npx @next/codemod@canary middleware-to-proxy .` (or rename the file and export `proxy` instead of `middleware`). Helper utilities at `lib/auth/middleware-helpers.ts` and `utils/supabase/middleware.ts` are NOT wired into the active middleware — they're available for ad-hoc use.

### Auth System

- **NextAuth.js** handles session management (JWT-based, credential provider)
- `lib/auth/auth-options.ts` — NextAuth config with email/password + TOTP 2FA
- `lib/auth/helpers.ts` — `getAuthSession()`, email verification, rate limiting, `requireAdmin()`/`requireAuth()` guards (throw on failure)
- `lib/auth/session-context.ts` — `getCachedSession()` for request-scoped caching
- `lib/auth/permissions.ts` — Role hierarchy: SUPER_ADMIN > ADMIN > STAFF > INSTRUCTOR > STUDENT > APPLICANT, plus granular DB-backed permissions
- `lib/auth/passkey-config.ts` — WebAuthn/passkey RP config (rpID, origins)
- Passkey API routes in `app/api/auth/passkey/` — register-options, register-verify, login-options, login-verify, CRUD
- Passkey settings: `userVerification: 'preferred'`, `residentKey: 'preferred'`, `requireUserVerification: false` on server verification
- `lib/auth/totp.ts` — Custom RFC 6238 TOTP implementation using Node.js `crypto` (no otplib dependency for verification)

### Prisma Dual-Client Pattern

Two Prisma clients exist in `lib/prisma/client.ts`:

- **`prisma`** (default export): Extended with RLS + soft-delete. Wraps every query in a transaction that sets PostgreSQL session variables (`aerojet.user_id`, `aerojet.user_role`) for row-level security policies. Uses `AsyncLocalStorage` for context.
- **`prismaUnfiltered`** (named export): Raw client, no RLS overhead. Use in staff pages.

The adapter (`lib/prisma/db-base.ts`) auto-selects: Neon WebSocket for dev, pg pool for production. Configurable via `AEROJET_LOCAL_DB_ADAPTER` env var.

### API Route Pattern

API routes use `withErrorHandler` from `lib/api/response.ts`:

```ts
export const GET = withErrorHandler(async (req, ctx) => {
  const session = await requireAdmin() // throws 'Unauthorized'/'Forbidden' on failure
  const data = await prismaUnfiltered.thing.findMany(...)
  return apiSuccess(data)  // auto-serializes via serializePrisma()
})
```

- `withErrorHandler` catches thrown errors: `'Unauthorized'`→401, `'Forbidden'`→403, `includes('not found')`→404, else→500
- It also resolves `ctx.params` (async params in Next.js 16)
- Use `parsePagination(searchParams)`, `parseSorting()`, `parseSearch()` for list endpoints
- Response helpers: `apiSuccess()`, `apiCreated()`, `apiPaginated()`, `apiError()`, `apiNotFound()`, `apiForbidden()`

### Forms & Server Actions

- **Client forms**: react-hook-form + zod via `@hookform/resolvers`. Schemas live in `lib/validation/`
- **Server Actions**: `'use server'` in `actions.ts` files colocated with route segments (e.g., `app/staff/actions.ts`, `app/applicant/actions.ts`)
- Server actions body size limit: 4MB (configured in `next.config.ts`)

### Key Shared Utilities

- `lib/utils/index.ts` — `cn()` (tailwind-merge), `formatCurrency()`, `formatDate()`, `generateRegistrationCode()`
- `lib/utils/serialization.ts` — `serializePrisma<T>()` converts Decimal→number, Date→ISO string for client components
- `lib/utils/constants.ts` — `APP_NAME`, `EXAM_FEE`, `PROGRAMMES`, `ROLES`, module lists, status groups
- `lib/api/response.ts` — API response helpers (see API Route Pattern above)
- `lib/cached-queries.ts` — Cached reference data (course categories, license categories, academic years, semesters, exam components, active courses) with 5min TTL

### Email (Resend)

- `lib/email/sender.ts` — `sendEmail()`, `sendBulkEmails()`. Falls back to `console.log` when `RESEND_API_KEY` is not set (dev mode)
- Default sender: `Aerojet Academy <admissions@mail.aerojet.com>`

### File Uploads (UploadThing)

- Routes defined in `app/api/uploadthing/core.ts` with role-based auth
- Client helpers: `UploadButton`, `UploadDropzone` from `lib/uploads/uploadthing.ts`
- Remote image domains configured in `next.config.ts` (`utfs.io`, `*.ufs.sh`, `uploadthing.com`)

### Storage & Sync (Supabase secondary backend)

Supabase is a secondary backend alongside Neon, used for structured document storage and as a replica/backup. Helpers — **do not duplicate**:

- `lib/supabase/client.ts` — `getSupabaseAdmin()` (service-role), `isSupabaseConfigured()`
- `lib/storage/supabase-storage.ts` — bucket `aerojet-documents`, `buildStoragePath()`, `uploadToStorage()`, `getSignedUrl()`, `documentCategoryFolder()` folder taxonomy
- `lib/supabase/dual-write.ts`, `lib/supabase/backup.ts`, `lib/prisma/supabase-sync-extension.ts` — currently dormant (no callers); reserved for future logical-replication / dual-write strategies
- Schema mirroring: `bun run db:push:supabase` runs `scripts/sync-supabase-schema.sh`

Used today by Document Vault (`app/staff/documents/`) and Teaching Materials (`app/instructor/materials/`).

### Audit Logging

Every privileged mutation (role changes, refunds, withdrawals, certificate releases, permission grants) writes through `lib/audit/logger.ts`:

```ts
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

await createAuditLog({
  action: AuditAction.USER_ROLE_CHANGED,
  userId: actor.id,
  targetUserId: target.id,
  description: 'STUDENT → INSTRUCTOR',   // human summary (NOT `metadata:`)
  changes: { before: { role: 'STUDENT' }, after: { role: 'INSTRUCTOR' } },
})
```

Field names trip people up: it's `description:` (string) and `changes:` (object diff), **not** `metadata:`. Query via `queryAuditLogs()`; retention sweep at `/api/cron/cleanup-audit-logs`.

### Cron Jobs

Registered in `vercel.json` and live under `app/api/cron/*/route.ts`. Pattern: check `CRON_SECRET` header → run job → return JSON. Currently scheduled (UTC):

| Path | Schedule |
|---|---|
| `check-events` | `0 1 * * *` (daily 01:00) |
| `check-pools` | `0 2 * * *` |
| `payment-deadlines` | `0 3 * * *` |
| `backup` | `0 4 * * *` |
| `cleanup-abandoned-accounts` | `0 5 * * *` |
| `scheduled-reports` | `0 8 * * 1` (Mondays 08:00) |
| `milestone-reminders` | `0 9 * * *` |
| `send-reminders` | `0 10 * * *` |
| `expire-bundles` | `0 0 * * *` |
| `cleanup-audit-logs` | `0 0 1 * *` (1st of month) |

Route files also exist for `aptitude-reminders`, `interview-reminders`, `modular-deadlines` but are **not yet registered** in `vercel.json`. To add a cron: create the route, gate with `CRON_SECRET`, then append to `vercel.json`.

### Testing

- **Unit/Component**: Vitest + jsdom, tests in `tests/`, setup in `tests/setup.ts`
- **E2E**: Playwright, tests in `tests/e2e/`, runs against `localhost:3000`
- **Storybook**: `@storybook/nextjs`, stories in `stories/`, on port 6006

## Performance Conventions (MUST FOLLOW)

### 1. Always use `prismaUnfiltered` in staff pages

Staff pages are already auth-gated. The RLS client (`prisma`) wraps every query in a transaction with `set_config()` — unnecessary overhead for staff/admin roles.

```ts
// CORRECT
import { prismaUnfiltered } from '@/lib/prisma/client'
// WRONG — adds transaction overhead for no benefit
import prisma from '@/lib/prisma/client'
```

Exception: Student/applicant-facing pages that need RLS enforcement should still use `prisma`.

### 2. Parallelize independent queries with Promise.all

Never write sequential `await` calls for independent queries. Always use `Promise.all`.

```ts
// CORRECT
const [users, courses, events] = await Promise.all([
  prismaUnfiltered.user.findMany(...),
  prismaUnfiltered.course.findMany(...),
  prismaUnfiltered.examEvent.findMany(...),
])

// WRONG — 3x slower
const users = await prismaUnfiltered.user.findMany(...)
const courses = await prismaUnfiltered.course.findMany(...)
const events = await prismaUnfiltered.examEvent.findMany(...)
```

### 3. Every page directory MUST have a `loading.tsx`

Every route segment with a `page.tsx` that fetches data server-side must have a `loading.tsx` for Suspense streaming. Pattern:

```tsx
import { TableSkeleton } from '@/components/shared/DashboardSkeleton'
export default function Loading() {
  return <TableSkeleton rows={10} />
}
```

### 4. Use `unstable_cache` for reference data

Rarely-changing data should be cached. Use existing helpers from `lib/cached-queries.ts`. Add new cached queries there when appropriate.

### 5. Use `next/dynamic` for heavy client components

Lazy-load components with large JS bundles (Recharts, TipTap, etc.):

```ts
import dynamic from 'next/dynamic'
const RevenueChart = dynamic(() => import('./RevenueChart'), { ssr: false })
```

### 6. Never load all rows to filter in JS

Do filtering/searching in SQL, not in application code.

### 7. Always paginate API responses

API routes returning lists must include `take` (and `skip` for paginated endpoints). Use `apiPaginated` from `lib/api/response.ts`.

### 8. Consolidate multiple queries for the same entity

If a page makes 2+ `findUnique` calls for the same record, merge them into one with all needed `select`/`include` fields.

## Code Conventions

### Imports

- Server components in `app/staff/` use `{ prismaUnfiltered }` from `@/lib/prisma/client`
- Toast notifications use `sonner` (NOT react-hot-toast)
- Date formatting: `date-fns` format function
- Serialization for client components: `serializePrisma()` from `@/lib/utils/serialization`
- **Client components**: Import `formatCurrency` from `@/lib/currency` (or `@/lib/utils/currency` which re-exports it), NOT from `@/lib/analytics/metrics` (which pulls in Prisma → `async_hooks` → build failure)

### otplib (v13)

- Only used for secret/URI generation: `import { generateSecret, generateURI } from 'otplib'`
- `generateURI()` requires lowercase `algorithm: 'sha1'` (not `'SHA1'`)
- TOTP **verification** uses the custom `verifyTOTP()` from `lib/auth/totp.ts`, NOT otplib

### Prisma JSON Fields

- Filter JSON nulls with `Prisma.DbNull`, not `null`: `layout: { not: Prisma.DbNull }`
- Cast JSON values through `unknown`: `classroom.layout as unknown as LayoutData`

### Stripe

- `stripe@22.x` is installed and CSP allows `js.stripe.com` / `uploadthing.com` — but **the Stripe integration is deferred** per business decision (audit 10a). Do not assume payment endpoints are wired; current payments flow is wallet/manual-proof based (`lib/wallet/*`, `lib/payments/verification.ts`). Leave the SDK in place — it's the planned future provider.

## Build & Deploy

- `output: 'standalone'` in `next.config.ts` (Docker/standalone builds)
- Security headers applied globally (X-Frame-Options, CSP, HSTS, etc.)
- `next.config.ts` has permanent redirects for legacy course URLs → new nested paths

## Verification

- `bun run type-check` — no errors expected. If `dashboard/page.tsx` regresses, check the cards array shape against `MetricCard` props (historical breakage point).
- `bun run test --run` — Vitest suite (102 tests baseline at time of writing).
- `bun run lint` — ESLint; not in pre-commit or pre-push, run manually before PR.
- `bun run build` — full production build; required to catch the `formatCurrency` client-import trap (see *Code Conventions › Imports*).
