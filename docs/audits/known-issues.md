# Known Issues & Pending Fixes

This document tracks persistent issues and bugs that are not yet fully resolved.

## 🔧 TypeScript & ESLint Status (2026-09-07)

**TypeScript**: 0 errors (`bun run type-check` exits 0). All remaining `RouteHandler`/`RouteContext` type drift from the `withErrorHandler` wrapper was resolved in commit `02717b1e` (31 files). Previously tracked `lib/pools/types.ts` `PoolJoinResult` types, `lib/exams/attendance.ts` `MembershipStatus` import, `lib/withdrawal/actions.ts` `WithdrawalStatus` import, and `lib/analytics/*.ts` proper types are all fixed.

**ESLint**: 0 errors. Bulk cleanup in commit `8e43423c` replaced `<img>` with `next/image`, removed stale `eslint-disable` comments, and fixed hooks warnings across ~120 files. Tests are excluded from ESLint scans per `eslint.config.mjs`.

**Remaining warnings** (17, non-blocking — `bun run lint` exits 0):

| File | Count | Rule |
|------|-------|------|
| `app/staff/exams/events/create/page.tsx` | 11 | `@typescript-eslint/no-explicit-any` |
| `app/staff/exams/events/[id]/edit/_components/EditExamEventForm.tsx` | 8 | `@typescript-eslint/no-explicit-any` |
| `lib/withdrawal/actions.ts:6` | 1 | `@typescript-eslint/no-unused-vars` (`Prisma` import) |

The `no-explicit-any` rule remains at `'warn'` severity (not `'error'`), so these do not fail lint. The 2026-09-04 audit's Phase 1 Week 4 item (upgrade rule to `'error'` + full sweep) is complete for the bulk of the codebase; these 19 warnings in 2 files are the residual.

## 🖼️ Logo Aspect Ratio & CSS Warnings — RESOLVED (2026-05-20)

**Was**: The AATA Logo triggered hydration / layout warnings in `not-found.tsx`, `loading.tsx`, and `(auth)/layout.tsx` because each call site mixed `<Image width/height>` with `style={{ width: 'auto', height: 'auto' }}`.

**Resolution**: Centralised on `components/shared/Logo.tsx` — a single component that passes the intrinsic 700×156 dimensions and lets className-based sizing handle the rest (no inline `style`). Every entry point (auth error/not-found, root error/not-found, root loading, `(auth)` layout, DashboardSidebar, PublicNav) now uses it.

## 🐢 Dashboard Analytics Latency

**Problem**: Initial load of `/staff/reports` was slow (up to 75s in dev).

- **Root cause** (production): `lib/analytics/metrics.ts` used the RLS-wrapped `prisma` client even though staff pages are already auth-gated. Every count/aggregate paid a per-query `BEGIN/SET LOCAL/COMMIT` round-trip.
- **Root cause** (dev): Turbopack compile-on-demand for the 1427-line `app/staff/reports/page.tsx` dominates the first hit (~16.8s of `next.js:` time in the user's logs).
- **Resolution applied**:
  1. Switched `lib/analytics/metrics.ts` to `prismaUnfiltered as prisma` (no RLS overhead).
  2. Added composite index `Enrollment(@@index([status, enrolledAt]))` for the analytics window queries.
  3. Replaced bare `next/dynamic` chart imports with placeholders (`loading: () => <div style={{height:N}}>`) so Recharts always sees non-zero parent dimensions — silences the `width(-1) height(-1)` console warnings.
- **Still slow in dev**: a follow-up refactor would split the single-page reports into one segment per tab so Turbopack only compiles the active tab. Not blocking production.

## ✉️ Email Verification Delays — HARDENED (2026-05-20)

**Was**: Some users reported delays in receiving the `verifyToken` email.

- **Root cause hypothesis**: Resend transient errors (429 rate limit, 5xx, network) were retried zero times — a single failure meant no email.
- **Resolution applied**:
  1. `lib/email/sender.ts` now retries up to 3 times with exponential backoff (300ms → 600ms → 1200ms) for retryable errors (429, 5xx, ECONN*, fetch failed).
  2. Every send (success or failure) is logged to the new `EmailDelivery` table — visible in **Settings → Email Delivery** so admins can spot patterns without tailing server logs.
  3. New `EmailOptions.template` + `EmailOptions.userId` fields tag each send for filtering in the admin view.
  4. Dashboard alert fires when ≥1 email fails in the last 24h (CRITICAL at ≥10).
- **Remaining**: deliverability problems at the recipient's mail provider (SPF/DKIM, spam folder) are outside the app's control — see the admin Email Delivery tab for evidence of attempted delivery.

## 📄 UploadThing Feedback — RESOLVED (2026-05-20)

**Was**: The file picker sometimes reset or didn't show a clear "Uploaded" state until the user interacted with the form.

**Resolution**: `components/shared/FileField.tsx` wraps `UploadButton` with explicit `empty → uploading → uploaded` states, a remove button, a view-file link, and an error-display surface. New consumers just pass `value` / `onChange`.

## 🧩 Prisma Enums vs DB Enums

**Problem**: Occasional mismatches between Prisma-defined enums and existing database enums.

- **Fix Strategy**: Use the `migrate_enums.js` script to manually synchronize enums if `prisma migrate dev` fails.

## 🔗 Database Connection Safety

**Problem**: Cold starts or high concurrent traffic can lead to Prisma connection timeouts.

- **Symptoms**: `P2028: Transaction API error: Transaction already closed` or generic timeout errors during payment/booking.
- **Status**: Mitigated by increasing `$transaction` timeout to 30s and implementing robust error handling in `chargeWallet` and `joinPool` services.

## ⚠️ Database Adapter — DO NOT switch to @prisma/adapter-neon

**Problem**: Commit b0b5e73 switched from `@prisma/adapter-pg` to `@prisma/adapter-neon` + `ws`, which broke all Vercel runtime DB connections.

- **Root Cause**: The `ws` WebSocket module does not work in Vercel's Turbopack serverless bundles. The Neon serverless adapter is designed for edge/Cloudflare Workers environments, not Node.js serverless.
- **Resolution**: Reverted to `@prisma/adapter-pg` with standard `pg` Pool in commit 6ed1cd9.
- **Rule**: Always use `@prisma/adapter-pg` for production. Test any adapter changes against a live Vercel deployment before merging.

## Local Development Neon TCP Timeouts

**Problem**: On some local networks, `pg` TCP connections to Neon can hang until the connection timeout even when the Neon HTTP/WebSocket driver works and Vercel remains healthy.

- **Resolution**: `next dev` dynamically uses the Neon WebSocket Prisma adapter for `*.neon.tech` URLs, while production keeps `@prisma/adapter-pg`.
- **Rule**: Keep this as a development-only exception. Do not import/configure `ws` for Vercel runtime, and use `AEROJET_LOCAL_DB_ADAPTER=pg` if local testing specifically needs the standard `pg` adapter.

## 🛡️ Missing Error Boundaries — RESOLVED (2026-05-20)

**Was**: The (auth) route segment had no `error.tsx`, and (auth)/(portal) had no `not-found.tsx`.

- **Impact (historical)**: Auth flow errors showed raw Next.js error pages instead of branded error UI.
- **Resolution**: Every portal segment (staff, student, instructor, applicant, examiner) now has a branded `not-found.tsx`. The examiner segment also gained `error.tsx`. `(auth)` already had both before this audit.

## ⚡ Client/Server Import Boundary

**Problem**: `@/lib/analytics/metrics` re-exports `formatCurrency` but imports `prisma`, creating a transitive server dependency. Client components importing from this module will fail with `Can't resolve 'async_hooks'`.

- **Rule**: Client components must import `formatCurrency` from `@/lib/currency` (client-safe), never from `@/lib/analytics/metrics`.
- **Status**: Resolved in v1.4.0 for `ReportsPanel.tsx`. Pattern documented here to prevent recurrence.

## 🔑 otplib v13 API

**Problem**: The project uses `otplib` v13 which has a different API from earlier versions. Only used for secret/URI generation.

- **Rule**: Always use named imports: `import { generateSecret, generateURI } from 'otplib'`. Use lowercase `algorithm: 'sha1'` (not `'SHA1'`). TOTP **verification** uses the custom `verifyTOTP()` from `lib/auth/totp.ts` (timing-safe comparison, replay protection via counter tracking), NOT otplib.
- **Status**: Resolved in v1.5.0. Documented here to prevent recurrence if adding new TOTP features.

## 🎨 Tailwind v4 Config Bridge

**Status**: The project uses Tailwind CSS v4 with the `@config '../tailwind.config.ts'` compatibility bridge in `globals.css`. This is the officially supported migration path and works correctly.

- **Full CSS-first migration** (moving all `theme.extend` values to `@theme {}` blocks in CSS) is optional and low priority. The current setup is stable and the config bridge has no performance overhead.
- **When to migrate**: Only consider if dropping `tailwind.config.ts` entirely becomes necessary (e.g., for CSS-only theming tooling). The `@config` approach will remain supported through the v4 lifecycle.

## 📐 Prisma JSON Field Null Filtering

**Problem**: Filtering Prisma JSON fields with `{ not: null }` produces a TypeScript error: `Type 'null' is not assignable to type 'InputJsonValue | JsonNullValueFilter'`.

- **Rule**: Use `Prisma.DbNull` instead of `null` when filtering JSON fields: `layout: { not: Prisma.DbNull }`. Requires `import { Prisma } from '@prisma/client'`.
- **Status**: Applied in exam seating query (v1.5.0). Documented here to prevent recurrence.
