# Performance Audit Findings — Session 2026-05-05/06

## Status: Build passes, all structural fixes deployed

---

## Completed Fixes

### Tier 1 (Critical) — ALL DONE
- [x] staff/users/[id] — slug lookup via SQL, prismaUnfiltered, Promise.all
- [x] staff/students/[id] — slug lookup via SQL, prismaUnfiltered, 7 queries → Promise.all
- [x] student/layout — 5 queries → Promise.all, prismaUnfiltered
- [x] applicant/layout — 4 queries → 1 consolidated query
- [x] staff/audit-logs — 9 entity label queries → Promise.all

### Tier 2 (High Impact) — ALL DONE
- [x] lib/cached-queries.ts — created with 6 cached reference data functions
- [x] lib/settings.ts — cached getSystemSetting + getPaymentSplitConfig
- [x] 111 loading.tsx files created across all portals
- [x] staff/reports — 7 chart components → next/dynamic lazy load
- [x] staff/dashboard — RevenueChart → next/dynamic
- [x] staff/scheduling — 4 queries → Promise.all + cached helpers
- [x] student/page — merged double user query, parallelized

### Tier 3 (Medium) — ALL DONE
- [x] 7 fix_*.ts scripts deleted from root
- [x] react-hot-toast removed from package.json, migrated to sonner in 7 files
- [x] 8 unused deps removed (three, shadergradient, styled-components, bufferutil, utf-8-validate, ws, @types/ws)
- [x] N+1 in bulk-send-credentials — batch fetch with Map
- [x] N+1 in enrollments/batch — .find() → Map lookup
- [x] N+1 in cron/send-reminders — parallel emails, batch createMany notifications
- [x] Calendar megaquery — scoped examPool to user's pools, examEvents to future only
- [x] 6 unbounded API routes capped (programmes, newsroom paginated, course-categories, applicant/courses, student/courses+grades, exam-components)
- [x] 82+ staff API routes switched to prismaUnfiltered

### Tier 4 (Low) — DONE
- [x] next.config.ts — output: 'standalone', image cache TTL 60→3600
- [x] AppTour — fixed missing #sidebar-nav ID, linter fixed TS errors with react-joyride v3

### Build Fixes
- [x] 6 public pages force-dynamic (/, /admissions, /fees-and-payment, /online-application-terms, /newsroom, /newsroom/[slug])

---

## Structural Review Fixes (Session 2026-05-06)

### P0 — Security (DONE)
- [x] **Unprotected cron POST** — Added CRON_SECRET auth check to milestone-reminders POST handler
- [x] **Race condition** — Wrapped top-up check-then-create in Serializable transaction with duplicate detection

### P1 — Maintainability (DONE)
- [x] **Extract duplicate promotion logic** — Created `promoteIfFirstExamActivity()` and `upgradeRoleInTransaction()` in lib/enrollment/pathway.ts. Replaced 5 inline copies across book-exam, join-pool, bundles, full-time, tuition
- [x] **Payment splits to SystemSettings** — Moved 40/30/30 and 50/50 splits from hardcoded values to `getPaymentSplitConfig()` in lib/settings.ts, loaded from SystemSetting table with admin-editable defaults
- [x] **Zod validation** — Added schemas (`charterBookingSchema`, `mergePoolsSchema`, `attachProofSchema`, `staffBookExamSchema`) and applied to charter, merge, wallet-proof, staff book-exam routes. Also modernized charter and merge routes to use `withErrorHandler` + `requireStaff()`
- [x] **Dynamic NewsMarkdownEditor** — Switched to `next/dynamic` with `ssr: false` in newsroom/create and newsroom/[id]/edit (681-line TipTap component no longer in initial bundle)

### Infrastructure Fix
- [x] **Vercel DB connection failure** — Restored `@prisma/adapter-pg` (standard PostgreSQL driver). Commit b0b5e73 had switched to `@prisma/adapter-neon` + `ws` which doesn't work in Vercel serverless bundles. The `ws` WebSocket module cannot be properly bundled by Turbopack for serverless environments.

---

## Financial System Stabilization (Session 2026-05-06)

### Fix 1 — Raw Database IDs in Financial Transactions (DONE)
- [x] Refactored `getReferenceDisplay()` to generate human-readable references: `ENR-XXXX`, `EXM-XXXX`, `PAY-XXXX` instead of raw CUIDs

### Fix 2 — Raw Student IDs in Audit Logs (DONE)
- [x] Added profile lookups before audit logging in `actions.ts`, `exam-record/route.ts`, `book-exam/route.ts`
- [x] Added ExamBooking/ExamResult entity label resolution in `audit-logs/page.tsx`

### Fix 3 — Transactions Table Pagination & Sorting (DONE)
- [x] Created `GET /api/staff/finance/transactions` with `page`, `limit`, `sortBy`, `sortDir`, `query` params
- [x] Created `TransactionsTable` client component with server-side pagination and sortable columns

### Fix 4 — EXAMINER Role Update 400 Error (DONE)
- [x] Added `EXAMINER` to Zod `updateRoleSchema` enum in `staff/users/[id]/role/route.ts`
- [x] Auto-creates InstructorProfile with `EX-` prefix when assigning EXAMINER role

### Fix 5 — Chart Rendering Warnings (DONE)
- [x] Added `minWidth={0} minHeight={0}` to all 8 `ResponsiveContainer` instances across charts

### Fix 6 — Historical Financial Filtering & Reports Export (DONE)
- [x] Added `year`/`month` params to `getFinanceReportSummary()` and `getMonthlyRevenueData()` in `lib/analytics/reports.ts`
- [x] Created `GET /api/staff/finance/reports` — filterable reports API
- [x] Created `GET /api/staff/finance/reports/export` — premium HTML report with Print/Save-as-PDF
- [x] Created `ReportsPanel` client component with year/month selectors and export buttons

---

## Remaining (P2/P3 — backlog)

### P2 — Structure
- [ ] Break up long functions — getDashboardData (183 lines), UsersTable (380 lines)
- [ ] Add error.tsx in (auth) segment
- [ ] Add not-found.tsx in (auth) and (portal) segments
- [ ] Remove dead config — 4 unused font families in tailwind.config.ts, trackEvent in analytics

### P3 — Polish
- [ ] Centralize hardcoded values — pool magic numbers, email addresses, status arrays
- [ ] Replace `<img>` with next/image — 2 instances in newsroom create page
- [ ] Rate limiting — resend-verification and submit-payment-proof routes

---

## Key Lessons Learned

1. **Never switch database adapters without Vercel testing** — `@prisma/adapter-neon` + `ws` works locally but fails in Vercel serverless. Stick with `@prisma/adapter-pg` for production.
2. **`force-dynamic` on public pages** — Required when pages call DB functions (like `getRegistrationFeeInfo`), otherwise Next.js tries to query the DB at build time.
3. **Promotion logic must be centralized** — 5 copies of applicant-to-student promotion across different routes is a maintenance hazard. Now consolidated to 2 helpers in `lib/enrollment/pathway.ts`.
4. **Payment splits should be admin-editable** — Business rules like 40/30/30 splits belong in SystemSettings, not hardcoded. Pattern established in `lib/pools/pricing-config.ts` already existed.
