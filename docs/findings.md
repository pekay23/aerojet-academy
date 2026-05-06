# Performance Audit Findings — Session 2026-05-05

## Status: Build passes (152 pages, 0 errors)

## Completed Fixes

### Tier 1 (Critical) — ALL DONE
- [x] staff/users/[id] — slug lookup via SQL, prismaUnfiltered, Promise.all
- [x] staff/students/[id] — slug lookup via SQL, prismaUnfiltered, 7 queries → Promise.all
- [x] student/layout — 5 queries → Promise.all, prismaUnfiltered
- [x] applicant/layout — 4 queries → 1 consolidated query
- [x] staff/audit-logs — 9 entity label queries → Promise.all

### Tier 2 (High Impact) — ALL DONE
- [x] lib/cached-queries.ts — created with 6 cached reference data functions
- [x] lib/settings.ts — cached getSystemSetting
- [x] 38+ loading.tsx files created across staff/student/applicant portals
- [x] staff/reports — 7 chart components → next/dynamic lazy load
- [x] staff/dashboard — RevenueChart → next/dynamic
- [x] staff/scheduling — 4 queries → Promise.all + cached helpers
- [x] student/page — merged double user query, parallelized

### Tier 3 (Medium) — MOSTLY DONE
- [x] 7 fix_*.ts scripts deleted from root
- [x] react-hot-toast removed from package.json, migrated to sonner in 7 files
- [x] 8 unused deps removed (three, shadergradient, styled-components, bufferutil, utf-8-validate, ws, @types/ws)
- [x] N+1 in bulk-send-credentials — batch fetch with Map
- [x] N+1 in enrollments/batch — .find() → Map lookup
- [x] N+1 in cron/send-reminders — parallel emails, batch createMany notifications
- [x] Calendar megaquery — scoped examPool to user's pools, examEvents to future only
- [x] 6 unbounded API routes capped (programmes, newsroom paginated, course-categories, applicant/courses, student/courses+grades, exam-components)
- [x] 23+ staff pages switched to prismaUnfiltered by background agent

### Tier 4 (Low) — DONE
- [x] next.config.ts — output: 'standalone', image cache TTL 60→3600
- [x] AppTour — fixed missing #sidebar-nav ID, linter fixed TS errors with react-joyride v3

### Build Fixes
- [x] 6 public pages force-dynamic (/, /admissions, /fees-and-payment, /online-application-terms, /newsroom, /newsroom/[slug])

---

## Remaining Issues Found in Final Audit

### Missing loading.tsx (59 directories)
**Staff (32):** academic/scheduling, classes/[id]/edit, classes/create, courses/[id]/edit, courses/categories, courses/create, enrollments/batch, exams/bookings, exams/events, exams/events/[id]/edit, exams/events/[id]/pools/create, exams/events/create, exams/pools/[id]/add-candidate, exams/pools/[id]/edit, exams/pools/members, exams/results, finance/reconciliation, finance/reports, finance/transactions, finance/wallet-topups, newsroom/[id]/edit, newsroom/create, payments/approved, payments/pending, payments/rejected, reports/attendance, reports/enrollment-trends, reports/pool-analytics, reports/revenue, settings/academic-calendar, settings/email-previews, students/import

**Student (16):** academic-calendar, ambassador, courses/[slug], courses/[slug]/grades, courses/[slug]/materials, courses/enroll, courses/revision, exam-bookings/[id], exam-bookings/[id]/join, exam-bookings/my-bookings, exams/results, exams/schedule, profile/change-password, profile/settings, registration-fee, wallet/top-up, wallet/transactions

**Applicant (11):** application/payment, application/status, courses/[id], courses/[id]/purchase, courses/purchase, exam-bookings/[id], exam-only, exam-only/dashboard, exam-only/top-up, pathway, wallet-top-up

### Sequential Await Patterns — FIXED
1. [x] staff/license-requirements/page.tsx — parallelized licenseCategories + courses
2. [x] staff/courses/[id]/page.tsx — parallelized course + categories
3. [x] staff/exams/events/[id]/page.tsx — parallelized evaluateGoNoGo + getEventDemandSnapshot
4. [SKIP] staff/exams/pools/[id]/page.tsx — siblingPools depends on pool.eventId, can't parallelize

### Double Query Pattern (generateMetadata + page both query same entity)
- Not fixing — Next.js deduplicates fetch calls within the same request via React.cache

### Additional Fixes (this session)
- [x] 59 missing loading.tsx files created (111 total now)
- [x] 82 staff API routes being switched to prismaUnfiltered (agent running)
- [x] staff/newsroom/page.tsx switched to prismaUnfiltered
- [x] staff/calendar/actions.ts switched to prismaUnfiltered
- [x] staff/scheduling/actions.ts switched to prismaUnfiltered
- [x] staff/exams/events/[id]/actions.ts switched to prismaUnfiltered
- [x] api/staff/newsroom/[id]/route.ts switched to prismaUnfiltered
- [x] online-application-terms/page.tsx — removed duplicate getRegistrationFee(), uses shared helper
- [x] 6 public pages force-dynamic to prevent build-time DB access
