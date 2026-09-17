# Staff Portal — Code Quality & Maintainability Audit
Date: 2026-08-27
Auditor: Code Quality Auditor Agent

## Executive Summary

The Staff portal contains **24 files exceeding 500 lines**, with the largest (`reports/page.tsx` at 1,427 lines and `students/import/page.tsx` at 1,139 lines) acting as catch-all monoliths that mix server data fetching, client state, and inline tab components. Significant duplication exists across table components (`UsersTable`, `StudentsTable`, `InstructorsTable`, `ExaminersTable`), which each independently reimplement search, pagination, and bulk-action plumbing. Error boundaries and not-found pages are almost entirely absent (80 directories missing both), and the codebase relies heavily on `any` types (100+ instances) and `console.error` statements in production code.

---

## Findings

### Category: File Size

#### Monolithic Reports Page
- **File**: `app/staff/reports/page.tsx`
- **Lines**: 1,427
- **Severity**: High
- **Type**: Improvement
- **Description**: This single file contains the main page component plus six full tab implementations (`OverviewTab`, `EnrollmentTab`, `RevenueTab`, `PoolsTab`, `AttendanceTab`, `ExamsTab`, `YoYTab`) and an inline `MetricCard` component. It is the largest file in the staff portal and violates single-responsibility principle.
- **Recommendation**: Extract each tab into its own component file under `app/staff/reports/_components/` (e.g., `OverviewTab.tsx`, `EnrollmentTab.tsx`). Move `MetricCard` to a shared location if reused elsewhere.
- **Code Reference**: Lines 112-1,214 contain the six async tab components.

#### Massive Student Import Wizard
- **File**: `app/staff/students/import/page.tsx`
- **Lines**: 1,139
- **Severity**: High
- **Type**: Improvement
- **Description**: A single client component handles CSV parsing, manual entry forms, credential export, and all associated UI state. The CSV parsing logic alone spans ~100 lines of imperative string manipulation.
- **Recommendation**: Extract the CSV parser into `lib/import/` utilities, split the manual entry form into a separate client component, and keep the page component as a thin orchestrator.
- **Code Reference**: Lines 163-275 (CSV parsing), lines 309-377 (manual entry helpers).

#### Oversized Exam Records Tab
- **File**: `app/staff/exams/_components/RecordsTab.tsx`
- **Lines**: 1,047
- **Severity**: Medium
- **Type**: Improvement
- **Description**: Combines the "Add Exam Record" form, inline editing, bulk actions, and the records table into one component. State management includes 15+ `useState` declarations.
- **Recommendation**: Split into `ExamRecordForm.tsx` (add/edit), `ExamRecordTable.tsx` (list + bulk actions), and keep `RecordsTab.tsx` as a thin coordinator.

#### Giant Calendar Grid Component
- **File**: `app/staff/calendar/_components/StaffCalendarGrid.tsx`
- **Lines**: 883
- **Severity**: Medium
- **Type**: Improvement
- **Description**: Contains all calendar rendering logic, event creation/editing modals, and audience/color configuration inline.
- **Recommendation**: Extract event dialogs into separate components and move configuration (audience options, color options) to a constants file.

#### Oversized OJT Logbook Detail
- **File**: `app/staff/ojt/[logbookId]/_components/LogbookDetail.tsx`
- **Lines**: 838
- **Severity**: Medium
- **Type**: Improvement
- **Description**: Mixes entry editing, ATA chapter selection, supervisor selection, and analytics rendering in one component.
- **Recommendation**: Extract `EntryForm.tsx`, `ATASelector.tsx`, and `LogbookAnalytics.tsx`.

#### Additional Large Files (>500 lines)
| File | Lines | Severity |
|------|-------|----------|
| `app/staff/_components/StudentDetailPanel.tsx` | 811 | Medium |
| `app/staff/programmes/_components/ProgrammesClient.tsx` | 772 | Medium |
| `app/staff/students/[id]/_components/JourneyTab.tsx` | 735 | Medium |
| `app/staff/exams/page.tsx` | 686 | Medium |
| `app/staff/newsroom/_components/NewsMarkdownEditor.tsx` | 684 | Medium |
| `app/staff/practical-assessments/_components/PracticalAssessmentsClient.tsx` | 652 | Medium |
| `app/staff/_components/PaymentsQueue.tsx` | 641 | Medium |
| `app/staff/exams/internal/_components/ExamOperations.tsx` | 614 | Medium |
| `app/staff/resources/_components/ResourceForm.tsx` | 592 | Medium |
| `app/staff/settings/email-previews/page.tsx` | 589 | Medium |
| `app/staff/students/[id]/_components/WalletTab.tsx` | 581 | Medium |
| `app/staff/users/[id]/_components/AcademicHistorySection.tsx` | 581 | Medium |
| `app/staff/users/[id]/page.tsx` | 555 | Medium |
| `app/staff/_components/ApplicantDetailDrawer.tsx` | 543 | Medium |
| `app/staff/students/[id]/_components/BookExamForStudentDialog.tsx` | 528 | Medium |
| `app/staff/courses/_components/CoursesClient.tsx` | 527 | Medium |
| `app/staff/scheduling/_components/SchedulingClient.tsx` | 522 | Medium |
| `app/staff/_components/ApplicantsQueue.tsx` | 513 | Medium |
| `app/staff/documents/_components/DocumentsManager.tsx` | 506 | Medium |

---

### Category: Duplication

#### Duplicated `slugify` Utility
- **File**: `app/staff/classes/[id]/page.tsx:32`, `app/staff/classes/[id]/edit/page.tsx:18`, `app/staff/_components/UserActionsMenu.tsx:39`, `app/staff/_components/StudentDetailPanel.tsx:110`, `app/staff/_components/InstructorsTable.tsx:40`, `app/staff/_components/ClassActionsMenu.tsx:23`
- **Severity**: Low
- **Type**: Improvement
- **Description**: The same `slugify` helper function is copy-pasted into six files.
- **Recommendation**: Extract to `lib/utils/string.ts` (already exists) and import from there.

#### Duplicated Table Fetch/Pagination/Bulk-Action Pattern
- **Files**: `app/staff/_components/UsersTable.tsx`, `app/staff/_components/StudentsTable.tsx`, `app/staff/_components/InstructorsTable.tsx`, `app/staff/_components/ExaminersTable.tsx`
- **Severity**: High
- **Type**: Improvement
- **Description**: All four table components independently reimplement:
  - URL search params construction
  - Debounced search via `setTimeout`
  - Pagination state (`page`, `perPage`, `total`)
  - Bulk action dropdowns with identical `activate`, `suspend`, `archive`, `bypass password change` flows
  - `useEffect(() => setPage(1), [search])` reset pattern
- **Recommendation**: Create a generic `useUserTable` hook in `lib/hooks/` that encapsulates fetching, pagination, and selection state. Create a shared `UserTableShell` component for the toolbar + table wrapper.

#### Duplicated `statusBadgeClass` Logic
- **File**: `app/staff/exams/_components/RecordsTab.tsx:102-116` (inline function)
- **Severity**: Low
- **Type**: Improvement
- **Description**: Exam result-to-badge-color mapping is defined inline. Similar badge logic is scattered across `components/shared/StatusBadge.tsx` and other tab files.
- **Recommendation**: Centralize in `components/shared/StatusBadge.tsx` or a `lib/exams/badge-config.ts` utility.

#### Duplicated Empty Table States
- **Severity**: Low
- **Type**: Improvement
- **Description**: Multiple table components render their own empty-state JSX with icons and text instead of using the shared `EmptyState` component from `components/shared/EmptyState.tsx`.
- **Recommendation**: Standardize on `EmptyState` across all tables.

#### Duplicated `MetricCard` Inline
- **File**: `app/staff/reports/page.tsx:57-110`
- **Severity**: Low
- **Type**: Improvement
- **Description**: `MetricCard` is defined inline in the reports page. A similar card pattern appears in `app/staff/dashboard/page.tsx`.
- **Recommendation**: Extract to `components/shared/MetricCard.tsx` and reuse.

---

### Category: Dead Code

#### `console.error` in Production Code
- **Files**: 32 instances across 18 files including `StudentDetailPanel.tsx`, `EditProfilePhotoDialog.tsx`, `RecordsTab.tsx`, `exams/page.tsx`, `settings/email-previews/page.tsx`, etc.
- **Severity**: Medium
- **Type**: Improvement
- **Description**: Client-side error handling writes directly to the browser console. In production, these are invisible to users and admins. The codebase already uses `sonner` for user-facing toasts.
- **Recommendation**: Replace with `toast.error()` for user-visible errors, or route through a centralized logger if backend reporting is needed.

#### `console.log` in Production Code
- **File**: `app/staff/newsroom/_components/NewsMarkdownEditor.tsx:523, 574, 584`
- **Severity**: Medium
- **Type**: Improvement
- **Description**: Debug logging for image/audio upload responses remains in production code.
- **Recommendation**: Remove or guard with `process.env.NODE_ENV !== 'production'`.

#### Unused Imports
- **Severity**: Low
- **Type**: Improvement
- **Description**: No critical unused imports were found, but several files import large icon sets from `lucide-react` and only use a subset (e.g., `InstructorsTable.tsx` imports 17 icons but uses ~8).
- **Recommendation**: Audit and trim icon imports to reduce bundle size.

---

### Category: Error Boundaries

#### Missing `error.tsx` in Route Segments
- **Count**: 80 directories with `page.tsx` lack `error.tsx`
- **Severity**: High
- **Type**: Improvement
- **Description**: Only the top-level `app/staff/error.tsx` exists. Every nested route segment with a `page.tsx` should have its own `error.tsx` to provide granular error recovery without full-page reloads.
- **Recommendation**: Add `error.tsx` to every directory containing a `page.tsx`. At minimum, cover high-traffic routes: `dashboard`, `users`, `students`, `exams`, `classes`, `courses`, `finance`, `reports`.

#### Missing `not-found.tsx` in Route Segments
- **Count**: 80 directories with `page.tsx` lack `not-found.tsx`
- **Severity**: Medium
- **Type**: Improvement
- **Description**: Only `app/staff/not-found.tsx` exists. Invalid IDs (e.g., `/staff/users/invalid-id`) currently bubble up to the root not-found page rather than showing a context-aware message.
- **Recommendation**: Add `not-found.tsx` to route groups, or at minimum to dynamic route parents (`users/[id]`, `students/[id]`, `classes/[id]`, `courses/[id]`, `exams/events/[id]`).

---

### Category: Naming Conventions

#### Inconsistent Table Component Naming
- **Files**: `UsersTable.tsx`, `StudentsTable.tsx`, `InstructorsTable.tsx`, `ExaminersTable.tsx`
- **Severity**: Low
- **Type**: Suggestion
- **Description**: The shared component prefix is inconsistent: `UsersTable` (plural) vs the pattern used elsewhere for singular entity views.
- **Recommendation**: No immediate action required; this is a minor inconsistency.

#### Mixed Pagination Component Usage
- **Files**: `TablePagination.tsx` (shared) vs inline pagination in `StudentDetailPanel.tsx`, `ExamsTab.tsx`
- **Severity**: Low
- **Type**: Suggestion
- **Description**: Some components use the shared `TablePagination` while others render their own page controls.
- **Recommendation**: Standardize on `TablePagination` across all list views.

---

### Category: Separation of Concerns

#### Monolithic Server Actions File
- **File**: `app/staff/actions.ts`
- **Lines**: 1,015
- **Severity**: High
- **Type**: Improvement
- **Description**: All staff server actions are crammed into one file: user CRUD, enrollment bulk ops, payment bulk ops, exam booking ops, messaging, OJT, calendar events, course management, etc. This creates merge conflicts and makes it hard to locate related logic.
- **Recommendation**: Split by domain into colocated `actions.ts` files (e.g., `app/staff/users/actions.ts`, `app/staff/enrollments/actions.ts`, `app/staff/exams/actions.ts`, `app/staff/finance/actions.ts`). Keep only cross-cutting utilities in the root `actions.ts`.

#### Client Components Fetching Their Own Data
- **Files**: `UsersTable.tsx`, `StudentsTable.tsx`, `InstructorsTable.tsx`, `ExaminersTable.tsx`, and many others
- **Severity**: Medium
- **Type**: Improvement
- **Description**: Client components directly call `fetch('/api/staff/users?...')` instead of receiving data via props from a server component. This bypasses React Server Components, increases client bundle size, and duplicates auth/parsing logic.
- **Recommendation**: Move data fetching to parent server components and pass serialized data + callbacks as props. Use `unstable_cache` for reference data.

#### Server Component with Client-Only Patterns
- **File**: `app/staff/reports/page.tsx`
- **Severity**: Medium
- **Type**: Improvement
- **Description**: The main `ReportsPage` is an async server component, but it renders tab components that each independently call analytics functions. The tab switching is controlled via URL search params rendered client-side, creating a hybrid pattern that is hard to follow.
- **Recommendation**: Keep the server component pattern by prefetching all tab data in parallel with `Promise.all`, or convert tab switching to client-side with a single data-loading boundary.

---

### Category: Component Patterns

#### Underutilized Shared `DataTable`
- **File**: `components/shared/DataTable.tsx`
- **Lines**: 57
- **Severity**: Low
- **Type**: Suggestion
- **Description**: A generic typed `DataTable` exists but is not adopted by most staff tables, which all roll their own `<table>` markup with duplicated header/body/empty-state patterns.
- **Recommendation**: Either enhance `DataTable` to support sorting, selection, and custom cell renderers and migrate tables to it, or deprecate it if the team prefers custom markup.

#### Inconsistent Bulk-Action Patterns
- **Files**: `BulkActionsDropdown.tsx` vs inline action bars in `PaymentsQueue.tsx`, `ReconciliationQueue.tsx`
- **Severity**: Low
- **Type**: Suggestion
- **Description**: Some pages use the shared `BulkActionsDropdown`, while others (PaymentsQueue, ReconciliationQueue) have custom inline action bars with similar functionality.
- **Recommendation**: Consolidate on `BulkActionsDropdown` or extract a `BulkActionBar` that supports both dropdown and inline variants.

#### Mixed `'use client'` in `_components` Nested Directories
- **Severity**: Low
- **Type**: Suggestion
- **Description**: Client components are scattered across `_components/` at multiple nesting levels (`app/staff/_components/`, `app/staff/users/[id]/_components/`, `app/staff/students/[id]/_components/`, etc.). This is not wrong, but makes it harder to distinguish server vs client boundaries at a glance.
- **Recommendation**: Consider a flatter convention: server components in `app/staff/X/page.tsx`, client components in `components/staff/XClient.tsx`, or keep `_components/` but ensure `'use client'` is the very first line in every client file.

---

## Appendix

### Files Audited
- `app/staff/` — 200+ files (pages, components, actions, layouts, loading states)
- `app/staff/_components/` — 39 shared client components
- `app/staff/**/_components/` — 60+ nested feature components
- `components/shared/` — 39 shared UI components
- `lib/` — utilities, Prisma clients, auth helpers, analytics

### Summary Statistics
| Metric | Count |
|--------|-------|
| Files > 500 lines | 24 |
| Missing `error.tsx` | 80 directories |
| Missing `not-found.tsx` | 80 directories |
| `console.error` instances | 32 |
| `console.log` instances | 3 |
| `any` type usages | 100+ |
| Duplicated `slugify` | 6 files |
| Duplicated table fetch pattern | 4 files |

### Total Findings
- Critical: 0
- High: 4
- Medium: 12
- Low: 8
- No Action Needed: 0
