# Structural Review — 2026-05-06

## Status: COMPLETE — All 4 audits finished

## Prioritized Action Plan

### P0 — Security (fix immediately)
1. **Unprotected cron POST** — api/cron/milestone-reminders POST handler has no auth
2. **Race condition** — api/applicant/exam-only/top-up check-then-create without transaction

### P1 — Maintainability (fix this sprint)
3. **Extract duplicate logic** — applicant-to-student promotion (5 copies), exam event creation (2 copies)
4. **Hardcoded business rules** — payment split percentages in lib/enrollment/full-time.ts
5. **Add Zod validation** — charter, merge, wallet-proof, book-exam routes
6. **Dynamic import NewsMarkdownEditor** — 681-line TipTap component loaded synchronously in 2 pages

### P2 — Structure (plan for next sprint)
7. **Break up long functions** — getDashboardData (183 lines), book-exam POST (239 lines), UsersTable (380 lines)
8. **Add error.tsx** — missing in (auth) segment
9. **Add not-found.tsx** — missing in (auth) and (portal) segments
10. **Remove dead config** — 4 unused font families in tailwind.config.ts, trackEvent in analytics

### P3 — Polish (backlog)
11. **Centralize hardcoded values** — pool magic numbers, email addresses, status arrays
12. **Replace `<img>` with next/image** — 2 instances in newsroom create page
13. **Rate limiting** — resend-verification and submit-payment-proof routes

---

## 1. Long Functions & Hardcoded Values (COMPLETE)

### Long Functions (50+ lines) — HIGH
| File | Function | Lines | Issue |
|------|----------|-------|-------|
| staff/dashboard/page.tsx | getDashboardData() | ~183 | Monolithic data fetching + aggregation |
| api/applicant/exam-only/book-exam/route.ts | POST() | ~239 | Two booking flows with duplicate logic |
| staff/_components/UsersTable.tsx | UsersTable() | ~380 | State + filtering + pagination + rendering |
| staff/exams/events/create/page.tsx | CreateExamEventPage() | ~270 | Form + validation + UI mixed |
| staff/reports/page.tsx | OverviewTab() | ~115 | Complex conditional rendering |

### Hardcoded Values — HIGH/MEDIUM
- lib/enrollment/full-time.ts: 40%/30%/30% payment split hardcoded (should be config)
- api/applicant/exam-only/book-exam/route.ts: 21-day deadline, 28 max candidates, 520/300 prices inline
- api/public/contact/route.ts: noreply@aerojet-academy.com hardcoded
- staff/dashboard/page.tsx: 6-month period hardcoded

### Duplicate Logic — HIGH
- Applicant-to-student promotion: 5+ identical copies across book-exam, join-pool, bundles, enrollment, tuition
- Exam event creation: duplicated within book-exam route
- Auth checks: 6+ routes with manual session + role check instead of using withErrorHandler
- Pool status arrays: `['OPEN', 'DRAFT', 'NEAR_FULL', 'CONFIRMED']` repeated in 3+ files
- Wallet balance validation: identical pattern in 3+ files

## 2. Dead Code & Unused Exports (PENDING)

## 3. Bundle Size & Loading Patterns (COMPLETE)

### Overall: Mostly Green

**Only actionable issue:**
- NewsMarkdownEditor (681 lines, @tiptap deps) imported statically in 2 pages — should use `next/dynamic`
  - app/staff/newsroom/create/page.tsx:20
  - app/staff/newsroom/[id]/edit/page.tsx:21

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

### CRITICAL
1. **api/cron/milestone-reminders/route.ts:170** — POST handler has NO auth check (GET requires CRON_SECRET but POST is open)
2. **api/applicant/exam-only/top-up/route.ts:42-57** — Race condition: check-then-create payment without transaction (two simultaneous requests can both pass)

### HIGH
3. **Missing error.tsx** in (auth) segment — auth flows have no error boundary
4. **api/staff/exam-pools/charter/route.ts** — Body fields destructured without schema validation
5. **Missing not-found.tsx** in (auth) and (portal) segments

### MEDIUM
6. **api/staff/exam-pools/merge/route.ts** — No CUID format validation on pool IDs
7. **api/auth/resend-verification/route.ts** — No rate limiting, possible email enumeration
8. **api/public/submit-payment-proof/route.ts** — No rate limiting, registration code could be brute-forced
9. **api/staff/students/[id]/wallet/[txnId]/proof/route.ts** — Unsafe type assertion `as { proofUrl?: string }`
10. Multiple staff routes missing Zod schema validation (exam-sittings, book-exam, etc.)

### Good practices confirmed
- No dangerouslySetInnerHTML, eval(), or Function()
- Stripe webhook signature properly verified
- No exposed API keys in code
- NextAuth handles CSRF
- Proper transaction usage in enrollment/pool operations

## 5. Dead Code & Unused Exports (COMPLETE)

### Minimal dead code found (~0.77% of exports)

**Only genuine dead export:**
- lib/analytics/events.ts — `trackEvent()` function + `AnalyticsEvent` type (27 lines) never imported anywhere. Planned analytics infrastructure that was never wired up.

**Dead Tailwind config (from bundle audit):**
- tailwind.config.ts — 4 font families (Lexend, Montserrat, Playfair, Cal Sans/heading) defined but never loaded via next/font and never used in any component.

**Everything else confirmed in use** — lib/utils (21 functions, 71+ files), lib/pools (13 re-exports), all components, all API routes.
