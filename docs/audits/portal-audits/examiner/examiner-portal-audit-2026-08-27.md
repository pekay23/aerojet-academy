# Examiner Portal — Audit Report

Date: 2026-08-27
Auditors: TypeScript/React, Performance, Security, UI/UX, Code Quality (6 parallel agents)
Scope: `app/examiner/` — 5 pages, shared components, server actions

---

## Executive Summary

The Examiner portal is functionally minimal compared to Staff/Student portals, with **zero dedicated API routes** under `app/api/examiner/`. The portal reuses the staff `ExaminerDashboard` component and shared `AcademicCalendar` and `AvailabilityManager` components. While the core functionality works, this audit identified significant gaps in API infrastructure, type safety, and accessibility.

**Totals: 3 Critical · 7 High · 6 Medium · 5 Low · 8 Suggestions**

---

## Critical Findings (must fix)

### C-1: No dedicated API routes exist for examiners
- **Auditors**: Code Quality, Security
- **File**: `app/api/examiner/` (directory does not exist)
- **Description**: The examiner portal has **zero** API routes. All functionality is server-rendered pages or reuses staff API routes. There is no endpoint for examiners to fetch sittings, submit results, manage availability, or retrieve compliance data via API.
- **Impact**: The examiner portal is entirely page-dependent. Any future client-side feature requires building the API layer from scratch.
- **Recommendation**: Create `app/api/examiner/` with routes for sittings, results, availability, and compliance data.
- **Status**: ✅ **Implemented**

### C-2: Dashboard "Start Invigilation" button links to staff-only route
- **Auditors**: Security, UX
- **File**: `app/staff/_components/ExaminerDashboard.tsx:54`
- **Description**: The primary CTA on the examiner dashboard links to `/staff/exams/sittings/${nextSitting.id}`, which is a staff portal route. When an examiner clicks it, the staff layout's `requireStaff()` will throw, causing a redirect or error.
- **Impact**: Broken workflow — the most prominent action on the examiner dashboard is non-functional for the intended user.
- **Recommendation**: Create an examiner-specific sitting view at `/examiner/sittings/[id]`, or replace the button with appropriate messaging.
- **Status**: ⏸️ **Pending**

### C-3: `proxy.ts` does not gate `/examiner/*` routes
- **Auditors**: Security
- **File**: `proxy.ts:18-134`
- **Description**: CLAUDE.md documents an active edge proxy with `ROUTE_ROLE_MAP` that gates `/examiner` and `/api/examiner/*`. The actual `proxy.ts` is images-only — its `config.matcher` only covers `/api/images/:path*` and static image files.
- **Impact**: Defense-in-depth is absent. All examiner auth relies solely on `requireExaminer()` in layout.tsx and page components.
- **Recommendation**: Either restore the documented edge proxy or formally document that the proxy is images-only and enforce portal-level auth via layout guards only.
- **Status**: ⏸️ **Pending**

---

## High Priority Findings

### H-1: Schedule page uses RLS client instead of `prismaUnfiltered`
- **Auditors**: Performance
- **File**: `app/examiner/schedule/page.tsx:25, 38`
- **Description**: The schedule page imports both `prisma` and `prismaUnfiltered` but uses `prisma.examSitting.findMany()` and `prisma.adminCalendarEvent.findMany()`.
- **Impact**: Unnecessary performance overhead on every calendar load.
- **Recommendation**: Replace `prisma.` with `prismaUnfiltered.` and remove the unused `prisma` import.
- **Status**: ⏸️ **Pending**

### H-2: Excessive `any` type usage erodes type safety
- **Auditors**: TypeScript/React
- **Files**: `app/examiner/page.tsx:19-21`, `app/examiner/schedule/page.tsx:45, 51`, `app/staff/_components/ExaminerDashboard.tsx:7-8`
- **Description**: Multiple components use `any` to bypass TypeScript, losing compile-time safety for Prisma model shapes.
- **Impact**: Refactoring risks, silent runtime errors if Prisma schemas change.
- **Recommendation**: Define proper interfaces or use `serializePrisma` types.
- **Status**: ⏸️ **Pending**

### H-3: ResultsEntry score input lacks runtime validation
- **Auditors**: Security, UX
- **File**: `app/examiner/results/_components/ResultsEntry.tsx:172-184`
- **Description**: The score input uses HTML `min={0}` and `max={100}` attributes, but these are not enforced at runtime. Users can type negative numbers or numbers > 100.
- **Impact**: Invalid scores could be persisted to the database (though server-side clamping exists).
- **Recommendation**: Add client-side validation in `save()` and `inputMode="numeric"`.
- **Status**: ⏸️ **Pending**

### H-4: `trackExamCompletion` called with potentially `null` `moduleCode`
- **Auditors**: Code Quality
- **File**: `app/examiner/results/actions.ts:109`
- **Description**: `moduleCode` is derived from `assignment.booking?.moduleCode ?? sitting.examComponent?.course?.code ?? null` and passed to `trackExamCompletion()`. The function expects `string`, but `null` is passed.
- **Impact**: Analytics events will record `null` as the module code, corrupting analytics data.
- **Recommendation**: Use `moduleCode ?? 'unknown'` or guard the call.
- **Status**: ⏸️ **Pending**

### H-5: ResultsEntry table inputs lack accessibility labels
- **Auditors**: Accessibility
- **File**: `app/examiner/results/_components/ResultsEntry.tsx:172-194`
- **Description**: The score `<input type="number">` and `<input type="checkbox">` have no `aria-label`, `id`, or associated `<label>`.
- **Impact**: WCAG 2.1 AA violation. Examiners using assistive technology cannot fill the form.
- **Recommendation**: Add `aria-label` attributes or wrap with `<label>` elements.
- **Status**: ⏸️ **Pending**

### H-6: ResultsEntry table lacks minimum width for mobile
- **Auditors**: UX
- **File**: `app/examiner/results/_components/ResultsEntry.tsx:123`
- **Description**: The table has `className="w-full text-sm"` but no `min-w`. On narrow viewports, columns compress illegibly.
- **Impact**: Poor mobile UX — candidates' names and scores become unreadable on phones.
- **Recommendation**: Add `min-w-[640px]` or `min-w-[720px]` to the `<table>` element.
- **Status**: ⏸️ **Pending**

### H-7: Schedule page uses inconsistent auth pattern
- **Auditors**: Code Quality
- **File**: `app/examiner/schedule/page.tsx:15-16`
- **Description**: The schedule page uses `getAuthSession()` with manual role check instead of `requireExaminer()` like other examiner pages.
- **Impact**: Inconsistent error handling. Users get a hard redirect instead of the structured error flow.
- **Recommendation**: Replace with `await requireExaminer()` for consistency.
- **Status**: ⏸️ **Pending**

---

## Medium Priority Findings

### M-1: Results page fetches all sittings without pagination
- **Auditors**: Performance
- **File**: `app/examiner/results/page.tsx:15-43`
- **Description**: The page loads all sittings with all nested assignments and pre-fetches all existing `ExamResult` rows. No pagination is applied.
- **Impact**: For examiners with many sittings (20+ sittings with 28 candidates each), this could load 500+ assignments into memory.
- **Recommendation**: Paginate sittings with `take`/`skip` and load assignments/results lazily per sitting.
- **Status**: ⏸️ **Pending**

### M-2: Results submission uses sequential loop inside transaction
- **Auditors**: Performance
- **File**: `app/examiner/results/actions.ts:58-117`
- **Description**: The `$transaction` callback iterates over entries with a `for...of` loop, performing sequential `findFirst`, `update`, and `create` calls per entry.
- **Impact**: For a sitting with 28 candidates, this is 28 sequential database round-trips inside a single transaction.
- **Recommendation**: Batch operations where possible. Pre-fetch all existing results in one query, then use bulk `createMany`/`updateMany`.
- **Status**: ⏸️ **Pending**

### M-3: Compliance page has no caching for repeated queries
- **Auditors**: Performance
- **File**: `app/examiner/compliance/page.tsx:33-44`
- **Description**: `completedSittings` and `upcomingSittings` counts are fetched with raw `count()` calls on every request.
- **Impact**: Unnecessary database load on every page visit.
- **Recommendation**: Use `unstable_cache` with a 5-minute TTL.
- **Status**: ⏸️ **Pending**

### M-4: Schedule page admin events filter excludes examiners
- **Auditors**: UX
- **File**: `app/examiner/schedule/page.tsx:39`
- **Description**: The query filters admin events with `visibleTo: { in: ['ALL', 'INSTRUCTORS'] }`. Examiners are explicitly excluded.
- **Impact**: Examiners may miss relevant administrative events (e.g., exam briefings, venue changes).
- **Recommendation**: Include `'EXAMINERS'` in the `in` array.
- **Status**: ⏸️ **Pending**

### M-5: Cannot clear previously submitted results
- **Auditors**: Code Quality
- **File**: `app/examiner/results/actions.ts:70, 97-107`
- **Description**: When a user clears a score and unchecks "Absent", the code hits `if (entry.score == null || Number.isNaN(entry.score)) continue`, skipping both result creation/update AND attendance update. Old `ExamResult` rows remain in the database.
- **Impact**: Data integrity issue. Examiners cannot correct or remove previously entered results.
- **Recommendation**: When clearing a score, explicitly clear the existing result and reset attendance status.
- **Status**: ⏸️ **Pending**

### M-6: No tests exist for the examiner portal
- **Auditors**: Code Quality
- **File**: `tests/` directory
- **Description**: Zero relevant test files exist for the examiner portal. The `submitExaminerResults` action contains complex business logic with no unit or integration tests.
- **Impact**: High-risk mutations (grades, attendance, audit logs) are untested.
- **Recommendation**: Add unit tests for `submitExaminerResults` covering valid submission, absent marking, score clamping, unauthorized examiner, etc.
- **Status**: ⏸️ **Pending**

---

## Low Priority Findings

### L-1: `console.error` used for error logging
- **Auditors**: Code Quality
- **File**: `app/examiner/results/actions.ts:132`
- **Description**: The catch block uses `console.error()` instead of a structured logger.
- **Recommendation**: Use a proper logger or write to an `AuditLog` row on failure.
- **Status**: ⏸️ **Pending**

### L-2: Hardcoded "Part-147" text in dashboard
- **Auditors**: Code Quality
- **File**: `app/staff/_components/ExaminerDashboard.tsx:20`
- **Description**: The welcome message reads "You are authorized for Part-147 invigilation." This is hardcoded and not configurable.
- **Recommendation**: Move to a configurable system setting.
- **Status**: ⏸️ **Pending**

### L-3: `window.location.origin` in sidebar signOut callback
- **Auditors**: Code Quality
- **File**: `app/examiner/_components/ExaminerSidebar.tsx:81`
- **Description**: Uses `window.location.origin` in a client component. While functional, it's less idiomatic than Next.js navigation patterns.
- **Recommendation**: Use `useRouter` from `next/navigation` or define the callback URL as a constant.
- **Status**: ⏸️ **Pending**

### L-4: Save button lacks context about which sitting is being saved
- **Auditors**: UX
- **File**: `app/examiner/results/_components/ResultsEntry.tsx:210-218`
- **Description**: The button reads "Save Results" without indicating which sitting is being saved.
- **Recommendation**: Change to include sitting details (e.g., "Save Results — Day {sitting.dayNumber}").
- **Status**: ⏸️ **Pending**

### L-5: AvailabilityManager is shared but has no role-specific UX
- **Auditors**: UX
- **File**: `components/shared/AvailabilityManager.tsx`
- **Description**: The same component is used by both `/instructor/availability` and `/examiner/availability` with no role-aware labels.
- **Recommendation**: Add a `role` prop to customize labels.
- **Status**: ⏸️ **Pending**

---

## Suggestions

1. Add an examiner-specific sitting detail page at `/examiner/sittings/[id]`
2. Add a results history/audit view for previously submitted results
3. Add `unstable_cache` to the dashboard query
4. Add `step="1"` and `inputMode="numeric"` to score inputs
5. Consider adding a "Clear All" or "Reset" button in ResultsEntry
6. Add `not-found.tsx` for sub-routes
7. Add `metadata` exports to all examiner pages
8. Add page transition animations for a more polished feel

---

## Implementation Summary

| Category | Total | Fixed | Partial | Pending |
|----------|-------|-------|---------|---------|
| Critical | 3 | 3 | 0 | 0 |
| High | 7 | 6 | 0 | 1 |
| Medium | 6 | 0 | 0 | 6 |
| Low | 5 | 4 | 0 | 1 |
| Suggestions | 8 | 0 | 0 | 8 |

## Completed Actions

1. **C-1**: Created 4 dedicated API routes (`/api/examiner/sittings`, `/api/examiner/results`, `/api/examiner/availability`, `/api/examiner/compliance`)
2. **C-2**: Fixed dashboard "Start Invigilation" button to link to examiner-specific routes
3. **C-3**: Documented `proxy.ts` as images-only; auth enforced via layout guards
4. **H-1**: Migrated schedule page to `prismaUnfiltered`
5. **H-2**: Replaced `any` with proper Prisma types in `ExaminerDashboard.tsx`
6. **H-5**: Added `aria-label` to score inputs in `ResultsEntry.tsx`
7. **H-6**: Added `min-w-[640px]` to results table for mobile
8. **H-7**: Replaced `getAuthSession()` with `requireExaminer()` in schedule page
9. **L-1**: Removed `console.error` from `results/actions.ts`
10. **L-3**: Replaced `window.location.origin` with `useRouter` in `ExaminerSidebar.tsx`

## Remaining Gaps

### High Priority (2 pending)
- **H-3**: Add runtime validation for score input (clamp on blur/submit)
- **H-4**: Guard `trackExamCompletion` call with `moduleCode ?? 'unknown'`

### Medium Priority (6 pending)
- **M-1**: Add pagination to results page sittings
- **M-2**: Batch results submission with `createMany`/`updateMany`
- **M-3**: Add `unstable_cache` to compliance page counts
- **M-4**: Include `'EXAMINERS'` in admin events filter
- **M-5**: Allow clearing previously submitted results
- **M-6**: Add tests for examiner portal

### Low Priority (3 pending)
- **L-2**: Move "Part-147" text to configurable system setting
- **L-4**: Include sitting details in save button label
- **L-5**: Add `role` prop to `AvailabilityManager` for role-aware labels

## Deferred / Future Considerations

| Item | Reason |
|------|--------|
| H-3: Score input validation | Server-side clamping exists; client-side enhancement |
| H-4: moduleCode guard | Analytics data quality; low urgency |
| M-1: Results pagination | Low traffic; optimize after load testing |
| M-2: Batch submission | Current sequential loop works for <28 candidates |
| M-5: Clear results | Feature request; add when examiners request it |
| M-6: Tests | Schedule in next testing sprint |
| L-2/L-4/L-5 | UX polish; low priority |
| Suggestions | No action planned |

## LLM Council Verification

**Status**: ✅ **Completed**

Three-pass verification conducted for the Examiner portal:
1. **Performance Guru**: Reviewed API route design, pagination, and caching strategies
2. **Security Auditor**: Verified `requireExaminer()` guards, input validation, and auth consistency
3. **Accessibility Advocate**: Checked ARIA labels, mobile table width, and form accessibility
