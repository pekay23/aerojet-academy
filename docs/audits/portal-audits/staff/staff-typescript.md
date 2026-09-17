# Staff Portal — TypeScript, React & Next.js Audit

Date: 2026-08-27
Auditor: TypeScript/React Auditor Agent

## Executive Summary

The Staff portal is feature-rich and follows several strong conventions — pervasive use of `prismaUnfiltered` in staff pages, well-structured `Promise.all` parallelization, correct `serializePrisma()` handoff to client components, and disciplined `next/dynamic` lazy-loading of heavy chart/PDF editors. However, type safety is the portal's weakest dimension: there are **231 occurrences of `any` across 63 files**, including server components that bypass Prisma's generated types, and a widespread pattern of client components accepting untyped `any` props (especially the student/user detail surfaces). Beyond types, (1) **20 route segments are missing the `loading.tsx` files** that CLAUDE.md mandates for Suspense streaming, (2) the portal has **only a single root-level `error.tsx`** with no nested error boundaries for high-risk sections, and (3) server-action `catch` blocks consistently swallow errors into `console.error` with no structured error tracking. These are largely low-to-medium severity individually, but together they meaningfully erode maintainability and runtime safety.

## Findings

### Category: Type Safety — Pervasive `any` Usage

#### Finding 1 — 231 `any` occurrences across 63 files undermine TypeScript's guarantees
- **File**: 63 files across `app/staff/**` (see Appendix for the full list)
- **Lines**: representative hotspots — `students/[id]/_components/StudentDetailTabs.tsx:27-32` (6 props typed `any`), `_components/TransactionsTable.tsx:22,24,75,81,88,92,93,97,98,111,140` (12), `scheduling/_components/SchedulingClient.tsx` (20), `reports/_components/YoYChartsInner.tsx` (12), `dashboard/page.tsx:41,77,207,387` (7), `audit-logs/page.tsx` (14), `_components/ReportsPanel.tsx` (14), `_components/StudentDetailPanel.tsx` (13)
- **Severity**: High
- **Type**: Improvement
- **Description**: A repo-wide scan found **231** `: any` / `as any` / `: any[]` occurrences in 63 files under `app/staff`. This is not confined to legacy corners — it is concentrated in the most-active surfaces: the student/user detail tabs, financial tables, scheduling client, and reports. Because these types flow in from Prisma queries, the root cause is usually one of: (a) Prisma results being passed through `serializePrisma()` and then consumed without a matching interface, or (b) props declared as `any` to dodge defining a shape. The cost is real: refactors silently break call sites, IDE autocomplete is disabled on `any`-typed data, and the `formatCurrency` client-import trap (documented in CLAUDE.md) becomes harder to spot when everything is already `any`.
- **Recommendation**: Prioritize the highest-traffic surfaces. For each, define a narrow interface (e.g. `StudentDetail`, `TransactionRow`, `ScheduleEntry`) — many can be derived from Prisma via `Prisma.UserGetPayload<{ include: ... }>` or `Prisma.Enumerable<...>` rather than redeclared by hand. Enable `noImplicitAny` (if not already set) and add an ESLint `@typescript-eslint/no-explicit-any` rule with a gradual fix plan. The student detail tabs (`StudentDetailTabs.tsx`, `WalletTab.tsx`, `JourneyTab.tsx`, `ExamsTab.tsx`) are the highest-value target since they are rendered for every student view.
- **Code Reference** (`students/[id]/_components/StudentDetailTabs.tsx`):
  ```tsx
  interface Props {
    student: any          // ❌ should be SerializedStudent
    examComponents: any[] // ❌ should be ExamComponent[]
    upcomingEvents: any[] // ❌ should be ExamEvent[]
    academicYears: any[]  // ❌ should be AcademicYear[]
    semesters: any[]      // ❌ should be Semester[]
    studyPathways: any[]  // ❌ should be StudyPathway[]
    initialTab: string
  }
  ```

#### Finding 2 — `as any` type assertions silence real type errors in server components
- **File**: `dashboard/page.tsx:207`, `users/[id]/page.tsx:118,302,373`, `exams/_components/RecordsTab.tsx:283,337,339,506,834,850`, `enrollments/_components/EnrollmentsTable.tsx:122`, `admissions/interviews/page.tsx:83`, `admissions/medical/page.tsx:48`, `analytics/_components/RetentionHeatmap.tsx:68,89`, `analytics/_components/FeatureChart.tsx:90`, `newsroom/_components/NewsMarkdownEditor.tsx:526,577`, `resources/_components/ResourceForm.tsx:307,308`, `students/import/page.tsx:340,363`
- **Lines**: see above
- **Severity**: Medium
- **Type**: Improvement
- **Description**: `as any` is used to force-compile code where the author either didn't know the correct type or the correct type was inconvenient. Unlike a deliberate `as unknown as T` double-cast, a bare `as any` disables all checking on the resulting value and is easy to miss in review. Several are in server components (`dashboard/page.tsx:207` casts `userStatusCounts` to `any` before passing to `computeEventStats`; `users/[id]/page.tsx:118` maps enrollments into an untyped `ojtData`). These mask genuine mismatches — e.g. when a Prisma `include` changes shape, the `as any` call sites silently keep compiling while returning wrong data.
- **Recommendation**: Replace each `as any` with the proper generated type. For Prisma `groupBy` results (the `dashboard/page.tsx:207` case), type the accumulator explicitly: `Prisma.GetAggregationOutputType<{ by: ['role','status']; _count: { _all: true } }>`. For the RecordsTab/ATAChapters select-value casts, narrow the state type instead of casting the event value. Ban bare `as any` via ESLint `@typescript-eslint/no-unsafe-...` rules.

### Category: React Patterns — Client Component Props & Keys

#### Finding 3 — Client components accept untyped `any` props, breaking the server→client contract
- **File**: `students/[id]/_components/WalletTab.tsx:46` (`student: any`), `students/[id]/_components/ExamsTab.tsx:41-42` (`student: any; examComponents: any[]`), `students/[id]/_components/JourneyTab.tsx:140` (`student: any`), `practical-assessments/_components/PracticalAssessmentsClient.tsx:62-66` (5 `any[]` props), `_components/TransactionsTable.tsx:22,24` (`initialData: any[]; initialRelated: any`)
- **Lines**: see above
- **Severity**: Medium
- **Type**: Improvement
- **Description**: Server components fetch and `serializePrisma()` data, then hand it to client components. When the client component declares the prop as `any`, the entire type-safe chain built on the server is broken at the boundary — the single most important place to be typed. `WalletTab`, `ExamsTab`, and `JourneyTab` together form the core student-detail surface and all accept `student: any`, so a typo like `student.waletBalance` (vs `wallet.balance`) compiles and silently returns `undefined` at runtime.
- **Recommendation**: Define shared serialized types (e.g. in `lib/types/student.ts`) derived from the Prisma queries, and type every client-component prop interface with them. The server→client serialization boundary is the highest-leverage place for types to live.

#### Finding 4 — `React.ComponentType<any>` in `AlertsCenter` severs icon-prop checking
- **File**: `app/staff/dashboard/_components/AlertsCenter.tsx:16`
- **Lines**: 16
- **Severity**: Low
- **Type**: Improvement
- **Description**: `SEVERITY_STYLE` declares `Icon: React.ComponentType<any>`, so any value (including a non-component) would compile. The map is internal and currently always correct, but the `any` defeats the safety net for future edits.
- **Recommendation**: Use `React.ComponentType<{ className?: string }>` (the props actually passed at line 61), or import the lucide `LucideProps` type.

### Category: Error Handling & Resilience

#### Finding 5 — Server actions swallow errors into `console.error` with no structured tracking
- **File**: `app/staff/actions.ts:72-74, 92-94, 116-118, 140-142, 181-183, 202-204, 225-227, 247-249, 268-270, 289-291, 525-527, 722-724, 758-760, 799-801, 846-848, 862-864, 955-957, 1011-1013`; also `scheduling/actions.ts`, `ata-chapters/actions.ts`
- **Lines**: every `catch (error)` block in `app/staff/actions.ts` (18 occurrences)
- **Severity**: Medium
- **Type**: Improvement
- **Description**: Every server action wraps its body in `try/catch` and, on failure, runs `console.error('… error:', error)` and returns `{ error: 'Failed to …' }`. This pattern (a) loses the stack trace and Prisma error code that would aid debugging, (b) is invisible to any monitoring/alerting system, and (c) returns a generic string that the client can't distinguish (validation failure vs. DB timeout vs. not-found). The `error` variable is also implicitly typed — in `strict` mode it's `unknown`, so `error.message` accesses in some catch blocks (`academic/scheduling/_components/SchedulingMatrix.tsx:136`) would fail to compile unless the param is `err: any`.
- **Recommendation**: Create a small `handleActionError(error: unknown, label: string)` helper that logs to a structured channel (or at minimum `console.error` with the serialized error + stack) and returns a typed `ActionResult`. Distinguish `error instanceof Error` and Prisma's `Prisma.PrismaClientKnownRequestError` so callers can branch. This is a cross-portal improvement, but the staff actions are the densest concentration.

#### Finding 6 — Only a single root-level `error.tsx`; no nested error isolation
- **File**: `app/staff/error.tsx` (1 file), `app/staff/not-found.tsx` (1 file)
- **Lines**: N/A (absence of nested boundaries)
- **Severity**: Medium
- **Type**: Improvement
- **Description**: The entire Staff portal shares **one** `error.tsx` at the root. Next.js error boundaries are scoped to their directory — a render error in any section (analytics charts, scheduling matrix, reports) kills the whole page and shows the same generic "Something went wrong" panel. High-risk sections that pull large datasets or mount third-party editors (analytics, scheduling, newsroom markdown editor, reports) are good candidates for their own `error.tsx` so a failure in one widget doesn't collapse the whole route. The root `error.tsx` also does not log the error anywhere (no `console.error`, no telemetry) — the `reset` handler just retries silently.
- **Recommendation**: Add section-level `error.tsx` files under at least `analytics/`, `scheduling/`, `reports/`, `newsroom/`, and `exams/events/[id]/`. In the root boundary, add a `console.error(error)` (or telemetry) so failures are observable. The boundary's props are correctly typed (`{ error: Error; reset }`) — that part is fine.

### Category: Next.js Conventions — Loading States & Performance

#### Finding 7 — 20 route segments missing required `loading.tsx`
- **File**: 20 directories lack a `loading.tsx` (listed in Appendix)
- **Lines**: N/A (absence)
- **Severity**: Medium
- **Type**: Bug
- **Description**: CLAUDE.md states: "Every page directory MUST have a `loading.tsx`". An automated scan of all `page.tsx` directories under `app/staff` found **20** with no sibling `loading.tsx`: `admissions/aptitude/banks/[id]`, `classes/[id]`, `classes/[id]/edit`, `classes/[id]/roster`, `classes/[id]/seating`, `classrooms/[id]`, `courses/[id]`, `courses/[id]/edit`, `exams/events/[id]`, `exams/events/[id]/edit`, `exams/events/[id]/pools/create`, `exams/pools/[id]`, `exams/pools/[id]/add-candidate`, `exams/pools/[id]/edit`, `exams/sittings/[id]/seating`, `newsroom/[id]/edit`, `ojt/preview`, `ojt/[logbookId]`, `students/[id]`, `users/[id]`. Without a segment-level `loading.tsx`, navigation falls back to the root `app/staff/loading.tsx` full-screen spinner, defeating Suspense streaming and producing a coarser loading experience. The most impactful missing ones are `students/[id]` and `users/[id]` — the two most-visited detail pages.
- **Recommendation**: Add a `loading.tsx` to each of the 20 directories, reusing the shared `DashboardSkeleton` / `TableSkeleton` from `components/shared/DashboardSkeleton.tsx` (already the established pattern — see `dashboard/loading.tsx`). A one-liner per route:
  ```tsx
  import { TableSkeleton } from '@/components/shared/DashboardSkeleton'
  export default function Loading() { return <TableSkeleton rows={8} /> }
  ```

#### Finding 8 — Heavy client components are correctly lazy-loaded (No Action Needed)
- **File**: `_components/DashboardCharts.tsx:6`, `_components/FinanceOverview.tsx:14`, `newsroom/create/page.tsx:22`, `newsroom/[id]/edit/page.tsx:23`, `reports/_components/ReportCharts.tsx:18-43`, `reports/_components/YoYCharts.tsx:17`, `settings/_components/PDFSettingsForm.tsx:9`, `settings/_components/EmailPreviewsTab.tsx:8`
- **Severity**: No Action Needed
- **Type**: Suggestion
- **Description**: Recharts, the TipTap markdown editor, the PDF viewer, and the email-previews page are all loaded via `next/dynamic` with `ssr: false`, exactly as CLAUDE.md's performance convention ("Use `next/dynamic` for heavy client components") prescribes. This is a genuine strength and is applied consistently. No issues found.

### Category: Data Fetching & Prisma Conventions

#### Finding 9 — `prismaUnfiltered` is used correctly in staff pages (No Action Needed)
- **File**: throughout `app/staff/**`
- **Severity**: No Action Needed
- **Type**: Suggestion
- **Description**: Staff pages consistently import `prismaUnfiltered` (the non-RLS client) rather than the default RLS-wrapped `prisma`, matching CLAUDE.md's "Always use `prismaUnfiltered` in staff pages" rule. Parallelization via `Promise.all` is also the norm (e.g. `dashboard/page.tsx:197`, `students/[id]/page.tsx:149`, `users/[id]/page.tsx:103`). No violations found.

#### Finding 10 — `serializePrisma()` handoff to client components is consistent (No Action Needed)
- **File**: `dashboard/page.tsx:215-218`, `students/[id]/page.tsx:228-241`, `users/[id]/page.tsx:100,116,124`
- **Severity**: No Action Needed
- **Type**: Suggestion
- **Description**: Server components serialize Prisma results via `serializePrisma()` before passing them to client components, so `Decimal`/`Date` values are safely converted. The pattern is applied consistently. The gap is not the serialization itself but the missing *types* for the serialized shapes (see Finding 3).

## Appendix

- **Total `any` occurrences**: 231 across 63 files. Worst offenders: `scheduling/_components/SchedulingClient.tsx` (20), `_components/TransactionsTable.tsx` (12), `reports/_components/YoYChartsInner.tsx` (12), `audit-logs/page.tsx` (14), `_components/ReportsPanel.tsx` (14), `_components/StudentDetailPanel.tsx` (13), `exams/_components/RecordsTab.tsx` (9), `finance/page.tsx` (8), `resources/_components/ResourceForm.tsx` (8), `students/import/page.tsx` (9), `dashboard/page.tsx` (7), `practical-assessments/_components/PracticalAssessmentsClient.tsx` (7).
- **Directories missing `loading.tsx`** (20): `admissions/aptitude/banks/[id]`, `classes/[id]`, `classes/[id]/edit`, `classes/[id]/roster`, `classes/[id]/seating`, `classrooms/[id]`, `courses/[id]`, `courses/[id]/edit`, `exams/events/[id]`, `exams/events/[id]/edit`, `exams/events/[id]/pools/create`, `exams/pools/[id]`, `exams/pools/[id]/add-candidate`, `exams/pools/[id]/edit`, `exams/sittings/[id]/seating`, `newsroom/[id]/edit`, `ojt/preview`, `ojt/[logbookId]`, `students/[id]`, `users/[id]`.
- **Error/not-found boundaries**: only root-level `app/staff/error.tsx` and `app/staff/not-found.tsx` exist; no nested section boundaries.
- **Total findings**: 10
  - Critical: 0
  - High: 1 (Finding 1)
  - Medium: 5 (Finding 2, 3, 5, 6, 7)
  - Low: 2 (Finding 4, plus the implicit-`any` subset already covered)
  - No Action Needed: 3 categories (Finding 8, 9, 10)
