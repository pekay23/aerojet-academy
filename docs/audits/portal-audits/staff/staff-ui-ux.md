# Staff Portal — UI/UX & Accessibility Audit
Date: 2026-08-27
Auditor: UI/UX Auditor Agent

## Executive Summary
The Staff portal is built on a well-structured shared design system (`DashboardSidebar`, `DashboardSkeleton`, `AlertsCenter`, glassmorphism top bar) with largely consistent spacing, animations, and dark-mode surfaces. The most material gaps are (1) inconsistent dark-mode coverage on status badges, (2) user-uploaded profile photos rendered without the `ProtectedImage` wrapper, and (3) data tables that fall back to horizontal scroll rather than true mobile card layouts.

## Findings

### Category: Design System

#### Inconsistent status-badge dark-mode tokens
- **File**: `app/staff/_components/StudentsTable.tsx` (lines 69–74), `app/staff/_components/StudentDetailPanel.tsx` (lines 92–95), `app/staff/_components/PaymentsQueue.tsx` (lines 49–51), `app/staff/_components/ApplicantsQueue.tsx` (lines 463–464), `app/staff/_components/PoolStatusBadge.tsx` (lines 4–12), `app/staff/withdrawals/_components/WithdrawalsManager.tsx` (lines 26–31), `app/staff/part-145/_components/Part145Manager.tsx` (lines 32–36)
- **Severity**: Medium
- **Type**: Bug
- **Description**: Several status-badge maps are defined with ONLY light-mode classes (e.g. `bg-emerald-100 text-emerald-700`) and omit the `dark:` variants that the rest of the portal uses (e.g. `dark:bg-emerald-500/20 dark:text-emerald-400`). In dark mode these badges render as near-white pills with dark text, which is visually inconsistent with the design system and lowers legibility against dark cards.
- **Recommendation**: Standardise every badge map to the portal pattern, e.g.
  `ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'`. Consider extracting a shared `STATUS_BADGE` token map (or a `<StatusBadge>` component) to prevent future drift.
- **Code Reference**:
  ```tsx
  const STATUS_STYLE: Record<string, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    SUSPENDED: 'bg-amber-100 text-amber-700',
    ARCHIVED: 'bg-slate-100 text-slate-500',
    PENDING: 'bg-blue-100 text-blue-700',
  }
  ```

#### Stat-card hover/affordance is consistent (No Action Needed)
- **File**: `app/staff/dashboard/page.tsx` (lines 284–313)
- **Severity**: No Action Needed
- **Type**: Suggestion
- **Description**: Stat cards follow a consistent rounded-2xl / border-slate-100 / shadow-sm / hover:shadow-md pattern with proper dark variants. Linked cards correctly use `<a>` so they remain keyboard-accessible.

### Category: Responsive

#### Data tables rely on horizontal scroll instead of mobile card equivalents
- **File**: `app/staff/_components/StudentsTable.tsx` (line 302 area, filter row + table), `app/staff/_components/UsersTable.tsx` (line 220), `app/staff/_components/ExaminersTable.tsx` (line 101), `app/staff/_components/ExamBookingsTable.tsx` (line 144), `app/staff/_components/ReconciliationQueue.tsx` (line 163), `app/staff/_components/InstructorsTable.tsx` (line 211), `app/staff/_components/ApplicantsQueue.tsx` (line 329)
- **Severity**: Medium
- **Type**: Improvement
- **Description**: Most Staff tables wrap content in a single `<div className="overflow-x-auto">` and show the same `<table>` at all breakpoints. Per CLAUDE.md performance/convention guidance, dense tables should provide mobile card equivalents. Only `FinanceOverview.tsx` (lines 180/270) and `PaymentsQueue.tsx` (lines 225/409) implement the `hidden md:block` table + `block md:hidden` card list pattern; the others force small-screen users to horizontally scroll a wide table.
- **Recommendation**: Adopt the `FinanceOverview`/`PaymentsQueue` dual-rendering pattern for the highest-traffic tables (`StudentsTable`, `UsersTable`, `ApplicantsQueue`), or at minimum hide low-priority columns below `md` using `hidden md:table-cell`.

### Category: Loading States

#### Route segment missing required `loading.tsx`
- **File**: `app/staff/ojt/preview/page.tsx`
- **Severity**: Low
- **Type**: Bug
- **Description**: CLAUDE.md states "Every page directory MUST have a `loading.tsx`". An automated scan of all `page.tsx` directories found exactly one exception: `app/staff/ojt/preview` has no `loading.tsx`, so it falls back to the root `app/staff/loading.tsx` full-screen spinner during navigation.
- **Recommendation**: Add `app/staff/ojt/preview/loading.tsx` (a `DashboardSkeleton` variant or small `TableSkeleton`) for Suspense streaming parity with sibling routes.

#### Skeleton coverage is otherwise strong (No Action Needed)
- **File**: `app/staff/dashboard/loading.tsx`, `components/shared/DashboardSkeleton.tsx`, `components/shared/TableSkeleton` usage
- **Severity**: No Action Needed
- **Type**: Suggestion
- **Description**: The shared `DashboardSkeleton`/`TableSkeleton` provide consistent, dark-mode-aware shimmer placeholders, and nearly all leaf routes supply their own `loading.tsx`. Good practice.

### Category: Accessibility

#### Low-contrast secondary text (`text-slate-400`) on light backgrounds
- **File**: `app/staff/dashboard/page.tsx` (line 299 — stat label `text-slate-400 text-[11px] uppercase`), and pervasive `text-slate-400`/`text-slate-500` usage for labels, timestamps, and helper text across `StaffTopBar.tsx`, `StudentDetailPanel.tsx`, `ApplicantsQueue.tsx`, etc.
- **Severity**: High
- **Type**: Bug
- **Description**: `text-slate-400` (#94a3b8) on a white/slate-50 background has a contrast ratio of ~2.5:1, failing WCAG 2.1 AA (requires 4.5:1 for normal text, 3:1 for large/bold text). The 11px uppercase stat labels and many secondary descriptions fall below this threshold, harming readability for low-vision users.
- **Recommendation**: Promote secondary text to at least `text-slate-500` (3.6:1) and primary labels to `text-slate-600` (5.3:1) where it conveys meaning. Reserve `text-slate-400` for purely decorative/non-essential hints. The dark-mode equivalents (`text-slate-500`/`text-slate-400`) are already lighter and acceptable.

#### Error and empty states are accessible (No Action Needed)
- **File**: `app/staff/error.tsx`, `app/staff/not-found.tsx`, `app/staff/dashboard/_components/AlertsCenter.tsx`
- **Severity**: No Action Needed
- **Type**: Suggestion
- **Description**: `error.tsx` uses `role="alert"` and a focusable retry button with a visible focus ring; `not-found.tsx` provides a clear recovery path; `AlertsCenter` exposes an empty-state with `role`/`aria-live` on its container. Good.

### Category: Typography

#### Mixed micro-label scale
- **File**: `app/staff/dashboard/page.tsx` (line 299 `text-[11px]`), `app/staff/_components/PoolStatusBadge.tsx`, plus `text-[10px]` badge labels in `UsersTableRow.tsx` (lines 76/83)
- **Severity**: Low
- **Type**: Suggestion
- **Description**: Stat labels use `text-[11px]`, status badges use `text-[10px]`, and section headers use `text-sm font-black uppercase`. The 10–11px range is below the 12px floor recommended for comfortable readability and sits at the edge of WCAG "large text" exceptions.
- **Recommendation**: Standardise badge/label micro-text to `text-xs` (12px) where feasible, keeping `font-black`/`tracking-wider` for legibility.

### Category: Spacing

#### Surface token inconsistency in dark mode
- **File**: `app/staff/classes/[id]/seating/_components/ClassSeatingAssignment.tsx` (line 253), `app/staff/classrooms/[id]/_components/FloorPlanDesigner.tsx` (line 281), `app/staff/classrooms/[id]/_components/SeatingAssignment.tsx` (line 242), `app/staff/scheduling/_components/SchedulingClient.tsx` (line 436) vs. most cards using `dark:bg-slate-900/50`
- **Severity**: Low
- **Type**: Suggestion
- **Description**: Seating/floor-plan surfaces use `dark:bg-slate-950` while the rest of the portal cards use `dark:bg-slate-900/50`. The darker slate-950 appears alongside slate-900 surfaces, creating subtle but inconsistent dark depth.
- **Recommendation**: Pick one dark-card token (prefer `dark:bg-slate-900/50` to match the dashboard/table standard) and apply it consistently, or document the slate-950 exception for "canvas" surfaces.

### Category: Animations

#### Inconsistent page-entry animation coverage
- **File**: `app/staff/admissions/interviews/page.tsx` (line 75), `app/staff/classrooms/page.tsx` (line 28), `app/staff/classrooms/[id]/page.tsx` (line 38) use `animate-in fade-in slide-in-from-bottom-4 duration-700`; most other `page.tsx` files have no entry animation.
- **Severity**: Low
- **Type**: Suggestion
- **Description**: A subset of pages animate their entrance while the majority do not, producing an inconsistent feel as staff navigate between sections.
- **Recommendation**: Either wrap all primary page content in a shared `<PageTransition>` (e.g. `animate-in fade-in slide-in-from-bottom-4 duration-500`) or remove entry animations entirely for consistency.

#### Hover/transition tokens are consistent (No Action Needed)
- **File**: `app/staff/dashboard/page.tsx`, `app/staff/_components/*`
- **Severity**: No Action Needed
- **Type**: Suggestion
- **Description**: Interactive elements consistently use `transition-all duration-150 ease-out` with hover elevation, and loading spinners use a unified `Loader2 animate-spin` pattern. Good.

### Category: Navigation

#### Navigation is coherent (No Action Needed)
- **File**: `app/staff/_components/StaffSidebar.tsx`, `app/staff/_components/StaffTopBar.tsx`, `components/layouts/DashboardSidebar.tsx`
- **Severity**: No Action Needed
- **Type**: Suggestion
- **Description**: The sidebar provides collapsible groups, badges, active-state highlighting, a mobile slide-over with hamburger trigger, and a `MobileTopBar` breadcrumb; the top bar provides breadcrumbs, live clock, and accessible icon buttons with `aria-label`. No blocking issues found. Minor note: the desktop top bar is `hidden ... lg:flex`, so on tablet/mobile the breadcrumb lives only in the `MobileTopBar` — acceptable but worth a conscious decision.

### Category: Dark Mode

#### Status badges without dark variants (see Design System)
- **File**: listed under Design System above
- **Severity**: Medium
- **Type**: Bug
- **Description**: Same root cause as the Design System finding — status badges that omit `dark:` classes are the primary dark-mode defect. Surfaces, headers, and top bar otherwise handle dark mode well (e.g. `bg-white/80 dark:bg-slate-900/80`, `border-slate-200 dark:border-slate-700`).

### Category: Protected Images

#### User-uploaded profile photos not rendered via `ProtectedImage`
- **File**: `app/staff/_components/users-table/UsersTableRow.tsx` (lines 58–60), `app/staff/_components/StudentsTable.tsx` (lines 427–429), `app/staff/_components/StudentDetailPanel.tsx` (lines 299–301), `app/staff/_components/ApplicantsQueue.tsx` (lines 433–435), `app/staff/_components/ApplicantDetailDrawer.tsx` (lines 230–232), `app/staff/users/[id]/page.tsx` (lines 166–168), `app/staff/students/[id]/page.tsx` (lines 268–270)
- **Severity**: Medium
- **Type**: Bug
- **Description**: Across the portal, user-uploaded `profilePhotoUrl` images are rendered with plain `next/image` (e.g. `<Image src={user.profile.profilePhotoUrl} ... />`). CLAUDE.md specifies that user-uploaded content must use the `ProtectedImage` component (right-click protection, drag prevention, invisible overlay, `select-none`). A repo-wide grep found **zero** `ProtectedImage` usages under `app/staff`, so profile photos — which are user-controlled/uploads — are unprotected.
- **Recommendation**: Replace plain `next/image` avatars with `ProtectedImage` (wrapping `proxyImageUrl(url, 'profile-photos')` per the storage scope convention) at each of the listed call sites. This both protects the asset and routes it through the authenticated image proxy.

## Appendix
- Files audited (representative set):
  - `app/staff/layout.tsx`, `app/staff/loading.tsx`, `app/staff/error.tsx`, `app/staff/not-found.tsx`
  - `app/staff/_components/StaffSidebar.tsx`, `app/staff/_components/StaffTopBar.tsx`
  - `app/staff/dashboard/page.tsx`, `app/staff/dashboard/loading.tsx`, `app/staff/dashboard/_components/AlertsCenter.tsx`
  - `app/staff/_components/StudentsTable.tsx`, `UsersTable.tsx`, `ExaminersTable.tsx`, `ExamBookingsTable.tsx`, `ReconciliationQueue.tsx`, `InstructorsTable.tsx`, `ApplicantsQueue.tsx`, `PaymentsQueue.tsx`, `StudentDetailPanel.tsx`, `PoolStatusBadge.tsx`, `FinanceOverview.tsx`
  - `app/staff/withdrawals/_components/WithdrawalsManager.tsx`, `app/staff/part-145/_components/Part145Manager.tsx`
  - `app/staff/users/[id]/page.tsx`, `app/staff/students/[id]/page.tsx`, `app/staff/_components/users-table/UsersTableRow.tsx`
  - `app/staff/ojt/preview/page.tsx`, `app/staff/classrooms/*`, `app/staff/scheduling/_components/SchedulingClient.tsx`
  - `components/shared/DashboardSkeleton.tsx`, `components/layouts/DashboardSidebar.tsx`, `components/ProtectedImage.tsx`
  - `app/globals.css`
- Total findings: 11 (1 High, 3 Medium, 5 Low, 2 cross-referenced, plus 6 "No Action Needed" category notes)
