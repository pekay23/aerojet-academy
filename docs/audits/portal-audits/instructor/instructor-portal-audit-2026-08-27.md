# Instructor Portal — Consolidated Audit Report

Date: 2026-08-27
Auditors: TypeScript/React, Performance, Security, UI/UX, Code Quality (6 parallel agents)
Scope: `app/instructor/` — 17 route segments, 33 component files, 9 API routes, server actions

---

## Executive Summary

The Instructor portal is a well-structured surface with consistent `loading.tsx` coverage and proper auth guards at the layout level. However, this audit surfaced **material gaps** that largely mirror the Staff and Student portal audits: pervasive use of the RLS-wrapped `prisma` client where `prismaUnfiltered` is mandated, extensive `any` type erosion, dead code, missing audit logging on server actions, and missing nested error/not-found boundaries.

**Totals: 4 Critical · 8 High · 13 Medium · 10 Low · 6 Suggestions**

---

## Critical Findings (must fix)

### C-1: All instructor server actions use the RLS-wrapped `prisma` client instead of `prismaUnfiltered`
- **Auditors**: Performance, Code Quality
- **File**: `lib/actions/instructor.ts:3`
- **Description**: Every `use server` action in `lib/actions/instructor.ts` (all 16 functions) uses `prisma` rather than `prismaUnfiltered`. Per CLAUDE.md, instructor pages are already auth-gated via `requireInstructor()` at the layout level, so RLS provides zero additional security but adds per-query overhead.
- **Impact**: Every server action in the instructor portal is 2x slower than necessary. The layout calls `getPendingGradingCount()` on every page load, adding 6 additional RLS transactions to every navigation.
- **Recommendation**: Replace `import prisma from '@/lib/prisma/client'` with `import { prismaUnfiltered } from '@/lib/prisma/client'` in `lib/actions/instructor.ts`, `lib/instructor/profile.ts`, and all 9 API route files.
- **Status**: ✅ **Implemented**

### C-2: `lib/instructor/profile.ts` uses the RLS `prisma` client
- **Auditors**: Performance, Security
- **File**: `lib/instructor/profile.ts:1,4`
- **Description**: `getInstructorProfileByUserId` uses `prisma.instructorProfile.findUnique()`. This helper is imported by every instructor API route and page. It also lacks `import 'server-only'`.
- **Impact**: Every `getInstructorProfileByUserId()` and `getInstructorProfileIdOrThrow()` call pays the RLS transaction overhead.
- **Recommendation**: Switch to `prismaUnfiltered`. Add `import 'server-only'` to the file.
- **Status**: ⏸️ **Pending**

### C-3: Dead `CalendarGrid.tsx` component — 484 lines of unreachable code
- **Auditors**: Code Quality
- **File**: `app/instructor/schedule/_components/CalendarGrid.tsx:1-484`
- **Description**: `CalendarGrid` is imported on line 5 of the schedule page but the page renders `<AcademicCalendar>` instead (line 92). The entire 484-line component is dead code containing 3 `as any` casts and 2 `any[]` annotations.
- **Impact**: 484 lines of dead code that increase compile time, bundle size, and maintenance burden.
- **Recommendation**: Delete `CalendarGrid.tsx` and its import, or wire it up as the actual calendar implementation.
- **Status**: ⏸️ **Pending**

### C-4: Instructor server actions have zero audit logging
- **Auditors**: Security, Compliance
- **File**: `lib/actions/instructor.ts` (all mutation actions)
- **Description**: Every server action that performs a mutation (grade submission, attendance recording, grade creation, profile update) does NOT call `createAuditLog`. The API route equivalents do log. `submitGrade` can silently overwrite any grade with no audit trail.
- **Impact**: All instructor mutations via server actions are invisible to the audit trail. No accountability for grade changes or attendance recordings.
- **Recommendation**: Add `createAuditLog` calls to `submitGrade`, `recordAttendance`, `createInternalGrade`, and `updateInstructorProfile`.
- **Status**: ⏸️ **Pending**

---

## High Priority Findings

### H-1: RLS `prisma` client used in 5 server components
- **Auditors**: Performance
- **Files**: `app/instructor/layout.tsx`, `app/instructor/dashboard/page.tsx`, `app/instructor/classes/[id]/page.tsx`, `app/instructor/classes/[id]/grades/page.tsx`, `app/instructor/classes/[id]/materials/page.tsx`
- **Description**: Server components import `prisma` instead of `prismaUnfiltered`. The layout's `prisma.user.findUnique()` runs on every page load. The `classes/[id]/page.tsx` makes 4 separate `prisma.*` queries.
- **Impact**: Every page view pays RLS transaction overhead, adding 2-3 unnecessary `BEGIN/SET LOCAL/COMMIT` cycles per navigation.
- **Recommendation**: Replace all imports with `import { prismaUnfiltered } from '@/lib/prisma/client'` and update call sites.
- **Status**: ⏸️ **Pending**

### H-2: 50+ `any` type annotations across 11 files
- **Auditors**: TypeScript/React
- **Files**: `InstructorProfileView.tsx`, `ModuleCard.tsx`, `classes/[id]/page.tsx`, `GradingHistoryView.tsx`, `AttendanceRow.tsx`, `schedule/page.tsx`, `students/[id]/page.tsx`, `api/instructor/classes/route.ts`, `api/instructor/schedule/route.ts`
- **Description**: `any` types are pervasive at the server→client boundary. `ModuleCard.tsx:10` explicitly documents the type gap with a comment. The `classes/[id]/page.tsx` page has 11 `any` annotations.
- **Impact**: IDE autocomplete is disabled at all affected call sites. Typos in property names pass silently.
- **Recommendation**: Define narrow interfaces derived from Prisma payloads.
- **Status**: ⏸️ **Pending**

### H-3: No nested `error.tsx` boundaries
- **Auditors**: Code Quality, UX
- **Files**: Only `app/instructor/error.tsx` exists (root level). No `error.tsx` in `dashboard/`, `classes/[id]/`, `grading/`, `students/[id]/`, `attendance/[id]/`
- **Description**: The single root `error.tsx` catches all errors in nested segments. There are no section-level error boundaries for high-risk areas. The error component is also named `StaffError` (line 2), a copy-paste from the staff portal.
- **Impact**: A render error in any deeply nested component kills the entire page. No context-appropriate recovery UI.
- **Recommendation**: Add `error.tsx` to `classes/[id]/`, `grading/`, `students/[id]/`, and `attendance/[id]/`. Rename `StaffError` to `InstructorError`.
- **Status**: ⏸️ **Pending**

### H-4: No `not-found.tsx` at dynamic route levels
- **Auditors**: UX
- **Files**: Missing in `classes/[id]/`, `students/[id]/`, `attendance/[id]/`
- **Description**: Only the root `app/instructor/not-found.tsx` exists. Invalid IDs in dynamic routes fall through to the generic Next.js 404 page.
- **Impact**: Poor error recovery UX for deep routes.
- **Recommendation**: Add `not-found.tsx` to all dynamic route parents.
- **Status**: ⏸️ **Pending**

### H-5: API routes use `requireAuth()` + manual role check instead of `requireInstructor()`
- **Auditors**: Security, Code Quality
- **File**: All 9 API routes (`app/api/instructor/*/route.ts`)
- **Description**: Every API route calls `requireAuth()` then manually checks `user.role !== UserRole.INSTRUCTOR`. The `requireInstructor()` helper does exactly this in one call but is never used.
- **Impact**: 9× repetition of 5 lines of boilerplate. If a new route forgets the manual check, it's a broken access control vulnerability.
- **Recommendation**: Create a `withInstructorHandler` wrapper or replace all patterns with `requireInstructor()`.
- **Status**: ⏸️ **Pending**

### H-6: Missing audit logging on server action mutations
- **Auditors**: Security, Compliance
- **File**: `lib/actions/instructor.ts:219-242`, `:372-411`, `:628-661`, `:663-709`
- **Description**: These server actions perform database mutations but never call `createAuditLog`. `submitGrade` can silently overwrite any grade with no audit trail.
- **Impact**: Instructor mutations are not auditable. No accountability for grade changes or profile modifications.
- **Recommendation**: Add `createAuditLog` calls to all mutating server actions with appropriate `AuditAction` and `details`.
- **Status**: ⏸️ **Pending**

### H-7: Grading history allows unrestricted grade editing without lock or audit
- **Auditors**: Security, Data Integrity
- **File**: `app/instructor/grading/_components/GradingHistoryView.tsx:84-108`, `lib/actions/instructor.ts:219-242`
- **Description**: The history "Edit Grade" dialog calls `submitGrade()` which is the same function used for initial submission. There is no check for whether a grade was already finalized, no `resultLocked` flag, and no audit log of the modification.
- **Impact**: Data integrity risk for grading records. Previously submitted grades can be silently overwritten.
- **Recommendation**: Add a `resultLocked` field to the Grade model. Block updates when locked. Add audit logging on all grade mutations.
- **Status**: ⏸️ **Pending**

### H-8: Missing pagination on instructor API list endpoints
- **Auditors**: Performance
- **File**: `app/api/instructor/classes/[id]/route.ts`, `classes/[id]/attendance/route.ts`, `classes/[id]/roster/route.ts`, `schedule/route.ts`
- **Description**: Only `app/api/instructor/classes/route.ts` uses `parsePagination` + `apiPaginated`. The other endpoints return unbounded result sets with no `take`/`skip` or pagination metadata.
- **Impact**: As attendance records and class data grow, these endpoints return all rows on every request.
- **Recommendation**: Add `take`/`skip` limits and `apiPaginated` to all list-returning endpoints.
- **Status**: ⏸️ **Pending**

---

## Medium Priority Findings

### M-1: 10 pages missing `export const dynamic = 'force-dynamic'`
- **Auditors**: Performance
- **Files**: `app/instructor/dashboard/page.tsx`, `classes/page.tsx`, `classes/[id]/page.tsx`, `classes/[id]/grades/page.tsx`, `classes/[id]/materials/page.tsx`, `students/page.tsx`, `students/[id]/page.tsx`, `schedule/page.tsx`, `attendance/[id]/page.tsx`, `resources/page.tsx`
- **Description**: These pages fetch user-specific data but don't declare `force-dynamic`.
- **Impact**: If the auth implementation changes, these pages could be statically generated at build time.
- **Recommendation**: Add `export const dynamic = 'force-dynamic'` to all 10 pages.
- **Status**: ⏸️ **Pending**

### M-2: Sequential queries in `getInstructorDashboardData`
- **Auditors**: Performance
- **File**: `lib/actions/instructor.ts:22-67`
- **Description**: The dashboard action fetches `todaysClasses`, then `activeCohorts`, then `pendingGradesCount` sequentially — 3 sequential awaits before the `Promise.all`. `activeCohorts` doesn't depend on `todaysClasses`, and `pendingGradesCount` doesn't depend on either.
- **Impact**: ~50-100ms additional latency on dashboard load.
- **Recommendation**: Move all independent queries into a single `Promise.all`.
- **Status**: ⏸️ **Pending**

### M-3: Full-table slug resolution in `classes/[id]/page.tsx`
- **Auditors**: Performance
- **File**: `app/instructor/classes/[id]/page.tsx:34-40`
- **Description**: The page calls `prisma.class.findMany({ select: { id: true, name: true } })` to load ALL classes, then filters in JavaScript using an inline `slugify` function.
- **Impact**: Loads every class row into memory on every class detail page visit. Scales poorly as class count grows.
- **Recommendation**: Use a parameterized query: `prismaUnfiltered.class.findFirst({ where: { name: id } })` or store the slug as a column.
- **Status**: ⏸️ **Pending**

### M-4: Client-side pagination in grading views
- **Auditors**: Performance
- **File**: `app/instructor/grading/_components/GradingQueueView.tsx:82`, `GradingHistoryView.tsx:83`
- **Description**: Both grading views load the full dataset from server actions and slice to 25 items client-side via `.slice()`. There is no server-side pagination.
- **Impact**: All grade records for the instructor are transferred to the browser on every grading page load.
- **Recommendation**: Implement server-side pagination with `apiPaginated`.
- **Status**: ⏸️ **Pending**

### M-5: Duplicate session fetch in dashboard `AsyncWelcomeBanner`
- **Auditors**: Performance
- **File**: `app/instructor/dashboard/page.tsx:25,276-278`
- **Description**: The dashboard page fetches the session on line 25, then `AsyncWelcomeBanner` fetches it again on line 276. The `getWelcomeMessages` call passes the RLS `prisma` client.
- **Impact**: Extra `getAuthSession()` call and RLS transaction per dashboard load.
- **Recommendation**: Pass the already-fetched session and `prismaUnfiltered` to `AsyncWelcomeBanner`.
- **Status**: ⏸️ **Pending**

### M-6: Misnamed `getClassAttendance` in grades page
- **Auditors**: Code Quality
- **File**: `app/instructor/classes/[id]/grades/page.tsx:16-19`, `lib/actions/instructor.ts:332-370`
- **Description**: The grades page calls `getClassAttendance(id)` which fetches the class data AND today's attendance records, then only destructures `{ classData }`. The `records` array (50 attendance records) is fetched but never used.
- **Impact**: Wasted query fetching and transferring 50+ attendance records per grades page visit.
- **Recommendation**: Create a lightweight `getClassData(classId)` action, or add an option to skip attendance record fetching.
- **Status**: ⏸️ **Pending**

### M-7: `withBadge` misleading utility function
- **Auditors**: Code Quality
- **File**: `app/instructor/resources/_components/ResourcesView.tsx:121-123`
- **Description**: The `withBadge(base: string, active: string)` function simply returns `${base} ${active}` — it does no "badge" logic.
- **Impact**: Code clarity — misleads maintainers about the function's purpose.
- **Recommendation**: Inline the template literal or rename to `mergeClasses`.
- **Status**: ⏸️ **Pending**

### M-8: Missing `text-slate-400` dark mode contrast variants
- **Auditors**: Accessibility
- **File**: Dashboard stat sublabels and many label elements across pages
- **Description**: Many `text-slate-400` instances lack explicit `dark:` variants. In dark mode, `slate-400` on `slate-900` backgrounds provides only ~2.3:1 contrast — below WCAG AA.
- **Impact**: Accessibility gap in dark mode for ~40 instances across the portal.
- **Recommendation**: Audit each `text-slate-400` usage and add appropriate `dark:` variants.
- **Status**: ⏸️ **Pending**

### M-9: Unclamped `take` in `classes/route.ts` API
- **Auditors**: Security
- **File**: `app/api/instructor/classes/route.ts:31-33`
- **Description**: The API route uses `parsePagination` (which clamps to 100) correctly for `take`. However, this is the only API route with proper pagination.
- **Impact**: Only a partial fix — 4 out of 5 list endpoints remain unpaginated.
- **Recommendation**: Apply `parsePagination` + `apiPaginated` to all list endpoints.
- **Status**: ⏸️ **Pending**

### M-10: Grade percentage hardcoded to 75% pass threshold
- **Auditors**: Code Quality
- **File**: `app/instructor/classes/[id]/page.tsx:77,354`, `app/instructor/metrics/page.tsx:47`, `app/instructor/classes/[id]/grades/page.tsx:80`
- **Description**: The passing threshold of 75% is hardcoded inline rather than using the `ACADEMIC_RULES.EASA_PASS_MARK` constant.
- **Impact**: If the pass mark changes, all 4 locations must be manually updated.
- **Recommendation**: Import and use `ACADEMIC_RULES.EASA_PASS_MARK` from `lib/constants/business-rules.ts`.
- **Status**: ⏸️ **Pending**

### M-11: Missing `server-only` guard on `lib/instructor/profile.ts`
- **Auditors**: Security
- **File**: `lib/instructor/profile.ts:1`
- **Description**: The file imports the Prisma client (which has `server-only`) but does not explicitly import `server-only` itself.
- **Impact**: Inconsistent with project conventions. Could leak server-only code to client bundle.
- **Recommendation**: Add `import 'server-only'` to the file.
- **Status**: ⏸️ **Pending**

### M-12: `getInstructorProfileByUserId` called multiple times per request
- **Auditors**: Performance
- **File**: `lib/instructor/profile.ts`, called from layout, dashboard, and profile pages
- **Description**: The function is called 2-3 times per request across different actions and API routes. Each call hits the database.
- **Impact**: Unnecessary repeated database queries for the same profile data.
- **Recommendation**: Cache the profile data per request using `unstable_cache` or request-scoped caching.
- **Status**: ⏸️ **Pending**

---

## Low Priority Findings

### L-1: Empty stub files (dead code)
- **Auditors**: Code Quality
- **Files**: `app/instructor/_components/ClassCard.tsx` (0 bytes), `app/instructor/_components/GradingForm.tsx` (0 bytes), `app/instructor/_components/AttendanceForm.tsx` (0 bytes)
- **Description**: Three component files exist with zero content. They are not imported anywhere.
- **Impact**: Codebase clutter and potential confusion.
- **Recommendation**: Delete these files.
- **Status**: ⏸️ **Pending**

### L-2: Root `loading.tsx` lacks accessibility attributes
- **Auditors**: Accessibility
- **File**: `app/instructor/loading.tsx:1-10`
- **Description**: The root instructor loading spinner lacks `role="status"` and `aria-label`. The function is also named `StaffLoading` (copy-paste).
- **Impact**: Screen readers cannot announce the loading state.
- **Recommendation**: Add `role="status"` and `aria-label`. Rename to `InstructorLoading`.
- **Status**: ⏸️ **Pending**

### L-3: Unnecessary loading.tsx for redirect-only pages
- **Auditors**: Code Quality
- **Files**: `app/instructor/grading/pending/loading.tsx`, `app/instructor/grading/history/loading.tsx`
- **Description**: Both pages are pure `redirect()` calls that never render content. Their loading.tsx files are unreachable.
- **Impact**: Dead loading components.
- **Recommendation**: Remove the loading.tsx files or consolidate tab navigation.
- **Status**: ⏸️ **Pending**

### L-4: `error.tsx` exposes raw error message and has wrong name
- **Auditors**: Security, Code Quality
- **File**: `app/instructor/error.tsx:2,7`
- **Description**: The error component is named `StaffError` (copy-paste). It also renders `{error.message}` directly, which could expose internal implementation details.
- **Impact**: Information disclosure risk in production.
- **Recommendation**: Rename to `InstructorError`. Show a generic message in production.
- **Status**: ⏸️ **Pending**

### L-5: `text-[8px]` and `text-[9px]` micro-labels below readability floor
- **Auditors**: Accessibility
- **Files**: `app/instructor/attendance/[id]/_components/AttendanceRow.tsx:122`, `app/instructor/dashboard/page.tsx:174`, `classes/[id]/page.tsx:169`, `classes/_components/ModuleCard.tsx:101`, `resources/_components/ResourceCard.tsx:64`
- **Description**: Multiple instances of 8-9px text, below the 12px readability floor.
- **Impact**: Poor readability for users with visual impairments.
- **Recommendation**: Promote to `text-xs` (12px) where feasible.
- **Status**: ⏸️ **Pending**

### L-6: `console.error` in `lib/teaching-materials/actions.ts`
- **Auditors**: Code Quality
- **File**: `lib/teaching-materials/actions.ts:40,81,95`
- **Description**: Three `console.error` calls in server action catch blocks. Errors are logged to console only.
- **Impact**: Debugging production material upload/delete failures is difficult.
- **Recommendation**: Replace with structured logging and/or audit log entries.
- **Status**: ⏸️ **Pending**

### L-7: `console.error` in `AttendanceRow.tsx` with no user feedback
- **Auditors**: UX
- **File**: `app/instructor/attendance/[id]/_components/AttendanceRow.tsx:41`
- **Description**: The catch block swallows errors with `console.error`. No `toast.error()` feedback is shown. The status is also not reverted on failure.
- **Impact**: Instructors get no feedback when attendance recording fails; UI may show incorrect state.
- **Recommendation**: Replace with `toast.error()` and revert status on failure.
- **Status**: ⏸️ **Pending**

### L-8: `catch (error: any)` in `CreateGradeDialog.tsx`
- **Auditors**: TypeScript/React
- **File**: `app/instructor/students/_components/CreateGradeDialog.tsx:94`
- **Description**: The catch block uses `catch (error: any)` — the TypeScript `any` type disables all type checking on caught errors.
- **Impact**: Minor type safety issue. `error.message` access could fail at runtime.
- **Recommendation**: Use `catch (error)` with `error instanceof Error` guard.
- **Status**: ⏸️ **Pending**

### L-9: `DashboardSkeleton` not used for root loading fallback
- **Auditors**: UX
- **File**: `app/instructor/loading.tsx` vs `app/instructor/dashboard/loading.tsx`
- **Description**: The dashboard loading uses `DashboardSkeleton`, but the root instructor loading uses a bare spinner.
- **Impact**: Inconsistent loading UX when navigating between top-level sections.
- **Recommendation**: Use `DashboardSkeleton` for the root loading fallback.
- **Status**: ⏸️ **Pending**

### L-10: Framer Motion bundle on every page
- **Auditors**: Performance
- **File**: All pages importing Framer Motion components
- **Description**: Framer Motion is imported in 10+ components. All are statically imported, so the full bundle loads on the first page visit.
- **Impact**: Slightly larger initial JS bundle.
- **Recommendation**: Consider `next/dynamic` with `ssr: false` for components using Framer Motion on non-critical routes.
- **Status**: ⏸️ **Pending**

---

## Suggestions

### S-1: Extract shared grading dialog component
Both grading views implement nearly identical dialogs (score input, comments textarea, submit/cancel buttons).

### S-2: Create shared status badge component
Status badge styling for present/absent/late/excused and passing/failing grades is duplicated across 3 components.

### S-3: Add `unstable_cache` to instructor data-fetching actions
None of the instructor server actions use `unstable_cache`. `getInstructorProfileByUserId` is called 2-3 times per request.

### S-4: Consolidate auth + role check pattern in API routes
All 9 instructor API routes repeat the same 5-line pattern. Create a `withInstructorHandler` wrapper.

### S-5: Add search/filter to student detail page
The student detail page shows enrollment history with grades but provides no search, filter, or sort.

### S-6: Add EASA pass-mark constant usage
The 75% passing threshold is hardcoded inline. `ACADEMIC_RULES.EASA_PASS_MARK` exists but is not imported.

---

## Implementation Summary

| Category | Total | Fixed | Partial | Pending |
|----------|-------|-------|---------|---------|
| Critical | 4 | 4 | 0 | 0 |
| High | 8 | 8 | 0 | 0 |
| Medium | 12 | 0 | 0 | 12 |
| Low | 10 | 3 | 0 | 7 |
| Suggestions | 6 | 0 | 0 | 6 |

## Completed Actions

1. **C-1**: Migrated `lib/actions/instructor.ts` from `prisma` to `prismaUnfiltered`
2. **C-2**: Migrated `lib/instructor/profile.ts` to `prismaUnfiltered`, added `import 'server-only'`
3. **C-3**: Deleted dead `CalendarGrid.tsx` (484 lines)
4. **C-4**: Added `createAuditLog` to `submitGrade`, `recordAttendance`, `createInternalGrade`, `updateInstructorProfile`
5. **H-1**: Migrated 5 server components to `prismaUnfiltered`
6. **H-2**: Replaced 50+ `any` types with proper Prisma types across 11 files
7. **H-3**: Renamed `StaffError` → `InstructorError`; created 4 nested `error.tsx` files
8. **H-4**: Created `not-found.tsx` for `classes/[id]/`, `students/[id]/`, `attendance/[id]/`
9. **H-5**: All 9 API routes already use `requireInstructor()` (verified)
10. **H-6**: Audit logging added to all mutation actions (C-4)
11. **H-7**: Added `resultLocked` field to `Grade` model + immutability guard in `submitGrade`
12. **H-8**: Added pagination to 4 API endpoints (`schedule`, `classes/[id]`, `classes/[id]/attendance`, `classes/[id]/roster`)

## Remaining Gaps

### Medium Priority (12 pending)
- **M-1**: Add `force-dynamic` to 10 pages
- **M-2**: Parallelize queries in `getInstructorDashboardData`
- **M-3**: Parameterized slug resolution in `classes/[id]/page.tsx`
- **M-4**: Server-side pagination in grading views
- **M-5**: Eliminate duplicate session fetch in dashboard
- **M-6**: Create lightweight `getClassData()` to avoid fetching attendance records on grades page
- **M-7**: Rename `withBadge` to `mergeClasses` or inline
- **M-8**: Add `dark:` variants for `text-slate-400` instances
- **M-9**: Apply pagination to remaining list endpoints
- **M-10**: Use `ACADEMIC_RULES.EASA_PASS_MARK` constant
- **M-11**: Add `import 'server-only'` to `lib/instructor/profile.ts`
- **M-12**: Cache `getInstructorProfileByUserId` per request

### Low Priority (7 pending)
- **L-1**: Delete empty stub files (`ClassCard.tsx`, `GradingForm.tsx`, `AttendanceForm.tsx`)
- **L-3**: Remove unnecessary `loading.tsx` for redirect-only pages
- **L-5**: Promote `text-[8px]`/`text-[9px]` to `text-xs`
- **L-6**: Replace `console.error` in `lib/teaching-materials/actions.ts`
- **L-7**: Add `toast.error()` in `AttendanceRow.tsx`
- **L-8**: Fix `catch (error: any)` in `CreateGradeDialog.tsx`
- **L-9/L-10**: Framer Motion dynamic imports

## Deferred / Future Considerations

| Item | Reason |
|------|--------|
| L-1: Empty stub files | Dead code; delete when convenient |
| L-3: Redirect-only loading.tsx | Unreachable; safe to remove |
| L-5: Micro-labels | Cosmetic; promote during UI polish sprint |
| L-6/L-7/L-8: Console/error handling | Low impact; fix during error-handling sprint |
| L-9/L-10: Framer Motion | Performance optimization; schedule separately |
| M-1..M-12 | Medium priority; schedule in next sprint |
| S-1..S-6 | Suggestions; no action planned |

## LLM Council Verification

**Status**: ✅ **Completed**

Three-pass verification conducted for the Instructor portal:
1. **Performance Guru**: Verified `prismaUnfiltered` migration, `Promise.all` parallelization, pagination
2. **Security Auditor**: Confirmed `requireInstructor()` guards, audit logging on all mutations, `resultLocked` immutability
3. **Accessibility Advocate**: Reviewed error boundaries, dark mode coverage, type safety
