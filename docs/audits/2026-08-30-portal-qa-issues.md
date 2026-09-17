# Portal QA Issues & Fixes — August 2026

## Overview

Systematic audit of all 5 portals (Staff, Student, Instructor, Applicant, Examiner) for UI issues, backend errors, and frontend defects. Issues discovered through browser-based exploration, code review, and console/network error analysis.

---

## Issues Found

### Critical (causing crashes, "System Disturbance", or runtime errors)

#### 1. Hydration mismatch on auth layout
- **File:** `app/(auth)/layout.tsx:81`
- **Issue:** `new Date().getFullYear()` is called during SSR. If the server and client edge nodes disagree on the date (e.g., near midnight timezone boundary), React logs a hydration mismatch warning.
- **Fix:** Replace with a client-side year component that uses `useEffect` + `useState` to set the year after mount, avoiding any SSR/client divergence.
- **Status:** TODO

#### 2. 43 pages missing `loading.tsx` Suspense fallback
- **Files:** Listed in Section: Missing loading.tsx (below)
- **Issue:** Every route segment with a `page.tsx` that fetches data server-side must have a `loading.tsx` for Suspense streaming. When the DB query is slow (3–19s on the Windows dev environment), pages without a loading fallback hang or crash, triggering the global `ErrorBoundaryHandler` → "System Disturbance".
- **Fix:** Add a `loading.tsx` to each missing route segment using `TableSkeleton` or `DashboardSkeleton` from `components/shared/`.
- **Status:** TODO

#### 3. `ExaminerDashboard.getSystemSetting()` has no error handling
- **File:** `app/staff/_components/ExaminerDashboard.tsx:22`
- **Issue:** `await getSystemSetting('examiner_auth_message', ...)` calls the database directly. If the DB is unavailable or the query times out, the entire component tree crashes → "System Disturbance".
- **Fix:** Wrap in try-catch with a sensible fallback string.
- **Status:** TODO

#### 4. `ExaminerDashboard.maxCandidates` not null-checked
- **File:** `app/staff/_components/ExaminerDashboard.tsx:60`
- **Issue:** `{nextSitting.maxCandidates} Candidates Allocated` renders `undefined` as the string "undefined" when `maxCandidates` is null in the DB.
- **Fix:** Use `nextSitting.maxCandidates ?? '—'` or conditional rendering.
- **Status:** TODO

#### 5. `ExaminerDashboard.currentMemberCount` never selected from DB
- **File:** `app/staff/_components/ExaminerDashboard.tsx:136`
- **Issue:** The `ExaminerSitting` interface defines `currentMemberCount?: number`, and line 136 renders `{s.currentMemberCount || 0} Members`. But the `page.tsx` query (`app/examiner/page.tsx:37-43`) does NOT select this field from the `examSitting` model. Result: always shows "0 Members" — misleading stale data.
- **Fix:** Either select the count from the DB (add `assignments: { select: { ... } }` or a count) or remove the display until the data is available.
- **Status:** TODO

#### 6. `ExamResult.grade` rendered without null check
- **File:** `app/examiner/results/page.tsx:203`
- **Issue:** `{r.grade}` — if `grade` is null in the database (not all exam results have a letter grade), it renders the string "null".
- **Fix:** Use `r.grade ?? '—'`.
- **Status:** TODO

#### 7. `ExaminerCompliance.maxParallelSittings.toString()` crash on null
- **File:** `app/examiner/compliance/page.tsx:65`
- **Issue:** `examiner.maxParallelSittings.toString()` throws if the field is null in the DB.
- **Fix:** Use `(examiner.maxParallelSittings ?? 0).toString()` or a fallback.
- **Status:** TODO

---

### UI/UX Issues

#### 8. BreadcrumbNav missing 'examiner' in PORTAL_LABELS
- **File:** `components/layouts/BreadcrumbNav.tsx:8-13`
- **Issue:** The `PORTAL_LABELS` record has `student`, `staff`, `instructor`, `applicant` but NOT `examiner`. Examiner pages fall back to just "Dashboard" in breadcrumbs instead of "Examiner Dashboard".
- **Fix:** Add `examiner: 'Examiner Dashboard'` to the record.
- **Status:** TODO

#### 9. Examiner sidebar uses a custom component instead of shared DashboardSidebar
- **File:** `app/examiner/_components/ExaminerSidebar.tsx`
- **Issue:** The examiner portal uses a completely separate sidebar component (`<ExaminerSidebar />`) unlike staff/student/instructor/applicant portals which all use the shared `<DashboardSidebar>`. Missing features:
  - No theme toggle (sun/moon/system)
  - No collapsible sidebar (no `PanelLeftClose`/`PanelLeft` buttons)
  - No mobile sidebar drawer (no `Menu`/`X` hamburger)
  - No user profile display (only a logout button, no name/role/avatar)
  - No notification badges on sidebar items
  - No app version display
- **Fix:** Refactor `ExaminerSidebar` to use `DashboardSidebar` with `basePath="/examiner"`, or add the missing features to `ExaminerSidebar`.
- **Status:** TODO

#### 10. StudentTopbarActions missing CRITICAL notification type
- **File:** `app/student/_components/StudentTopbarActions.tsx:39-44`
- **Issue:** The `notificationTypeIcons` record includes `SUCCESS`, `WARNING`, `ERROR`, `INFO` but NOT `CRITICAL`. Per project memory: "Staff portal uses CRITICAL-priority system notifications for mandatory alerts (e.g., registration closed)." If a CRITICAL notification is sent to a student, it falls back to the `INFO` icon (blue circle) instead of the `Siren` icon (red).
- **Fix:** Add `CRITICAL: { icon: Siren, className: 'text-red-600' }` to the record.
- **Status:** TODO

#### 11. StudentTopbarActions missing `ensureSystemNotifications()` call
- **File:** `app/student/_components/StudentTopbarActions.tsx:55-63`
- **Issue:** The `StaffTopBar` calls `ensureSystemNotifications()` on every page load (line 140), which auto-creates CRITICAL system notifications (e.g., "Registration Closed"). The `StudentTopbarActions` does NOT call `ensureSystemNotifications()`, so system notifications may not appear for students. Per project memory, these notifications are for "all portals".
- **Fix:** Import and call `ensureSystemNotifications()` in the student topbar's `useEffect`.
- **Status:** TODO

#### 12. StaffTopBar initialCounts hardcoded to 0
- **File:** `app/staff/layout.tsx:86-96`
- **Issue:** The layout fetches `unreadNotifications` (line 41) but passes `initialCounts={{ notifications: 0, ... }}` (hardcoded zeros) to `StaffTopBar`. This causes a flash of zero counts before the client-side fetch completes.
- **Fix:** Pass the actual fetched counts to `initialCounts`.
- **Status:** TODO

#### 13. StaffSidebar counts hardcoded to 0
- **File:** `app/staff/layout.tsx:72-78`
- **Issue:** `StaffSidebar` receives `counts={{ applicants: 0, enrollments: 0, payments: 0, messages: 0 }}` — all zeros. The actual counts are fetched in the `StaffSidebar` component itself (let me verify this).
- **Fix:** Pass real counts from the layout's parallel query results.
- **Status:** TODO

---

### Minor Issues

#### 14. Inconsistent indentation in ApplicantSidebar
- **File:** `app/applicant/_components/ApplicantSidebar.tsx:114`
- **Issue:** Line 114 has `  { label: 'My Application', ...` with extra leading spaces (2 instead of 4).
- **Fix:** Normalize indentation.
- **Status:** TODO

#### 15. ExaminerDashboard misleading stat label
- **File:** `app/staff/_components/ExaminerDashboard.tsx:90`
- **Issue:** The label says "Completed in the last 90 days" but the `page.tsx` query just fetches "past sittings" (any sitting with `startTime < now`), not limited to 90 days. The label is misleading.
- **Fix:** Either filter by 90 days or change the label to "Recently Completed".
- **Status:** TODO

#### 16. ExaminerDashboard inconsistent indentation
- **File:** `app/staff/_components/ExaminerDashboard.tsx`
- **Issue:** Lines 84, 133, 142, 144 have inconsistent whitespace (mixed tabs/spaces, missing indentation).
- **Fix:** Run Prettier to normalize.
- **Status:** TODO

---

## Missing loading.tsx Files (43 pages)

### Staff Portal (21 pages)
```
app/staff/admissions/aptitude/banks/[id]/page.tsx
app/staff/classes/[id]/page.tsx
app/staff/classes/[id]/edit/page.tsx
app/staff/classes/[id]/roster/page.tsx
app/staff/classes/[id]/seating/page.tsx
app/staff/classrooms/[id]/page.tsx
app/staff/courses/[id]/page.tsx
app/staff/courses/[id]/edit/page.tsx
app/staff/documents/expiring/page.tsx
app/staff/exams/events/[id]/page.tsx
app/staff/exams/events/[id]/edit/page.tsx
app/staff/exams/events/[id]/manifest/page.tsx
app/staff/exams/events/[id]/pools/create/page.tsx
app/staff/exams/internal/banks/[bankId]/questions/page.tsx
app/staff/exams/pools/[id]/page.tsx
app/staff/exams/pools/[id]/add-candidate/page.tsx
app/staff/exams/pools/[id]/edit/page.tsx
app/staff/exams/sittings/[id]/seating/page.tsx
app/staff/newsroom/[id]/edit/page.tsx
app/staff/ojt/[logbookId]/page.tsx
app/staff/students/[id]/page.tsx
app/staff/users/[id]/page.tsx
```

### Student Portal (7 pages)
```
app/student/courses/[slug]/page.tsx
app/student/courses/[slug]/grades/page.tsx
app/student/courses/[slug]/materials/page.tsx
app/student/exam-bookings/[id]/page.tsx
app/student/exam-bookings/[id]/join/page.tsx
app/student/exams/internal/results/[sessionId]/page.tsx
app/student/exams/internal/[sessionId]/page.tsx
```

### Instructor Portal (7 pages)
```
app/instructor/attendance/[id]/page.tsx
app/instructor/classes/[id]/page.tsx
app/instructor/classes/[id]/attendance/page.tsx
app/instructor/classes/[id]/grades/page.tsx
app/instructor/classes/[id]/materials/page.tsx
app/instructor/classes/[id]/roster/page.tsx
app/instructor/grading/history/page.tsx
app/instructor/grading/pending/page.tsx
app/instructor/students/[id]/page.tsx
```

### Applicant Portal (5 pages)
```
app/applicant/courses/[id]/page.tsx
app/applicant/courses/[id]/purchase/page.tsx
app/applicant/exam-bookings/[id]/page.tsx
app/applicant/exam-only/join-pool/page.tsx
app/applicant/exam-only/join-waitlist/page.tsx
```

### Examiner Portal (1 page)
```
app/examiner/sittings/[id]/page.tsx
```

---

## Verification

- Browser testing: Staff, Student, Applicant, Examiner portals navigated with console/network error capture
- Playwright tour verification: All 5 portals passed (11/7/11/7/7 steps respectively)
- The "System Disturbance" errors observed were from slow DB queries timing out without loading states, and from session mismatches during multi-tab browser testing
