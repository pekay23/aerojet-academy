# Staff Portal — Performance & Architecture Audit
Date: 2026-08-27
Auditor: Performance Auditor Agent

## Executive Summary

The Staff portal broadly follows the project's performance conventions: every server component uses `prismaUnfiltered`, `Promise.all` is used correctly in most orchestrators, and heavy chart libraries are dynamically imported in the Reports and Dashboard modules. However, the audit identified material gaps in **pagination** (several list pages load full tables), **caching** (analytics report functions hit the database on every request), **query consolidation** (duplicate `findUnique` calls for the same record in metadata + page body), and **bundle splitting** (the Analytics dashboard loads all Recharts sub-components in a single client chunk). One `loading.tsx` is also missing.

## Findings

### Query Optimization

#### Full-table loads on list pages
- **File**: `app/staff/classes/page.tsx`
- **Lines**: 16-48
- **Severity**: High
- **Type**: Improvement
- **Description**: The Classes list loads every class with `findMany({ orderBy: { startDate: 'desc' } })` and no `take`/`skip`. As the academy grows this will degrade render time and memory.
- **Recommendation**: Add `take` (e.g. 50-100) and cursor/offset pagination. Use the existing `TablePagination` component pattern seen in other tables.
- **Code Reference**:
  ```ts
  const classes = await prismaUnfiltered.class.findMany({
    select: { ... },
    orderBy: { startDate: 'desc' },
    // missing take/skip
  })
  ```

#### Records tab loads all bookings + results into JS
- **File**: `app/staff/exams/page.tsx`
- **Lines**: 510-667
- **Severity**: High
- **Type**: Improvement
- **Description**: `RecordsTabServer` fetches ALL `examBooking` and `examResult` rows without `take`/`skip`, then merges and sorts them in memory, finally slicing to 2000. This is an unbounded query that will time out on large datasets.
- **Recommendation**: Add `take`/`skip` (or cursor) to both `findMany` calls. Move merge/sort logic to a server action or paginated API if the unified view must support deep paging.
- **Code Reference**:
  ```ts
  const [bookingsRaw, resultsRaw, modules] = await Promise.all([
    prismaUnfiltered.examBooking.findMany({ ... }), // no take/skip
    prismaUnfiltered.examResult.findMany({ ... }),  // no take/skip
    getAvailableModules(),
  ])
  // ...
  const finalRecords = unifiedRecords.sort(...).slice(0, 2000)
  ```

#### Sequential slug resolution before class fetch
- **File**: `app/staff/classes/[id]/page.tsx`
- **Lines**: 37-42
- **Severity**: Medium
- **Type**: Improvement
- **Description**: When the ID is a slug, the page loads **all** classes (`findMany({ select: { id: true, name: true } })`) into memory just to match a name, then fetches the target class. This is a full-table scan in application code.
- **Recommendation**: Use a SQL slug-resolve query (like `users/[id]/page.tsx` and `students/[id]/page.tsx` already do) or add a unique `slug` column.
- **Code Reference**:
  ```ts
  if (id.length < 20) {
    const allBasicClasses = await prismaUnfiltered.class.findMany({ select: { id: true, name: true } })
    const matchedClass = allBasicClasses.find(c => slugify(c.name) === id)
    if (matchedClass) targetId = matchedClass.id
  }
  ```

#### Sequential slug resolution in edit page
- **File**: `app/staff/classes/[id]/edit/page.tsx`
- **Lines**: 24-28
- **Severity**: Medium
- **Type**: Improvement
- **Description**: Same anti-pattern as the class detail page — loads all classes into JS memory for slug resolution before the parallel `Promise.all` block.
- **Recommendation**: Replace with a parameterised SQL query or a slug column.

#### Sequential count before tab render
- **File**: `app/staff/finance/page.tsx`
- **Lines**: 216-218
- **Severity**: Low
- **Type**: Improvement
- **Description**: `pendingTopupCount` is awaited sequentially before the `FinanceTabs` shell renders, blocking the initial paint of the finance page even though the count is only needed for a badge.
- **Recommendation**: Move the count into the `WalletTopupsTab` server component so the shell renders immediately, or fetch it in parallel with the active-tab data.

#### Unbounded payment scan for chart aggregation
- **File**: `app/staff/finance/page.tsx`
- **Lines**: 60-78
- **Severity**: Medium
- **Type**: Improvement
- **Description**: `getOverviewChartData` pulls every approved payment since `sixMonthsAgo` with no `take` limit. For high-volume academies this returns thousands of rows only to aggregate them in JS.
- **Recommendation**: Use a SQL-level `GROUP BY` (e.g. `prismaUnfiltered.$queryRaw`) or a cached helper that returns pre-aggregated monthly buckets.

#### Reports RevenueTab scans all approved payments
- **File**: `app/staff/reports/page.tsx`
- **Lines**: 399-402 (calls `getRevenueReport`)
- **Severity**: Medium
- **Type**: Improvement
- **Description**: `getRevenueReport` (`lib/analytics/reports.ts:38-78`) fetches all approved payments for the chart plus a separate recent-payments list. The chart aggregation iterates in JS.
- **Recommendation**: Move the monthly rollup into a cached SQL query or a materialised view.

#### Exams analytics scans all bookings and results
- **File**: `app/staff/reports/page.tsx`
- **Lines**: 851-852 (calls `getExamAnalytics`)
- **Severity**: High
- **Type**: Improvement
- **Description**: `getExamAnalytics` (`lib/analytics/reports.ts:456-721`) loads every `examBooking` and `examResult` row with no pagination, then merges/sorts in memory.
- **Recommendation**: Add `take` limits or compute aggregates in SQL. For the full historical view, consider a nightly aggregated snapshot table.

---

### RLS Overhead

- **Status**: No issues found.
- All `app/staff/` server components and `lib/analytics/*` helpers correctly import `prismaUnfiltered` from `lib/prisma/client`. The RLS client (`prisma`) is not used anywhere in the staff portal.

---

### Caching

#### Analytics report functions are uncached
- **File**: `lib/analytics/reports.ts`
- **Lines**: 16-838
- **Severity**: High
- **Type**: Improvement
- **Description**: None of the 11 report helpers (`getEnrollmentTrends`, `getRevenueReport`, `getPoolAnalytics`, `getAttendanceReport`, `getFinanceReportSummary`, `getRevenueByProgrammeType`, `getPaymentMethodBreakdown`, `getMonthlyRevenueData`, `getPaymentStatusBreakdown`, `getCriticalAlerts`, `getExamAnalytics`, `getYoYComparison`) use `unstable_cache`. The Reports page (`reports/page.tsx`) calls these on every request.
- **Recommendation**: Wrap each function in `unstable_cache` with an appropriate TTL (e.g. 300s for operational reports, 3600s for YoY). Add tag-based invalidation where data changes (e.g. `revalidateTag('reports')` after payment approval).

#### Dashboard metrics are uncached
- **File**: `lib/analytics/metrics.ts`
- **Lines**: 23-279
- **Severity**: High
- **Type**: Improvement
- **Description**: `getDashboardMetrics`, `getTopCourses`, `getBehavioralMetrics`, and `getAttendanceRate` run raw aggregates on every request with no caching.
- **Recommendation**: Cache `getDashboardMetrics` and `getTopCourses` for 5 minutes. `getBehavioralMetrics` can be cached for 15-30 minutes. `getAttendanceRate` should be cached per-user or per-class for 5 minutes.

#### Reference data caching is healthy
- **File**: `lib/cached-queries.ts`
- **Lines**: 1-74
- **Severity**: No Action Needed
- **Type**: Improvement
- **Description**: Course categories, license categories, academic years, semesters, exam components, and active courses are all cached via `unstable_cache` with sensible TTLs (1h for structure, 5min for operational).

#### Dashboard alerts are cached
- **File**: `lib/analytics/dashboard-alerts.ts`
- **Lines**: 172-175
- **Severity**: No Action Needed
- **Type**: Improvement
- **Description**: `getDashboardAlerts` uses `unstable_cache` with a 5-minute TTL and tag-based revalidation. This is the correct pattern.

---

### Dynamic Imports

#### Analytics dashboard bundles all Recharts sub-components
- **File**: `app/staff/analytics/AnalyticsDashboardClient.tsx`
- **Lines**: 1-101
- **Severity**: High
- **Type**: Improvement
- **Description**: The client component imports `MetricsOverview`, `FunnelAnalysis`, `RetentionAnalysis`, `FeatureAdoption`, `PageViews`, and `UserJourney` directly. Each of these imports Recharts components (`BarChart`, `ResponsiveContainer`, etc.). Because `AnalyticsDashboardClient` is not itself dynamically imported, the entire Recharts bundle for all 6 tabs lands in the initial client chunk.
- **Recommendation**: Dynamically import each tab component with `next/dynamic` and `ssr: false`, matching the pattern already used in `ReportCharts.tsx` and `YoYCharts.tsx`.
- **Code Reference**:
  ```ts
  import MetricsOverview from './_components/MetricsOverview'
  import FunnelAnalysis from './_components/FunnelAnalysis'
  // ... all imported statically
  ```

#### Good: Reports and Dashboard charts are split
- **Files**: `app/staff/_components/DashboardCharts.tsx`, `app/staff/reports/_components/ReportCharts.tsx`, `app/staff/reports/_components/YoYCharts.tsx`
- **Severity**: No Action Needed
- **Type**: Improvement
- **Description**: RevenueChart, EnrollmentChart, PoolFillChart, AttendanceChart, ExamTrendChart, ScoreDistributionChart, Sparkline, and all YoY charts are dynamically imported with skeleton placeholders. This is the correct pattern.

#### Good: TipTap editor is deferred
- **Files**: `app/staff/newsroom/create/page.tsx`, `app/staff/newsroom/[id]/edit/page.tsx`
- **Severity**: No Action Needed
- **Type**: Improvement
- **Description**: `NewsMarkdownEditor` (TipTap) is loaded via `dynamic(() => import('../_components/NewsMarkdownEditor'), { ssr: false })`.

#### Good: Email previews tab is deferred
- **File**: `app/staff/settings/_components/EmailPreviewsTab.tsx`
- **Severity**: No Action Needed
- **Type**: Improvement
- **Description**: The heavy EmailPreviewsPage is dynamically imported, keeping other Settings tabs snappy.

---

### Pagination

#### Classes list has no pagination
- **File**: `app/staff/classes/page.tsx`
- **Lines**: 16-48
- **Severity**: High
- **Type**: Improvement
- **Description**: `findMany` without `take` or `skip` returns every class row.
- **Recommendation**: Add `take` + `skip` (or cursor) and wire up `TablePagination`.

#### Enrollments list capped at 100 with no paging UI
- **File**: `app/staff/enrollments/page.tsx`
- **Lines**: 21-49
- **Severity**: Medium
- **Type**: Improvement
- **Description**: `take: 100` is present but there is no skip/pagination mechanism or total count exposed to the client.
- **Recommendation**: Add `count` query, pass `total` to `EnrollmentsTable`, and render `TablePagination`.

#### Finance wallet top-ups: pending requests unbounded
- **File**: `app/staff/finance/page.tsx`
- **Lines**: 81-85
- **Severity**: Medium
- **Type**: Improvement
- **Description**: `pendingRequests` loads all pending wallet top-ups with no `take` limit.
- **Recommendation**: Add `take: 50` and pagination.

#### Exams RecordsTab unbounded
- **File**: `app/staff/exams/page.tsx`
- **Lines**: 510-667
- **Severity**: High
- **Type**: Improvement
- **Description**: See "Query Optimization" finding above. Both bookings and results are unbounded.

---

### Query Consolidation

#### Duplicate `findUnique` for exam event in metadata + page
- **Files**: `app/staff/exams/events/[id]/page.tsx`, `app/staff/exams/events/[id]/edit/page.tsx`, `app/staff/exams/events/[id]/pools/create/page.tsx`
- **Lines**:
  - `events/[id]/page.tsx`: 31 and 40
  - `events/[id]/edit/page.tsx`: 14 and 23
  - `events/[id]/pools/create/page.tsx`: 13 and 22
- **Severity**: Medium
- **Type**: Improvement
- **Description**: `generateMetadata` runs a `findUnique` for the event, then the page component runs a second `findUnique` for the same record (often with a richer `include`). This doubles the query for the same entity.
- **Recommendation**: Pass the event data from `generateMetadata` to the page component via a cache key or fetch the richer record once in the page and derive metadata from it.

#### Duplicate class lookup for slug resolution
- **File**: `app/staff/classes/[id]/page.tsx` and `app/staff/classes/[id]/edit/page.tsx`
- **Lines**: 39-42 and 25-28
- **Severity**: Medium
- **Type**: Improvement
- **Description**: Both pages load all classes into memory to resolve a slug, then fetch the target class. This is both a query-consolidation and a query-optimization issue.
- **Recommendation**: Replace with a single SQL slug lookup (see `users/[id]/page.tsx:36-54` for the pattern).

---

### Loading States

#### Missing `loading.tsx` on OJT preview
- **File**: `app/staff/ojt/preview/page.tsx`
- **Lines**: 1-127
- **Severity**: Low
- **Type**: Bug
- **Description**: The page is a static sample preview with no data fetch, but CLAUDE.md requires every route segment with a `page.tsx` that fetches data server-side to have a `loading.tsx`. While this specific page has no fetch, the parent directory convention is broken.
- **Recommendation**: Add a minimal `loading.tsx` skeleton or remove the `page.tsx` and render the preview from a client route if it never fetches server data.

---

### Bundle Size

#### Analytics tab chart components not code-split
- **File**: `app/staff/analytics/AnalyticsDashboardClient.tsx`
- **Lines**: 1-101
- **Severity**: High
- **Type**: Improvement
- **Description**: All six analytics tabs (`MetricsOverview`, `FunnelAnalysis`, `RetentionAnalysis`, `FeatureAdoption`, `PageViews`, `UserJourney`) are statically imported. Each tab contains Recharts components. Because the parent is not dynamically imported, users download the Recharts bundle for all tabs even if they only view one.
- **Recommendation**: Convert each tab content component to a `dynamic()` import inside `AnalyticsDashboardClient`, or wrap the entire client in `dynamic()` with a skeleton. This matches the existing pattern in `ReportCharts.tsx` and `YoYCharts.tsx`.

#### Good: RevenueChart deferred through DashboardCharts
- **Files**: `app/staff/_components/DashboardCharts.tsx`, `app/staff/_components/RevenueChart.tsx`
- **Severity**: No Action Needed
- **Type**: Improvement
- **Description**: `DashboardCharts` uses `dynamic(() => import('./RevenueChart'))`, keeping the ~200KB Recharts bundle out of the main dashboard chunk.

---

## Appendix

- Files audited: 100 `page.tsx` files under `app/staff/`, plus `app/staff/layout.tsx`, `app/staff/actions.ts`, `lib/prisma/client.ts`, `lib/cached-queries.ts`, `lib/analytics/metrics.ts`, `lib/analytics/reports.ts`, `lib/analytics/dashboard-alerts.ts`, and shared client components in `app/staff/_components/`, `app/staff/analytics/_components/`, `app/staff/reports/_components/`.
- Total findings: 14
