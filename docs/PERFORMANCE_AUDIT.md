# Performance Audit Report — Aerojet Academy

**Date:** 2026-05-04
**Scope:** Full app audit — APIs, SSR, client components, data layer, Vercel Speed Insights
**Metrics:** FCP, LCP, TTFB, CLS, INP

---

## CRITICAL ISSUES (P0)

### 1. Slug lookup loads ALL users into memory

**Files:**
- `app/staff/users/[id]/page.tsx:38-45`
- `app/staff/students/[id]/page.tsx:34-43`

```ts
const allUsers = await prisma.user.findMany({
  select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } }
})
const matchedUser = allUsers.find(u => slugify(name) === id)
```

**Impact:** Every detail page loads the ENTIRE users table into Node.js memory just to resolve a slug. With 10,000 users, this alone could take 5-10 seconds and use 50MB+ RAM per request.

**Fix:** Add a `slug` column to the `Profile` model (or use a computed/stored generated column), index it, and query directly:
```ts
const user = await prisma.profile.findFirst({
  where: { slug: id },
  select: { userId: true }
})
```
Or at minimum, do the filtering in SQL:
```ts
const user = await prismaUnfiltered.$queryRaw`
  SELECT u.id FROM users u
  JOIN profiles p ON p."userId" = u.id
  WHERE lower(concat(p."firstName", '-', p."lastName")) = ${id}
  LIMIT 1
`
```

---

### 2. 56 staff pages with NO loading.tsx (blocking FCP)

**Current coverage:** Only 5 `loading.tsx` files for 61 staff pages.

**Missing `loading.tsx` for heavy pages:**

| Page | Server queries | Est. blocking time |
|------|---------------|-------------------|
| `staff/finance/page.tsx` | 6+ sequential queries via RLS | 3-10s |
| `staff/audit-logs/page.tsx` | 9 sequential queries | 5-15s |
| `staff/students/[id]/page.tsx` | 5+ queries + allUsers scan | 5-20s |
| `staff/users/[id]/page.tsx` | 4+ queries + allUsers scan | 5-20s |
| `staff/scheduling/page.tsx` | 4 sequential queries | 2-5s |
| `staff/exams/page.tsx` (has loading) | 3 heavy queries | 2-5s |
| `staff/enrollments/page.tsx` | 1 heavy include query | 1-3s |
| `staff/classes/page.tsx` | 1 query | 1-2s |
| `staff/courses/page.tsx` | 1 query | 1-2s |
| `staff/courses/[id]/page.tsx` | 2 queries | 1-3s |
| `staff/programmes/page.tsx` | 1 query | 1-2s |
| `staff/newsroom/page.tsx` | 1 query | 1-2s |
| `staff/revision-runs/page.tsx` | 1 query | 1-2s |
| `staff/settings/page.tsx` | 3 queries | 2-5s |
| `staff/license-requirements/page.tsx` | 2 queries | 1-3s |
| `staff/exams/events/[id]/page.tsx` | 2 queries | 1-3s |
| `staff/exams/pools/[id]/page.tsx` | 2 queries | 1-3s |
| `staff/exams/pools/members/page.tsx` | 1 query | 1-2s |

**Fix:** Add `loading.tsx` to every route segment that fetches data server-side. At minimum, the top 10 heaviest pages. But fix all

---

### 3. Sequential queries that should be parallel

**`app/staff/finance/page.tsx`** — `getOverviewChartData()`, `getWalletTopupsData()`, `getTransactionsData()`, `getReportsData()` are called per-tab but `pendingTopupCount` is always called (line 175). The tab-specific functions themselves have sequential queries.

**`app/staff/audit-logs/page.tsx:104-146`** — 8 sequential queries to resolve entity labels:
```ts
const users = await prisma.user.findMany(...)
const courses = await prisma.course.findMany(...)
const events = await prisma.examEvent.findMany(...)
const pools = await prisma.examPool.findMany(...)
const comps = await prisma.examComponent.findMany(...)
const classes = await prisma.class.findMany(...)
const payments = await prisma.payment.findMany(...)
const profiles = await prisma.studentProfile.findMany(...)
```
All of these are independent and should use `Promise.all`.

**`app/staff/scheduling/page.tsx:18-68`** — 4 sequential queries for pathways, programmes, licenseCategories, courses — all independent.

**`app/staff/students/[id]/page.tsx`** — `walletTransactions`, `fullTimeEnrollments`, `modularEnrollments` are sequential.

---

### 4. RLS client used where prismaUnfiltered would work

The RLS extension (`rls-hardened.ts`) wraps every query in a transaction with `set_config()` calls for non-admin users. But for ADMIN/STAFF roles, it skips RLS (line 145-147). The overhead is still: `getSession()` call + role check on every single query.

**Pages using `prisma` (RLS) that should use `prismaUnfiltered`:**
- `app/staff/finance/page.tsx` — staff-only, 6+ queries through RLS
- `app/staff/audit-logs/page.tsx` — staff-only, 8 queries through RLS
- `app/staff/students/[id]/page.tsx` — staff-only, 5+ queries through RLS
- `app/staff/users/[id]/page.tsx` — staff-only, 4+ queries through RLS
- `app/staff/scheduling/page.tsx` — staff-only, 4 queries through RLS
- `app/staff/settings/page.tsx` — staff-only, 3 queries through RLS
- `app/staff/courses/[id]/page.tsx` — staff-only
- `app/staff/programmes/page.tsx` — staff-only
- `app/staff/newsroom/page.tsx` — staff-only
- `app/staff/revision-runs/page.tsx` — staff-only
- `app/staff/license-requirements/page.tsx` — staff-only
- `app/staff/classes/[id]/page.tsx` — staff-only
- `app/staff/exams/events/[id]/edit/page.tsx` — staff-only
- `app/staff/exams/events/[id]/pools/create/page.tsx` — queries event twice

Since RLS already skips for ADMIN/STAFF roles, the overhead is only the `getSession()` call — but that's still one extra async call per query. Using `prismaUnfiltered` eliminates this entirely.

---

## HIGH ISSUES (P1)

### 5. `force-dynamic` overuse prevents caching

22 pages use `export const dynamic = 'force-dynamic'`, which:
- Disables all Next.js caching (ISR, static generation)
- Forces full SSR on every request
- Prevents Vercel Edge caching

Many of these pages (e.g., `staff/settings`, `staff/scheduling`) change rarely and could use `revalidate: 60` or ISR instead.

---

### 6. No `next/dynamic` imports anywhere (0 occurrences)

Heavy client components are always eagerly loaded, bloating the initial JS bundle:

- **TipTap editor** (8 imports in `NewsMarkdownEditor.tsx`) — ~200KB+
- **Recharts** (in `Sparkline.tsx`, various report components) — ~150KB
- **Framer Motion** (51 occurrences across 44 files) — ~100KB
- **react-day-picker** — ~50KB
- **cmdk** (command palette) — ~30KB

These should be loaded via `next/dynamic` with `ssr: false` where appropriate.

---

### 7. Dual toast library — `sonner` (83 files) + `react-hot-toast` (7 files)

Both toast libraries are installed and used:
- `sonner` — 83 imports, used as the global `<Toaster>` in `providers.tsx`
- `react-hot-toast` — 7 imports in staff newsroom, settings, and public pages

`react-hot-toast` is dead weight — its `<Toaster>` isn't even mounted. All 7 files should migrate to `sonner`.

---

### 8. Dead fix scripts in project root

7 temporary fix scripts are committed to the repo:
```
fix_applicant_courses.ts
fix_classes.ts
fix_exams_links.ts
fix_materials.ts
fix_staff_students.ts
fix_staff_users.ts
fix_tabs.ts
```
These add to the build context and should be deleted.

---

### 9. No middleware.ts — no edge-level auth

There is no root `middleware.ts`. Authentication is checked inside every page/API route individually via `getAuthSession()`. This means:
- Unauthenticated requests still hit the serverless function, invoke Prisma, then redirect
- No early termination at the edge
- Extra cold start costs on every protected route

**Fix:** Add a lightweight middleware that checks the session cookie and redirects unauthenticated requests before they reach the serverless function.

---

### 10. Unbounded/large queries without pagination

| File | Query | Issue |
|------|-------|-------|
| `staff/exams/page.tsx:261` | `examBooking.findMany` | `take: 300` — sends 300 bookings with nested includes |
| `staff/enrollments/page.tsx:21` | `enrollment.findMany` | `take: 100` — 100 enrollments with full user+profile+course |
| `staff/finance/page.tsx:78-82` | `payment.findMany` | No limit on pending requests |
| `staff/finance/page.tsx:101-117` | `walletTransaction.findMany` | `take: 100` with 3 levels of includes |
| `staff/finance/page.tsx:57-60` | `payment.findMany` | No limit on 6-month payment history |
| `staff/audit-logs/page.tsx` | Entity label resolution | Loads ALL related entities for 25 log entries |
| `staff/users/[id]/page.tsx:38` | `user.findMany` | **ALL users** (no limit) |
| `staff/students/[id]/page.tsx:34` | `user.findMany` | **ALL students** (no limit) |
| `staff/students/[id]/page.tsx:176` | `user.findMany` | ALL users for referral lookup |

---

### 11. Double query pattern in exam event pages

**`app/staff/exams/events/[id]/page.tsx:30-39`** and **`app/staff/exams/events/[id]/edit/page.tsx:14-23`** both query the same event twice:
```ts
const event = await prismaUnfiltered.examEvent.findUnique({ where: { id } })  // existence check
// ... notFound() check
const event = await prismaUnfiltered.examEvent.findUnique({  // full fetch with includes
```
This is 2 round-trips where 1 would suffice — just fetch with includes and check if null.

Same pattern in `app/staff/exams/events/[id]/pools/create/page.tsx:13-22`.

---

### 12. Student layout — 6 sequential blocking queries

**File:** `app/student/layout.tsx` (lines 23-97)

The student layout blocks ALL 25+ student pages with sequential queries:
```
dbUser → unreadNotifications → unreadMessages → paymentAccessLevel → milestoneStatus → welcomeMessages
```
All are independent and should use `Promise.all`. Also uses RLS `prisma` client.

### 13. Applicant layout — 5 sequential blocking queries

**File:** `app/applicant/layout.tsx` (lines 17-48)

```
dbUser → profile → studentProfile → hasFullTimeEnrollment → (rendering)
```
These can be consolidated into a single `findUnique` with nested selects, or parallelized.

### 14. Student dashboard queries same user twice

**File:** `app/student/page.tsx` (lines 40 and 86)

Two separate `prisma.user.findUnique` calls for the same user — one for profile, one for activity data. Should be a single query.

### 15. Tab pages fetch ALL tab data regardless of active tab

**Files:**
- `app/staff/exams/page.tsx` — Events, Bookings, Results, Records tabs all rendered server-side
- `app/staff/finance/page.tsx` — Overview, Transactions, Wallet-topups, Reconciliation, Reports

The active tab is known from `searchParams`, but all tab components may still execute their data fetching. Only the active tab's data should be fetched.

---

## MEDIUM ISSUES (P2)

### 16. Deep include chains in event operations (memory bomb)

**`lib/events/go-no-go.ts:28-30`** — 4-level nesting: `pools → memberships → user → profile`. For a large event (10 pools x 100 members), this fetches 1,000+ full profile objects just to send notifications. Should batch-fetch only emails.

**`lib/pools/operations.ts:118-156`** — `getPoolWithDetails` has 6-level nested includes with full booking history. Massive memory footprint.

---

### 17. Sequential email sends in cron jobs — timeout risk

**`app/api/cron/send-reminders/route.ts`** — Nested loops: pools → memberships → sequential `sendEmail()` + `notification.create()`. With 50 pools x 100 members = 5,000 sequential I/O ops. Use `Promise.allSettled` + `createMany`.

---

### 18. `revalidatePath` everywhere, no `revalidateTag`

19 files use `revalidatePath` (page-level busting), zero use `revalidateTag` (granular). Single actions invalidate 3-4 entire page trees when tags would be surgical.

---

### 19. Connection pool at 20 — may be tight under load

`lib/prisma/db-base.ts` — pool max 20. During enrollment periods with concurrent traffic, this could exhaust. Consider 30-40 for production.

---

### 20. Images — all use `next/image` (GOOD)

No raw `<img>` tags found. All images properly optimized.

---

### 21. No `Suspense` streaming in any server page

Zero pages use `<Suspense>` boundaries to stream content progressively. Every server component waits for ALL data before sending any HTML. This maximizes TTFB.

**Ideal pattern for heavy pages:**
```tsx
export default async function FinancePage() {
  return (
    <>
      <FinanceHeader />  {/* renders immediately */}
      <Suspense fallback={<ChartSkeleton />}>
        <OverviewCharts />  {/* streams when ready */}
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <TransactionsTable />  {/* streams when ready */}
      </Suspense>
    </>
  )
}
```

---

### 22. Missing caching on frequently-read data

| Data | Read frequency | Cache? | Recommendation |
|------|---------------|--------|----------------|
| Course categories | Every course page load | None | `unstable_cache` 5min |
| License categories | Scheduling, requirements pages | None | `unstable_cache` 5min |
| Academic years/semesters | Multiple pages | None | `unstable_cache` 10min |
| System settings | Every layout + settings page | Partial (welcome messages only) | `unstable_cache` 5min for all settings |
| Payment methods | Public + staff pages | None | `unstable_cache` 5min |
| Exam components list | Multiple exam pages | None | `unstable_cache` 5min |

---

### 23. Import of entire `date-fns` in server components

Multiple server pages import `format` from `date-fns`. While tree-shakeable, in SSR contexts it still adds to the function bundle. Consider using `Intl.DateTimeFormat` for simple date formatting in server components.

---

## LOW ISSUES (P3)

### 24. No `output: 'standalone'` in next.config.ts

Missing `output: 'standalone'` means the entire `node_modules` is deployed. With standalone mode, Next.js traces only the files needed, reducing deployment size by 80%+ and cold start times.

---

### 25. `minimumCacheTTL: 60` for images is too low

In `next.config.ts`, image cache TTL is only 60 seconds. For uploaded profile photos and content images that rarely change, this should be 3600+ (1 hour) to reduce ISR image re-optimization.

---

### 26. Missing `staleWhileRevalidate` headers

The security headers in `next.config.ts` are good, but there are no `Cache-Control` headers for static assets or API responses that could benefit from `stale-while-revalidate`.

---

### 27. Heavy dependencies in bundle

| Dependency | Size | Used in | Recommendation |
|-----------|------|---------|----------------|
| `three` | ~600KB | Unknown (not imported in app/) | **Remove if unused** |
| `shadergradient` | ~200KB | Unknown (not imported in app/) | **Remove if unused** |
| `styled-components` | ~80KB | Unknown | **Remove if unused** — Tailwind is the styling system |
| `framer-motion` | ~100KB | 44 client components | Consider `motion` (lighter) or CSS animations for simple cases |
| `react-hot-toast` | ~15KB | 7 files | **Remove** — migrate to `sonner` |
| `bufferutil` + `utf-8-validate` + `ws` | ~50KB | WebSocket deps | Only needed if WebSockets are active |

---

## API ROUTES AUDIT (137 routes analyzed)

### Critical API Issues

**N+1 Query Patterns:**

| Route | Issue |
|-------|-------|
| `/api/admin/bulk-send-credentials/route.ts` | Loops through users, queries wallet/profile/studentProfile individually inside the loop |
| `/api/cron/send-reminders/route.ts` | Double loop: for each pool, for each membership → individual `sendEmail()` + `notification.create()`. Should batch with `createMany` |
| `/api/staff/enrollments/batch/route.ts` | Linear `.find()` search inside loop instead of using a `Map` |

**Missing Pagination (unbounded queries):**
- `/api/staff/programmes/route.ts` — returns ALL programmes
- `/api/staff/newsroom/route.ts` — returns ALL articles
- `/api/applicant/courses/route.ts` — returns all active courses
- `/api/staff/course-categories/route.ts` — no pagination
- `/api/student/courses/route.ts` — no limit
- `/api/instructor/classes/route.ts` — no pagination
- `/api/applicant/exam-only/exam-components/route.ts` — unbounded

**Missing Caching on Frequently-Hit Endpoints:**

| Route | Impact |
|-------|--------|
| `/api/calendar/[userId]/route.ts` | **CRITICAL** — 9-entity megaquery (events, bookings, semesters, enrollments, classes, sittings, tuition runs, pools, admin events) on every calendar refresh |
| `/api/staff/topbar-items/route.ts` | 5 parallel queries to build pending items, runs on every page load |
| `/api/staff/finance/overview/route.ts` | Complex aggregate queries, no cache |
| `/api/applicant/dashboard/route.ts` | Multiple queries, no cache |
| `/api/student/dashboard/route.ts` | Multiple queries, no cache |
| `/api/applicant/exam-only/pricing/route.ts` | Pricing info changes rarely |
| `/api/exchange-rates/route.ts` | Exchange rates, should cache 1hr+ |

**Unused Count Queries (same pattern we fixed in `/api/staff/users`):**
- `/api/staff/applicants/route.ts` — fetches `allCount`, `pendingPaymentCount`, `pendingApprovalCount` in parallel but some are never used in the response

**Megaquery — Excessive Nested Includes:**
- `/api/staff/students/[id]/route.ts` — single query includes: profile, studentProfile, wallet (with transactions), enrollments (with course + grades), poolMemberships, attendanceRecords (with class), examResults, examBookings, examBundles, bookingEntitlements. Should be split into tab-specific endpoints.

**Sequential Queries That Should Be Parallel:**
- `/api/instructor/dashboard/route.ts` — `recentAttendance` fetched sequentially after `Promise.all` block; should be inside it

**Auth Inconsistencies:**
- Cron routes: `/api/cron/send-reminders/route.ts` has `if (cronSecret && authHeader !== ...)` which allows missing secret (potential bug)
- Staff routes mix manual role checks with `requireStaff()` helper — should standardize

---

## CLIENT COMPONENT ISSUES (CLS & INP)

### CLS — Layout Shift Sources

- **6 staff table components** have loading skeletons with different dimensions than loaded content — causes visible jank. Files: `StudentsTable.tsx`, `UsersTable.tsx`, `ExamBookingsTable.tsx`, `ExaminersTable.tsx`, `InstructorsTable.tsx`, `PendingTopupsTable.tsx`
- **BulkActionsBar/Dropdown** appears/disappears without reserved space, shifting content
- **Tab switching** in `StudentDetailTabs.tsx` changes panel height without `min-height`

### INP — Interaction Bottlenecks

- **Entire list re-renders on single-item change** — `StudentsTable.tsx:392-469` and `ExamBookingsTable.tsx:202-327` re-render ALL rows when one checkbox is toggled. Fix: extract row to `React.memo` component
- **Missing `useCallback`** on `toggleAll`/`toggleOne` in `ExamBookingsTable.tsx:81-91` — passed to children, causes cascading re-renders
- **Missing `useMemo`** on `paged` array in `StudentsTable.tsx` and `UsersTable.tsx` — recalculated on every render

### Duplicate Code — 6 Nearly Identical Table Components

70%+ code duplication across 6 table components in `app/staff/_components/`:
- Same useState pattern (search, page, perPage, selectedIds, loading)
- Same useCallback fetch pattern with 350ms debounce
- Same TablePagination + BulkActions + Search UI

**Recommendation:** Extract reusable `DataTable<T>` component and `useFetchData` hook — estimated 40% code reduction.

### Dead Code in Client Components

- `components/shared/Modal.tsx:6` — unused `animate` import from framer-motion
- `app/staff/_components/StudentDetailPanel.tsx:104-106` — unused `slugify()` function

---

## VERCEL SPEED INSIGHTS FACTOR SUMMARY

| Factor | Current Status | Issues |
|--------|---------------|--------|
| **TTFB** | Very poor on data-heavy pages | Sequential SSR queries, RLS overhead, no middleware, no caching |
| **FCP** | 56.8s on /staff/users (was) | Missing loading.tsx on 56 pages, blocking layout queries |
| **LCP** | 57.1s on /staff/users (was) | Same root causes as FCP; no image optimization |
| **CLS** | Likely moderate | Tab content loads client-side (height changes), no image dimensions |
| **INP** | Likely moderate | Framer Motion animations, no virtualization on large tables |

---

## PRIORITY FIX ORDER

### Tier 1 — Immediate (highest impact, lowest effort)
1. **Add `loading.tsx` to all heavy staff/student/applicant pages** — instant FCP fix
2. **Fix slug lookup** — SQL-level filtering instead of loading all users into memory
3. **Parallelize ALL layout queries** — staff, student, applicant layouts (Promise.all)
4. **Parallelize page queries** — audit-logs (8 queries), scheduling (4), finance, student detail
5. **Switch all staff pages to `prismaUnfiltered`** — eliminate RLS overhead

### Tier 2 — High impact
6. **Consolidate applicant layout queries** — 5 separate queries → 1 findUnique with nested selects
7. **Move notification/message counts to client-side** in student layout
8. **Fix student dashboard** — deduplicate the double user query
9. **Add `next/dynamic`** for TipTap, Recharts, chart components
10. **Add `unstable_cache`** to reference data (categories, license, settings, pricing, exchange rates)

### Tier 3 — Cleanup & optimization
11. **Remove `react-hot-toast`** — migrate 7 files to `sonner`
12. **Delete 7 dead `fix_*.ts` scripts** in root
13. **Fix tab pages** — only fetch data for active tab (exams, finance)
14. **Add calendar endpoint caching** — 9-entity query needs `unstable_cache`
15. **Fix N+1 patterns** — bulk credentials, cron reminders, batch enrollment
16. **Remove unused count queries** from `/api/staff/applicants`
17. **Add pagination** to 7 unbounded API routes

### Tier 4 — Infrastructure
18. **Add edge middleware** for auth (redirect unauthenticated before serverless)
19. **Add `@next/bundle-analyzer`** to profile actual bundle sizes
20. **Audit unused deps** — three, shadergradient, styled-components
21. **Add `output: 'standalone'`** to next.config.ts
22. **Increase image cache TTL** to 3600s
