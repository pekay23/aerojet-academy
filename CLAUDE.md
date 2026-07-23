# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js 16 App Router aviation training academy portal with 5 role-based portals: Staff, Student, Instructor, Applicant, Examiner.
Prisma ORM, Neon PostgreSQL, NextAuth.js sessions, Vercel deployment. Package manager: **bun**.

## Common Commands

```bash
bun dev              # Start dev server with Turbopack & 3GB RAM limit
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

1. **Edge proxy** at `proxy.ts:37` (active — renamed from `middleware.ts` per Next.js 16) — `ROUTE_ROLE_MAP` gates `/staff`, `/instructor`, `/student`, `/examiner`, `/applicant` and their `/api/*` siblings. Unauthenticated users get redirected to `/login?callbackUrl=…` (pages) or `401 JSON` (API). Wrong-role users get redirected to their own portal (e.g. STUDENT hitting `/staff` → `/student`). Build output shows it as `ƒ Proxy (Middleware)`.
2. **Portal layouts** — each portal's `layout.tsx` calls `requireStaff`/`requireInstructor`/`requireStudent`/etc. from `lib/auth/helpers.ts` as a second check and to pass `session.user` into the tree.
3. **Route handlers / server actions** — call `requireAdmin()`/`requireAuth()`/etc. directly; thrown `'Unauthorized'`/`'Forbidden'` strings are caught by `withErrorHandler` and converted to 401/403.

> Helper utilities at `lib/auth/middleware-helpers.ts` and `utils/supabase/middleware.ts` are NOT wired into the active proxy — they're available for ad-hoc use.

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

- `lib/email/sender.ts` — `sendEmail()`, `sendBulkEmails()`. Falls back to `console.log` when `RESEND_API_KEY` is not set (dev mode). Has 3-attempt exponential backoff (300ms / 600ms / 1200ms) for transient errors (429, 5xx, ECONN\*, fetch failed).
- Default sender pulled from `EMAIL_ADDRESSES.fromTransactional` in `lib/constants/business-rules.ts` → `Aerojet Academy <admissions@mail.aerojet-academy.com>` (override via `FROM_EMAIL` env var).
- Every send writes an `EmailDelivery` row with status / attempts / error — see **Email Delivery Log** below.

### File Uploads (UploadThing)

- Routes defined in `app/api/uploadthing/core.ts` with role-based auth
- Client helpers: `UploadButton`, `UploadDropzone` from `lib/uploads/uploadthing.ts`
- Remote image domains configured in `next.config.ts` (`utfs.io`, `*.ufs.sh`, `uploadthing.com`)

### Image Proxy & Protected Images

Two auth-gated API routes serve protected images through authenticated endpoints:

- **`GET /api/images/proxy`** — Auth-gated image proxy. Validates session, checks optional scope-based permissions (`students`, `resources`, `staff`, `profile-photos`), fetches via the active storage adapter, and optionally resizes with sharp. Query params: `url` (required), `scope`, `w`, `q`.
- **`GET /api/images/transform`** — Staff-only image transformation. Same auth + scope check, then applies watermark, resize, EXIF stripping, and format conversion (webp/jpeg/png/avif). Query params: `url`, `w`, `watermark`, `strip`, `q`, `format`.

Storage adapter abstraction at `lib/storage/proxy.ts`:

```ts
export interface StorageAdapter {
  name: string
  fetch(url: string): Promise<{ data: ArrayBuffer; contentType: string }>
}
```

Active adapter selected via `STORAGE_ADAPTER` env var (defaults to `'http'`). Commented-out S3 adapter shows the pattern for Cloudflare R2 / S3 support.

URL helpers at `lib/storage/signed-url.ts`:

```ts
proxyImageUrl(imageUrl, scope?, options?)       // → /api/images/proxy?url=...
transformImageUrl(imageUrl, options?)            // → /api/images/transform?url=...
```

Client component at `components/ProtectedImage.tsx` wraps `next/image` with right-click protection, drag prevention, and an optional invisible overlay. Pass `priority` for above-the-fold images:

```tsx
<ProtectedImage src={proxyImageUrl(url, "students")} alt="Doc" width={400} height={300} priority />
<ProtectedImage src={proxyImageUrl(url)} alt="Doc" width={400} height={300} />
```

### Newsroom

Public newsroom at `/newsroom` with paginated listing and dynamic article detail pages:

- **Listing** (`app/(public)/newsroom/page.tsx`): Server component with `force-dynamic`. Query params: `?page=N&limit=N&sort=newest|oldest` (default: page=1, limit=9, sort=newest). Renders `<NewsSortControl>`, grid of `<NewsCard>`, and `<NewsPagination>`.
- **Detail** (`app/(public)/newsroom/[slug]/page.tsx`): Server component with SEO metadata (Open Graph, Twitter Cards, JSON-LD), cover image hero, view counting, read-time calculation (`Math.ceil(wordCount / 200)`), author attribution, sharing buttons.
- **Cover image fallback**: Hardcoded UploadThing URL when `article.coverImage` is null.
- **Staff management**: Create at `/staff/newsroom/create`, edit at `/staff/newsroom/[id]/edit`. Markdown editor with cover image upload, tags, custom publish dates, author attribution.
- **Seed script**: `bunx tsx prisma/seed-news-article.ts` seeds sample articles.

### Storage & Sync (Supabase secondary backend)

Supabase is a secondary backend alongside Neon, used for structured document storage and as a live replica via logical replication. Helpers — **do not duplicate**:

- `lib/supabase/client.ts` — `getSupabaseAdmin()` (service-role), `isSupabaseConfigured()`
- `lib/storage/supabase-storage.ts` — bucket `aerojet-documents`, `buildStoragePath()`, `uploadToStorage()`, `getSignedUrl()`, `documentCategoryFolder()` folder taxonomy
- `lib/storage/uploadthing-mirror.ts` — nightly mirror cron (`/api/cron/supabase-mirror`) copies UploadThing files into the Supabase bucket
- `lib/supabase/sync-check.ts` — weekly drift detector (`/api/cron/sync-check`); raises an AuditLog if Neon ↔ Supabase row counts diverge > 0.1%
- `lib/supabase/backup.ts` — active; invoked by the `/api/cron/backup` daily job
- `lib/supabase/dual-write.ts`, `lib/prisma/supabase-sync-extension.ts` — dormant (no callers); kept as fallback if logical replication ever needs disabling
- Schema mirroring: `bun run db:push:supabase` runs `scripts/sync-supabase-schema.mjs`; `postdb:push` chains it so every `db:push` keeps Supabase in lock-step
- Setup runbook: `docs/guides/neon-supabase-logical-replication.md` (8-step quickstart)

Used today by Document Vault (`app/staff/documents/`), Teaching Materials (`app/instructor/materials/`), and the realtime messages stream (see **Realtime messaging** below).

### Audit Logging

Every privileged mutation (role changes, refunds, withdrawals, certificate releases, permission grants) writes through `lib/audit/logger.ts`:

```ts
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

await createAuditLog({
  action: AuditAction.USER_ROLE_CHANGED,
  userId: actor.id,
  targetUserId: target.id,
  description: 'STUDENT → INSTRUCTOR', // human summary (NOT `metadata:`)
  changes: { before: { role: 'STUDENT' }, after: { role: 'INSTRUCTOR' } },
})
```

Field names trip people up: it's `description:` (string) and `changes:` (object diff), **not** `metadata:`. Query via `queryAuditLogs()`; retention sweep at `/api/cron/cleanup-audit-logs`.

### Cron Jobs

Registered in `vercel.json` and live under `app/api/cron/*/route.ts`. Pattern: check `CRON_SECRET` header → run job → return JSON. **16 jobs currently scheduled (UTC):**

| Path                         | Schedule                                                  |
| ---------------------------- | --------------------------------------------------------- |
| `expire-bundles`             | `0 0 * * *` (daily 00:00)                                 |
| `cleanup-audit-logs`         | `0 0 1 * *` (1st of month)                                |
| `check-events`               | `0 1 * * *`                                               |
| `check-pools`                | `0 2 * * *`                                               |
| `gdpr-retention`             | `0 3 * * 1` (Mondays 03:00) — GDPR retention sweep        |
| `payment-deadlines`          | `0 3 * * *`                                               |
| `backup`                     | `0 4 * * *`                                               |
| `sync-check`                 | `0 4 * * 1` (Mondays 04:00) — Neon ↔ Supabase drift check |
| `supabase-mirror`            | `30 4 * * *` — UploadThing → Supabase storage mirror      |
| `cleanup-abandoned-accounts` | `0 5 * * *`                                               |
| `scheduled-reports`          | `0 8 * * 1` (Mondays 08:00)                               |
| `milestone-reminders`        | `0 9 * * *`                                               |
| `send-reminders`             | `0 10 * * *`                                              |
| `aptitude-reminders`         | `0 11 * * *`                                              |
| `interview-reminders`        | `0 12 * * *`                                              |
| `modular-deadlines`          | `0 13 * * *`                                              |

To add a cron: create the route, gate with `CRON_SECRET`, then append to `vercel.json`. Every cron should write a single AuditLog row when it does meaningful work so admins can see the run history.

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

## Centralised constants

Don't sprinkle hardcoded business rules. `lib/constants/business-rules.ts` is the canonical source for:

- `ACADEMIC_RULES` — EASA pass mark, grade thresholds, default class sizes
- `POOL_DEFAULTS` — confirm threshold, max candidates, seat price, payment deadlines
- `EMAIL_ADDRESSES` — every outbound `from:` address (`fromTransactional`, `fromNoReply`, `support`, `admissions`)
- `WALLET_DEFAULTS` — currency, resit fee
- `TIME_WINDOWS` — GDPR DSR SLA, attendance threshold, bundle expiry, exam cutoff

Many of these are also editable at runtime via `SystemSetting` rows; the constants are the build-time defaults consumed when the row is absent. Extend the file rather than dropping new magic numbers into feature code.

## Email Delivery Log

Every `sendEmail()` invocation writes an `EmailDelivery` row (`recipient`, `subject`, `template`, `status`, `attempts`, `error`, `messageId`). Visible to admins at **Settings → Email Delivery** with status filtering, recipient search, and pagination. A dashboard alert fires when ≥ 1 send fails in the last 24h (CRITICAL at ≥ 10).

When sending email, pass the optional `template` (e.g. `'welcome'`, `'password-reset'`) and `userId` fields so the log is filterable per template / per user:

```ts
await sendEmail({
  to: user.email,
  subject: 'Welcome to Aerojet Academy',
  html: renderWelcomeEmail(user),
  template: 'welcome',
  userId: user.id,
})
```

Do **not** roll your own logging — `sender.ts` already records the row regardless of success or failure.

## Presence + Privacy

Every authenticated portal layout mounts `<Heartbeat>` (`components/shared/Heartbeat.tsx`), which pings `POST /api/me/heartbeat` every 30 seconds while the tab is visible. The endpoint updates `User.lastSeenAt`. Visibility downstream is enforced by `lib/presence.ts:resolvePresenceForViewer()`:

- **Green online dot** — always visible (binary; updates if `lastSeenAt > now - 90s`)
- **Exact last-seen timestamp** — visible to self, to staff/admin/super_admin, or to peers when the target has opted in (`User.showLastSeen = true`)

UI helpers:

- `<PresencePill peerId>` — drop next to a peer's name in any thread
- `<PrivacyToggle>` — self-service "show my last-seen" switch (`PATCH /api/me/privacy`)
- `<AdminPrivacyToggle>` — admin override per user (`PATCH /api/staff/users/[id]/privacy`, audit-logged)

When adding new messaging surfaces, reuse `<PresencePill>` — it batches presence fetches across mounted instances to one request per 20ms window.

## Realtime Messaging

In-app messages stream via Supabase Realtime (which piggybacks on the logical-replication data stream from Neon → Supabase). The wiring lives in three pieces:

- `lib/realtime/client.ts` — singleton `createBrowserClient` for Realtime only (anon key, no session persistence)
- `hooks/useRealtimeMessages.ts` — subscribes to `messages` `INSERT`/`UPDATE` events, calls `router.refresh()` + shows toast
- `components/shared/MessagesRealtime.tsx` — UI-less mount point; already dropped into `/student/messages` and `/staff/messages`

**Critical gotcha**: the Realtime filter uses `recipientId=eq.<userId>` — the actual Postgres column name (camelCase, because Prisma keeps field names verbatim without `@map`). Don't be tempted to write `recipient_id` — Supabase will silently match nothing.

One-time setup: Supabase Console → **Database → Tables → messages → Enable Realtime** (NOT the Replication tab — that's for the inbound subscription only). The hook falls back to the 20-60s `AutoRefresh` polling when Supabase isn't configured, so dev/CI without env vars degrades gracefully.

## RBAC

`requirePermission(key)` in `lib/auth/permissions.ts` consults the DB-backed registry at `lib/auth/permission-registry.ts`:

1. `Permission` table — canonical `{ key, label, description, category, isSystem }` rows
2. `RoleGrant` table — grants scoped to `ROLE:STAFF` or `USER:<id>`, with optional `expiresAt`
3. Legacy `StaffProfile.permissions` JSON array — honoured for back-compat

ADMIN and SUPER_ADMIN bypass all checks. Everyone else needs an explicit grant. Cached per (userId, role) for 60 seconds via `unstable_cache`; bust with `invalidatePermissionsFor(userId)` or `invalidateRolePermissions(role)` after any grant change.

`requirePermission` accepts **any string** — pass a `PERMISSIONS` enum value for compile-time safety, or a runtime-added custom key created via `/staff/admin/permissions`. New permissions don't need code changes to work; the seed list in `permission-registry.ts:SEED_PERMISSIONS` covers the bundled ones.

Declarative route bindings live in `lib/auth/permission-routes.ts` — documentation-grade list of which permission gates which API prefix. Handler-side `requirePermission()` calls remain authoritative; divergence from the table is a code-review red flag.

## Scheduling & GDPR

**Scheduling conflicts** — `lib/scheduling/recurrence.ts` expands a `Class` (with `recurrenceType`/`recurrenceDays`/`recurrenceUntil`) into individual occurrences within a date window. `lib/scheduling/conflicts.ts:findConflicts()` returns instructor + classroom overlaps. UI at `/staff/timetable/conflicts`. The class-POST endpoint (`app/api/staff/classes/route.ts`) returns `409` with `conflicts[]` on overlap — pass `force: true` in the request body to silence.

**GDPR module** — three libraries in `lib/gdpr/`:

- `export.ts:buildUserDataExport()` — Article 15 access export (deep traversal into 25+ related models)
- `anonymise.ts:anonymiseUser()` — Article 17 erasure-via-anonymisation (PII columns overwritten with `[REDACTED]`; financial/regulatory rows stay intact for audit trail integrity)
- `retention.ts:runRetentionSweep()` — weekly sweep driven by editable `RetentionPolicy` rows; weekly cron at `/api/cron/gdpr-retention`

UI: `/staff/gdpr` (DSR queue with 30-day SLA pills), `/staff/settings/retention` (admin-edit retention defaults).

## Dashboard alerts

`lib/analytics/dashboard-alerts.ts` returns 6 cached alerts (5-min `unstable_cache` TTL): pending payments >7 days, overdue DSRs, fraud-flagged referrals, expiring bundles, mirror backlog, email failures in last 24h. Rendered by `<AlertsCenter>` at the top of `/staff/dashboard` with a 60s `router.refresh()` poll. Add new checks here rather than scattering one-off banners across the dashboard.

## Shared components inventory

`components/shared/` centralises patterns that were previously duplicated. Reach for these before writing new ones:

| Component                            | Purpose                                                                                                                                                  |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Logo`                               | Aerojet wordmark with correct intrinsic aspect ratio. Replaces every per-callsite `<Image>` config. Accepts `tone` (`onWhite`/`onDark`) and `className`. |
| `FileField`                          | Controlled file-upload input wrapping UploadThing's `UploadButton`. Explicit empty / uploading / uploaded / error states; pass `value` + `onChange`.     |
| `Heartbeat`                          | UI-less, pings `/api/me/heartbeat` every 30s. Mount once per authenticated session.                                                                      |
| `PresencePill`                       | Online dot + last-seen text next to a peer name. Batches presence fetches.                                                                               |
| `PrivacyToggle`                      | Self-service "show my last-seen" switch.                                                                                                                 |
| `AdminPrivacyToggle`                 | Per-user admin override of `showLastSeen`.                                                                                                               |
| `MessagesRealtime`                   | UI-less wrapper that mounts `useRealtimeMessages`. Drop into any messages page.                                                                          |
| `DashboardSkeleton`, `TableSkeleton` | Reusable Suspense skeletons for `loading.tsx`.                                                                                                           |

## Docs site & html-effectiveness skill

The `docs/` tree is organised into four sections — **architecture/**, **guides/**, **audits/** (date-prefixed `YYYY-MM-DD-slug.md`), **plans/** — plus **html/** which holds the generated styled HTML mirror.

- `bun run docs:html` rebuilds the mirror via `scripts/build-docs-html.mjs` (uses `marked` for MD → HTML, applies the design tokens from `.claude/skills/html-effectiveness/`).
- The HTML output is editorial — warm clay/ivory/oat palette, 500-weight headings, numbered sections — see `.claude/skills/html-effectiveness/SKILL.md` for the design language.
- When producing new visually-rich HTML (status reports, design-system pages, slide decks), invoke the **html-effectiveness** skill — it has a layout taxonomy mapping document types to reference layouts.

The canonical doc index is `docs/README.md` for humans; `docs/html/index.html` for browsers.

## Build & Deploy

- `output: 'standalone'` in `next.config.ts` (Docker/standalone builds)
- Security headers applied globally (X-Frame-Options, CSP, HSTS, etc.)
- `next.config.ts` has permanent redirects for legacy course URLs → new nested paths

## Verification

- `bun run type-check` — no errors expected.
- `bun run test --run` — Vitest suite (**102 tests** baseline).
- `bun run lint` — ESLint; not in pre-commit or pre-push, run manually before PR.
- `bun run build` — full production build; required to catch the `formatCurrency` client-import trap (see _Code Conventions › Imports_).
- `bun run docs:html` — regenerates the HTML mirror of `docs/`. Run after any markdown change you want reflected on the styled doc site.
