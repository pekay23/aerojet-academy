# Structural Review — 2026-05-06

## Status: P0 + P1 COMPLETE — P2/P3 backlog

## Prioritized Action Plan

### P0 — Security (DONE)
1. ~~**Unprotected cron POST**~~ — ✅ Added CRON_SECRET auth to milestone-reminders POST handler
2. ~~**Race condition**~~ — ✅ Wrapped top-up in Serializable transaction with duplicate detection

### P1 — Maintainability (DONE)
3. ~~**Extract duplicate logic**~~ — ✅ Created `promoteIfFirstExamActivity()` + `upgradeRoleInTransaction()`, replaced 5 copies
4. ~~**Hardcoded business rules**~~ — ✅ Payment splits moved to SystemSettings via `getPaymentSplitConfig()`
5. ~~**Add Zod validation**~~ — ✅ Added schemas for charter, merge, wallet-proof, book-exam routes
6. ~~**Dynamic import NewsMarkdownEditor**~~ — ✅ Switched to `next/dynamic` with `ssr: false` in 2 pages

### P2 — Structure (mostly resolved 2026-05-20)
7. **Break up long functions** — getDashboardData (183 lines), book-exam POST (239 lines), UsersTable (380 lines) — STILL OPEN (low priority, cosmetic)
8. ~~**Add error.tsx**~~ — ✅ `(auth)/error.tsx` already exists; `app/examiner/error.tsx` added 2026-05-20
9. ~~**Add not-found.tsx**~~ — ✅ All five portals (staff/student/instructor/applicant/examiner) and `(auth)` + `(public)` now have branded `not-found.tsx`
10. ~~**Remove dead config**~~ — ✅ Tailwind font families already pruned (only `sans`, `outfit`, `heading` remain). `trackEvent` still in `lib/analytics/events.ts` but is a minimal stub; leave for now

### P3 — Polish (resolved 2026-05-20)
11. **Centralize hardcoded values** — partial; non-blocking
12. ~~**Replace `<img>` with next/image**~~ — ✅ newsroom `[id]/edit/page.tsx` (the actual location, not `create`) now uses `next/image` with `fill` + `sizes`. Remaining `<img>` tags in admin tables / TwoFactor QR / export HTML are intentional (small avatars / data URIs / server-rendered HTML)
13. ~~**Rate limiting**~~ — ✅ both `resend-verification` ([app/api/auth/resend-verification/route.ts:12](../../app/api/auth/resend-verification/route.ts#L12)) and `submit-payment-proof` ([app/api/public/submit-payment-proof/route.ts:9-12](../../app/api/public/submit-payment-proof/route.ts#L9-L12)) rate-limited

---

## Infrastructure Issue Resolved

### Vercel Database Connection Failure (commit b0b5e73 → 6ed1cd9)
- **Root cause:** Commit b0b5e73 switched `lib/prisma/db-base.ts` from `@prisma/adapter-pg` (standard PostgreSQL TCP driver) to `@prisma/adapter-neon` (Neon serverless WebSocket driver). The `ws` Node.js WebSocket module cannot be properly bundled by Turbopack for Vercel's serverless environment, causing "No database host or connection string was set" errors at runtime.
- **Fix:** Restored `@prisma/adapter-pg` with `pg` Pool — the proven working configuration.
- **Lesson:** Always test database adapter changes against a Vercel deployment before merging. The Neon serverless adapter is designed for edge/Cloudflare Workers, not Node.js serverless functions that have native TCP access.

---

## 1. Long Functions & Hardcoded Values (COMPLETE)

### Long Functions (50+ lines) — HIGH
| File | Function | Lines | Issue |
|------|----------|-------|-------|
| staff/dashboard/page.tsx | getDashboardData() | ~183 | Monolithic data fetching + aggregation |
| api/applicant/exam-only/book-exam/route.ts | POST() | ~239 | Two booking flows (simplified with shared promotion helper) |
| staff/_components/UsersTable.tsx | UsersTable() | ~380 | State + filtering + pagination + rendering |
| staff/exams/events/create/page.tsx | CreateExamEventPage() | ~270 | Form + validation + UI mixed |
| staff/reports/page.tsx | OverviewTab() | ~115 | Complex conditional rendering |

### Hardcoded Values — RESOLVED
- ~~lib/enrollment/full-time.ts: 40%/30%/30% payment split~~ — ✅ Moved to SystemSettings (`ft_y1_seat_pct`, `ft_y1_sem1_pct`, etc.)
- api/applicant/exam-only/book-exam/route.ts: 21-day deadline, 28 max candidates — loaded from `getExamPricingConfig()` (already configurable)
- api/public/contact/route.ts: noreply@aerojet-academy.com — low priority
- staff/dashboard/page.tsx: 6-month period — low priority

### Duplicate Logic — RESOLVED
- ~~Applicant-to-student promotion: 5+ copies~~ — ✅ Consolidated to `promoteIfFirstExamActivity()` and `upgradeRoleInTransaction()` in lib/enrollment/pathway.ts
- Exam event creation: duplicated within book-exam route — P2 backlog
- ~~Auth checks: manual session + role check~~ — ✅ Charter and merge routes now use `withErrorHandler` + `requireStaff()`
- Pool status arrays: repeated in 3+ files — P3 backlog
- Wallet balance validation: identical pattern in 3+ files — P3 backlog

## 2. Dead Code & Unused Exports (COMPLETE)

### Minimal dead code found (~0.77% of exports)

**Only genuine dead export:**
- lib/analytics/events.ts — `trackEvent()` function + `AnalyticsEvent` type (27 lines) never imported anywhere. Planned analytics infrastructure that was never wired up.

**Dead Tailwind config (from bundle audit):**
- tailwind.config.ts — 4 font families (Lexend, Montserrat, Playfair, Cal Sans/heading) defined but never loaded via next/font and never used in any component.

**Potentially obsolete:**
- lib/students/promotion.ts — `promoteToStudent()` is no longer imported by any route after join-pool was migrated to `promoteIfFirstExamActivity()`. Only referenced by its own barrel export (lib/students/index.ts). Can be removed.

**Everything else confirmed in use** — lib/utils (21 functions, 71+ files), lib/pools (13 re-exports), all components, all API routes.

## 3. Bundle Size & Loading Patterns (COMPLETE)

### Overall: Mostly Green

**Resolved:**
- ~~NewsMarkdownEditor (681 lines, @tiptap deps) imported statically in 2 pages~~ — ✅ Now uses `next/dynamic` with `ssr: false`

**Dead Tailwind font config:**
- tailwind.config.ts defines 4 font families (Lexend, Montserrat, Playfair, Cal Sans / heading) that are never loaded via next/font and never used in any component. Dead config that should be removed.

**Minor:**
- 2x `<img>` tags in newsroom/create/page.tsx instead of next/image (preview images)

**Good practices confirmed:**
- All date-fns imports are specific (not monolithic)
- All lucide-react imports are specific icons
- next/font with display:swap for Inter + Outfit
- AVIF + WebP image formats enabled
- No synchronous third-party scripts
- No `import *` patterns for heavy libraries
- All 'use client' files under 200 lines

## 4. Low-Coverage & Security Risks (COMPLETE)

### CRITICAL — RESOLVED
1. ~~**api/cron/milestone-reminders/route.ts:170**~~ — ✅ POST handler now has CRON_SECRET auth check
2. ~~**api/applicant/exam-only/top-up/route.ts:42-57**~~ — ✅ Wrapped in Serializable transaction

### HIGH — RESOLVED
3. ~~**Missing error.tsx** in (auth) segment~~ — ✅ resolved (see P2.8 above); `(auth)/error.tsx` exists
4. ~~**api/staff/exam-pools/charter/route.ts**~~ — ✅ Now uses Zod `charterBookingSchema` + `withErrorHandler`
5. ~~**Missing not-found.tsx** in (auth) and (portal) segments~~ — ✅ resolved (see P2.9 above); all 5 portals + `(auth)` + `(public)` covered

### MEDIUM — RESOLVED
6. ~~**api/staff/exam-pools/merge/route.ts**~~ — ✅ Now uses Zod `mergePoolsSchema` with CUID validation
7. ~~**api/auth/resend-verification/route.ts** — No rate limiting~~ — ✅ rate-limited to 3/hour per IP, uniform response prevents enumeration (see [architecture/security.md](../architecture/security.md))
8. ~~**api/public/submit-payment-proof/route.ts** — No rate limiting~~ — ✅ rate-limited to 5/hour per IP (see [architecture/security.md](../architecture/security.md))
9. ~~**api/staff/students/[id]/wallet/[txnId]/proof/route.ts**~~ — ✅ Now uses Zod `attachProofSchema` instead of unsafe type assertion
10. ~~**api/staff/students/[id]/book-exam/route.ts**~~ — ✅ Now uses Zod `staffBookExamSchema`

### Good practices confirmed
- No dangerouslySetInnerHTML, eval(), or Function()
- Stripe webhook signature properly verified
- No exposed API keys in code
- NextAuth handles CSRF
- Proper transaction usage in enrollment/pool operations
