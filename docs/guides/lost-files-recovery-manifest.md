# Lost Files Recovery Manifest — 2026-09-01 Catastrophic Revert

**Date:** 2026-09-01  
**Incident:** A subagent session ran destructive `git checkout` + `git clean -fd` that reverted the
working tree to commit `68aa17e1` (`feat: comprehensive analytics system`) on branch `dev`,
discarding all uncommitted work and changes carried in the subagent's stale staging area.

**Source of truth:**

- `dev` HEAD is `68aa17e1` (clean, post-revert)
- `recovery/claude-checkpoint-2` is a Cline-checkpoint branch at `73e6d24c` containing
  617 modified files / 23,903 ins / 11,874 del of unrelated work (mostly lockfile + image fix
  churn) — **applying the patch wholesale is NOT safe**; the actual lost work is the
  uncommitted-but-restorable-from-Antigravity-history layer listed in §3.
- A backup of all the destroyed uncommitted new files (created before the destructive revert)
  sits at `C:\Users\Pekay\AppData\Local\Temp\kilo\recovered-files\` (952 files, 844 of which
  are NOT in the current working tree).

This doc records every file the revert erased and is not currently in the working tree. It is
the master checklist for `git checkout` from the recovery branch and the
`recovered-files/` tree.

---

## 1. Files deleted by the Cline checkpoint (`recovery/claude-checkpoint-2` → `dev`)

These were tracked files the Cline session deleted, and the reset to `dev` re-applied the
deletion. They are **not** in `recovered-files/` (no Antigravity history copy was kept for any
of them) and are **not** reachable from any retained branch.

| Path | Notes |
| --- | --- |
| `app/api/student/dashboard/route.ts` | Student dashboard JSON endpoint — no Antigravity copy |
| `app/applicant/_components/PaymentUpload.tsx` | Applicant payment-proof upload UI — no Antigravity copy |
| `app/applicant/courses/purchase/page.tsx` | Applicant course-purchase page — no Antigravity copy |
| `app/instructor/_components/AttendanceForm.tsx` | Instructor attendance form — no Antigravity copy |
| `app/instructor/_components/ClassCard.tsx` | Instructor class card — no Antigravity copy |
| `app/instructor/_components/GradingForm.tsx` | Instructor grading form — no Antigravity copy |
| `app/instructor/schedule/_components/CalendarGrid.tsx` | Instructor schedule grid — no Antigravity copy |
| `app/staff/actions.ts` | Staff server actions barrel — no Antigravity copy |
| `app/student/invoices/loading.tsx` | Student invoice skeleton — no Antigravity copy |
| `app/student/invoices/page.tsx` | Student invoice page — no Antigravity copy |
| `tests/setup.ts` | Vitest global setup file — no Antigravity copy |

**Recovery source:** none. These were in `73e6d24c` (Cline merge) but the merge commit history
is gone; `git fsck --unreachable` only shows tree/blobs, not the file contents. They must be
rebuilt from the surrounding file context or restored from the merged branch of a teammate.

---

## 2. Files added by the Cline checkpoint that `dev` lacks

Only one new file was added by `recovery/claude-checkpoint-2` and is not on `dev`:

| Path | Status on `dev` | Recovery |
| --- | --- | --- |
| `.gitattributes` | Now present (manually re-added this session) | Already recovered — no action |

Everything else the Cline checkpoint changed is a modification of an existing tracked file
(605 of them). Those modifications overlap significantly with the in-flight work in
`recovered-files/`; do **not** blanket-apply the checkpoint patch — cherry-pick by hand.

---

## 3. Files lost by `git clean -fd` (workspace edits, never committed)

These are the uncommitted new files that existed on disk before the destructive revert. The
contents of each are preserved in `C:\Users\Pekay\AppData\Local\Temp\kilo\recovered-files\`
under the same relative path. Restore by copying from the backup tree back to
`C:\Projects\aerojet-academy\<path>`.

**Total lost:** 844 files (of 952 in the backup; the remaining 108 are already in the working
tree under a different name or as recompiled output).

### 3.1 `app/` — 208 files lost

#### 3.1.1 `app/api/` — 103 files

```
app/api/admin/exams/internal/sessions/start/route.ts
app/api/analytics/track/route.ts
app/api/applicant/exam-only/book-exam/route.ts
app/api/applicant/exam-only/bookings/route.ts
app/api/applicant/exam-only/bundles/route.ts
app/api/applicant/exam-only/exam-components/route.ts
app/api/applicant/exam-only/join-pool/route.ts
app/api/applicant/exam-only/join-waitlist/route.ts
app/api/applicant/exam-only/memberships/route.ts
app/api/applicant/exam-only/payments/[id]/route.ts
app/api/applicant/exam-only/pools/route.ts
app/api/applicant/exam-only/pricing/route.ts
app/api/applicant/exam-only/referrals/route.ts
app/api/applicant/exam-only/top-up/route.ts
app/api/applicant/exam-only/wallet/route.ts
app/api/applicant/exam-only/wallet/transactions/route.ts
app/api/applicant/exam-only/withdraw-pool/route.ts
app/api/certificates/[id]/route.ts
app/api/certificates/route.ts
app/api/certificates/verify/[certificateId]/route.ts
app/api/cron/exam-timeout/route.ts
app/api/cron/recover-exams/route.ts
app/api/cron/renewal-reminders/route.ts
app/api/examiner/availability/route.ts
app/api/examiner/compliance/route.ts
app/api/examiner/results/route.ts
app/api/examiner/sittings/route.ts
app/api/exams/[id]/route.ts
app/api/exams/[id]/sessions/route.ts
app/api/exams/access-code/validate/route.ts
app/api/exams/proctoring/events/route.ts
app/api/exams/proctoring/violations/route.ts
app/api/exams/route.ts
app/api/exams/sessions/[id]/access-codes/route.ts
app/api/health/route.ts
app/api/instructor/exams/banks/[bankId]/questions/[questionId]/route.ts
app/api/instructor/exams/banks/[bankId]/questions/route.ts
app/api/instructor/exams/banks/[bankId]/rule-override/route.ts
app/api/instructor/exams/banks/route.ts
app/api/instructor/exams/classes/[classId]/analytics/route.ts
app/api/instructor/exams/classes/[classId]/monitor/route.ts
app/api/instructor/exams/classes/[classId]/remind/route.ts
app/api/instructor/exams/classes/[classId]/sessions/route.ts
app/api/instructor/exams/classes/[classId]/start/route.ts
app/api/instructor/exams/classes/[classId]/void/route.ts
app/api/instructor/exams/classes/route.ts
app/api/instructor/exams/import/confirm/route.ts
app/api/instructor/exams/import/preview/route.ts
app/api/instructor/exams/import/route.ts
app/api/instructor/exams/questions/[id]/history/route.ts
app/api/instructor/exams/questions/route.ts
app/api/staff/analytics/dashboard/route.ts
app/api/staff/analytics/features/route.ts
app/api/staff/analytics/funnels/route.ts
app/api/staff/analytics/journey/[id]/route.ts
app/api/staff/analytics/pageviews/route.ts
app/api/staff/analytics/retention/route.ts
app/api/staff/attendance/compliance/route.ts
app/api/staff/documents/expiring/route.ts
app/api/staff/exams/events/[id]/manifest/route.ts
app/api/staff/exams/internal/banks/[bankId]/instructors/[id]/route.ts
app/api/staff/exams/internal/banks/[bankId]/instructors/[instructorId]/route.ts
app/api/staff/exams/internal/banks/[bankId]/instructors/route.ts
app/api/staff/exams/internal/banks/[bankId]/questions/[questionId]/restore/route.ts
app/api/staff/exams/internal/banks/[bankId]/questions/[questionId]/route.ts
app/api/staff/exams/internal/banks/[bankId]/questions/route.ts
app/api/staff/exams/internal/banks/[bankId]/retire/route.ts
app/api/staff/exams/internal/banks/[bankId]/rule-override/route.ts
app/api/staff/exams/internal/banks/[bankId]/schedule/[id]/route.ts
app/api/staff/exams/internal/banks/[bankId]/schedule/[scheduleId]/route.ts
app/api/staff/exams/internal/banks/[bankId]/schedule/route.ts
app/api/staff/exams/internal/banks/[bankId]/seb-config/download/route.ts
app/api/staff/exams/internal/banks/[bankId]/seb-config/route.ts
app/api/staff/exams/internal/preview/violations/route.ts
app/api/staff/exams/internal/questions/[questionId]/versions/route.ts
app/api/staff/exams/internal/sessions/[id]/codes/route.ts
app/api/staff/exams/internal/sessions/[id]/end/route.ts
app/api/staff/exams/internal/sessions/[id]/extend/route.ts
app/api/staff/exams/internal/sessions/[id]/force-submit/route.ts
app/api/staff/exams/internal/sessions/[id]/resume/route.ts
app/api/staff/exams/internal/sessions/[id]/seb-config/route.ts
app/api/staff/exams/internal/sessions/[id]/supervise/answer/route.ts
app/api/staff/exams/internal/sessions/[id]/supervise/route.ts
app/api/staff/exams/internal/sessions/[id]/violations/[violationId]/review/route.ts
app/api/staff/exams/internal/sessions/[id]/violations/route.ts
app/api/staff/notifications/route.ts
app/api/staff/ojt/[logbookId]/mentors/[assignmentId]/route.ts
app/api/staff/ojt/[logbookId]/mentors/route.ts
app/api/staff/ojt/entries/[entryId]/competency/route.ts
app/api/staff/ojt/entries/[entryId]/sign/route.ts
app/api/staff/ojt/entries/[entryId]/verify/route.ts
app/api/staff/reports/easa-compliance/export/route.ts
app/api/student/documents/route.ts
app/api/student/exams/internal/access-code/route.ts
app/api/student/exams/internal/access-code/validate/route.ts
app/api/student/exams/internal/banks/[bankId]/seb-config/route.ts
app/api/student/exams/internal/heartbeat/route.ts
app/api/student/exams/internal/register/route.ts
app/api/student/exams/internal/resume/route.ts
app/api/student/exams/internal/review-later/route.ts
app/api/student/exams/internal/session/route.ts
app/api/student/exams/internal/start/route.ts
app/api/student/exams/internal/violation/route.ts
```

#### 3.1.2 `app/staff/` — 66 files

```
app/staff/_components/ClassesPagination.tsx
app/staff/_components/ReportsTabs.tsx
app/staff/_components/StaffTopBar.tsx
app/staff/actions.ts
app/staff/actions/_base.ts
app/staff/actions/applicants.ts
app/staff/actions/bookings.ts
app/staff/actions/certificates.ts
app/staff/actions/enrollments.ts
app/staff/actions/exams.ts
app/staff/actions/finance.ts
app/staff/actions/index.ts
app/staff/actions/messages.ts
app/staff/actions/notifications.ts
app/staff/actions/results.ts
app/staff/actions/search.ts
app/staff/actions/users.ts
app/staff/analytics/_components/FeatureAdoption.tsx
app/staff/analytics/_components/FeatureChart.tsx
app/staff/analytics/_components/FunnelAnalysis.tsx
app/staff/analytics/_components/FunnelChart.tsx
app/staff/analytics/_components/MetricsOverview.tsx
app/staff/analytics/_components/PageViews.tsx
app/staff/analytics/_components/PageViewsTable.tsx
app/staff/analytics/_components/RetentionAnalysis.tsx
app/staff/analytics/_components/RetentionHeatmap.tsx
app/staff/analytics/_components/UserJourney.tsx
app/staff/analytics/_components/UserJourneyTimeline.tsx
app/staff/analytics/_components/UserSearchInput.tsx
app/staff/analytics/AnalyticsDashboardClient.tsx
app/staff/analytics/error.tsx
app/staff/analytics/loading.tsx
app/staff/analytics/page.tsx
app/staff/classes/[id]/not-found.tsx
app/staff/classes/page.tsx
app/staff/courses/[id]/not-found.tsx
app/staff/documents/expiring/_components/ExpiringDocumentsClient.tsx
app/staff/documents/expiring/loading.tsx
app/staff/documents/expiring/page.tsx
app/staff/enrollments/_components/EnrollmentsPagination.tsx
app/staff/enrollments/page.tsx
app/staff/exams/anticheat/[id]/_components/ExamDetailClient.tsx
app/staff/exams/anticheat/[id]/page.tsx
app/staff/exams/anticheat/_components/ExamListClient.tsx
app/staff/exams/anticheat/page.tsx
app/staff/exams/error.tsx
app/staff/exams/events/[id]/_components/ManifestButton.tsx
app/staff/exams/events/[id]/_components/ManifestPreview.tsx
app/staff/exams/events/[id]/manifest/page.tsx
app/staff/exams/events/[id]/not-found.tsx
app/staff/exams/internal/_components/ConfirmModal.tsx
app/staff/exams/internal/_components/QuestionVersions.tsx
app/staff/exams/internal/_components/ViolationReviewPanel.tsx
app/staff/exams/internal/banks/[bankId]/instructors/_components/InstructorAssignmentPage.tsx
app/staff/exams/internal/banks/[bankId]/instructors/loading.tsx
app/staff/exams/internal/banks/[bankId]/instructors/page.tsx
app/staff/exams/internal/banks/[bankId]/questions/_components/QuestionEditor.tsx
app/staff/exams/internal/banks/[bankId]/questions/loading.tsx
app/staff/exams/internal/banks/[bankId]/questions/page.tsx
app/staff/exams/internal/banks/[bankId]/schedule/_components/ClassSchedulePage.tsx
app/staff/exams/internal/banks/[bankId]/schedule/loading.tsx
app/staff/exams/internal/banks/[bankId]/schedule/page.tsx
app/staff/exams/internal/preview/_components/ExamPreviewClient.tsx
app/staff/exams/internal/sessions/[id]/supervise/_components/SupervisedExamInterface.tsx
app/staff/exams/internal/sessions/[id]/supervise/loading.tsx
app/staff/exams/internal/sessions/[id]/supervise/page.tsx
app/staff/exams/proctor/_components/ProctorDashboardClient.tsx
app/staff/exams/proctor/page.tsx
app/staff/messages/_components/StaffMessageThread.tsx
app/staff/newsroom/error.tsx
app/staff/notifications/_components/StaffNotificationCard.tsx
app/staff/notifications/_components/StaffNotificationsList.tsx
app/staff/notifications/loading.tsx
app/staff/notifications/page.tsx
app/staff/ojt/[logbookId]/_components/MentorAssignments.tsx
app/staff/ojt/[logbookId]/_components/ReviewSignoffPanel.tsx
app/staff/ojt/preview/loading.tsx
app/staff/reports/_components/PeriodFilter.tsx
app/staff/reports/attendance-compliance/loading.tsx
app/staff/reports/attendance-compliance/page.tsx
app/staff/reports/easa-compliance/loading.tsx
app/staff/reports/easa-compliance/page.tsx
app/staff/reports/error.tsx
app/staff/scheduling/error.tsx
app/staff/students/[id]/_components/PracticalTab.tsx
app/staff/students/[id]/not-found.tsx
app/staff/users/[id]/not-found.tsx
```

#### 3.1.3 `app/instructor/` — 25 files

```
app/instructor/_components/GradingDialog.tsx
app/instructor/_components/StatusBadge.tsx
app/instructor/attendance/[id]/error.tsx
app/instructor/attendance/[id]/not-found.tsx
app/instructor/classes/[id]/error.tsx
app/instructor/classes/[id]/not-found.tsx
app/instructor/exams/_components/InstructorExamsDashboard.tsx
app/instructor/exams/banks/[bankId]/_components/BankManager.tsx
app/instructor/exams/banks/[bankId]/loading.tsx
app/instructor/exams/banks/[bankId]/page.tsx
app/instructor/exams/banks/loading.tsx
app/instructor/exams/classes/[classId]/analytics/_components/ClassAnalyticsPage.tsx
app/instructor/exams/classes/[classId]/analytics/loading.tsx
app/instructor/exams/classes/[classId]/analytics/page.tsx
app/instructor/exams/classes/[classId]/monitor/_components/ClassMonitorPage.tsx
app/instructor/exams/classes/[classId]/monitor/loading.tsx
app/instructor/exams/classes/[classId]/monitor/page.tsx
app/instructor/exams/classes/loading.tsx
app/instructor/exams/loading.tsx
app/instructor/exams/page.tsx
app/instructor/grading/error.tsx
app/instructor/grading/history/loading.tsx
app/instructor/grading/pending/loading.tsx
app/instructor/students/[id]/_components/StudentEnrollmentsView.tsx
app/instructor/students/[id]/error.tsx
app/instructor/students/[id]/not-found.tsx
app/instructor/students/[id]/page.tsx
app/instructor/students/_components/FormerStudentCard.tsx
```

#### 3.1.4 `app/student/` — 16 files

```
app/student/courses/[slug]/error.tsx
app/student/courses/[slug]/not-found.tsx
app/student/exam-bookings/[id]/error.tsx
app/student/exam-bookings/[id]/not-found.tsx
app/student/exams/internal/[sessionId]/error.tsx
app/student/exams/internal/access-code/_components/AccessCodeEntry.tsx
app/student/exams/internal/access-code/loading.tsx
app/student/exams/internal/access-code/page.tsx
app/student/exams/internal/error.tsx
app/student/exams/internal/register/[sessionId]/_components/PreExamForm.tsx
app/student/exams/internal/register/[sessionId]/loading.tsx
app/student/exams/internal/register/[sessionId]/page.tsx
app/student/exams/internal/results/[sessionId]/loading.tsx
app/student/exams/internal/results/[sessionId]/page.tsx
app/student/transcript/_components/EnrolmentTable.tsx
app/student/transcript/_components/ExamResultsTable.tsx
```

#### 3.1.5 `app/applicant/` — 14 files

```
app/applicant/application/aptitude-test/take/loading.tsx
app/applicant/application/medical/loading.tsx
app/applicant/exam-bookings/[id]/loading.tsx
app/applicant/exam-bookings/[id]/not-found.tsx
app/applicant/exam-bookings/[id]/page.tsx
app/applicant/exam-only/_components/BundleSelectionModal.tsx
app/applicant/exam-only/_components/ConfirmationModal.tsx
app/applicant/exam-only/_components/examOnlyTypes.ts
app/applicant/exam-only/_components/IndividualBookingModal.tsx
app/applicant/exam-only/_components/PackagesTab.tsx
app/applicant/exam-only/_components/PoolsTab.tsx
app/applicant/exam-only/error.tsx
app/applicant/exam-only/join-pool/_components/JoinPoolForm.tsx
app/applicant/exam-only/join-pool/loading.tsx
app/applicant/exam-only/join-pool/page.tsx
app/applicant/exam-only/join-waitlist/_components/JoinWaitlistForm.tsx
app/applicant/exam-only/join-waitlist/loading.tsx
app/applicant/exam-only/join-waitlist/page.tsx
app/applicant/exam-only/page.tsx
app/applicant/notifications/page.tsx
```

#### 3.1.6 `app/examiner/` — 4 files

```
app/examiner/layout.tsx
app/examiner/page.tsx
app/examiner/results/actions.ts
app/examiner/results/history/loading.tsx
app/examiner/results/history/page.tsx
app/examiner/sittings/[id]/not-found.tsx
app/examiner/sittings/[id]/page.tsx
```

#### 3.1.7 `app/(public)/` — 4 files

```
app/(public)/exams/[code]/page.tsx
app/(public)/exams/attempt/[sessionId]/page.tsx
app/(public)/verify/[certificateId]/loading.tsx
app/(public)/verify/[certificateId]/page.tsx
```

### 3.2 `components/` — 16 files lost

```
components/applicant/ApplicantPortalShell.tsx
components/charts/AttendanceChart.tsx
components/charts/EnrollmentChart.tsx
components/charts/ExamCharts.tsx
components/charts/PoolFillChart.tsx
components/charts/RevenueChart.tsx
components/exam/SecureExamClient.tsx
components/shared/ClientYear.tsx
components/shared/DataTable.tsx
components/shared/ExamStatusBadge.tsx
components/shared/MetricCard.tsx
components/shared/PageTransition.tsx
components/Tour/AppTour.tsx
components/Tour/TourTrigger.tsx
components/ui/chart.tsx
components/ui/sortable-th.tsx
```

> Note: `components/ui/sortable-th.tsx` and `components/shared/DataTable.tsx` were
> re-authored this session and ARE now in the working tree; the Antigravity copies are stale.

### 3.3 `lib/` — 18 files lost

```
lib/analytics/events.ts
lib/analytics/metrics.ts
lib/analytics/queries.ts
lib/analytics/reports.ts
lib/certificates/generator.ts
lib/hooks/useFetch.ts
lib/internal-exam/import/extractors.ts
lib/internal-exam/seb-config.ts
lib/middleware/seb-detection.ts
lib/middleware/seb-validation.ts
lib/server/request-context.ts
lib/staff/errors.ts
lib/staff/types.ts
lib/student/booking-data.ts
lib/student/error-handler.ts
lib/types/staff.ts
lib/utils/build-order-by.ts
lib/utils/date.ts
```

> Note: `lib/utils/build-order-by.ts` was re-authored this session; the Antigravity copy is
> stale.

### 3.4 `hooks/` — 6 files lost

```
hooks/useAnalytics.ts
hooks/useAntiCheat.ts
hooks/useExamMonitor.ts
hooks/useLiveExamSessions.ts
hooks/usePollVisibility.ts
hooks/useRealtimeExamMonitor.ts
```

### 3.5 `tests/` — 512 files lost

This is the largest loss category — the entire `tests/integration/api/` and most of
`tests/unit/lib/`, plus component and e2e suites.

#### 3.5.1 `tests/integration/api/` — 238 files

All `*.test.ts` files in `tests/integration/api/`. Highlights (full list under the same
directory, alphabetically):

- `tests/integration/api/_debug_m.test.ts`
- `tests/integration/api/_debug_q.test.ts`
- `tests/integration/api/add-payment-method.test.ts`
- `tests/integration/api/applicant-*` (full suite)
- `tests/integration/api/auth/*`
- `tests/integration/api/booking-*`
- `tests/integration/api/cancel-*`
- `tests/integration/api/certificates*`
- `tests/integration/api/change-password*`
- `tests/integration/api/confirm-*`
- `tests/integration/api/courses*`
- `tests/integration/api/create-*`
- `tests/integration/api/dashboard*`
- `tests/integration/api/delete-*`
- `tests/integration/api/email-*`
- `tests/integration/api/enrollments*`
- `tests/integration/api/exam-events*`
- `tests/integration/api/exam-pools*`
- `tests/integration/api/exam-sittings*`
- `tests/integration/api/exams/*`
- `tests/integration/api/export.test.ts`
- `tests/integration/api/finance-*`
- `tests/integration/api/forgot-password*`
- `tests/integration/api/instructors*`
- `tests/integration/api/join-pool*`
- `tests/integration/api/newsroom*`
- `tests/integration/api/notifications*`
- `tests/integration/api/ojt*`
- `tests/integration/api/payments*`
- `tests/integration/api/pools*`
- `tests/integration/api/presence*`
- `tests/integration/api/profile*`
- `tests/integration/api/referral*`
- `tests/integration/api/register*`
- `tests/integration/api/reports*`
- `tests/integration/api/resend-*`
- `tests/integration/api/reset-password*`
- `tests/integration/api/restore.test.ts`
- `tests/integration/api/role-*`
- `tests/integration/api/scheduling*`
- `tests/integration/api/seb-*`
- `tests/integration/api/search.test.ts`
- `tests/integration/api/sessions-*`
- `tests/integration/api/sittings*`
- `tests/integration/api/staff-*` (full surface)
- `tests/integration/api/start-*`
- `tests/integration/api/student-*`
- `tests/integration/api/submit-*`
- `tests/integration/api/suspend.test.ts`
- `tests/integration/api/toggle-*`
- `tests/integration/api/topbar-items.test.ts`
- `tests/integration/api/unsubscribe.test.ts`
- `tests/integration/api/update-*`
- `tests/integration/api/users*`
- `tests/integration/api/verify-*`
- `tests/integration/api/wallet*`
- `tests/integration/api/webhooks*`
- `tests/integration/api/welcome*`
- `tests/integration/api/withdraw*`

#### 3.5.2 `tests/unit/lib/` — 156 files

Comprehensive unit coverage of every `lib/` module, including but not limited to:

```
tests/unit/lib/admissions-status.test.ts
tests/unit/lib/admissions-validation.test.ts
tests/unit/lib/analytics-events.test.ts
tests/unit/lib/analytics-metrics.test.ts
tests/unit/lib/analytics-queries.test.ts
tests/unit/lib/analytics-report-generator.test.ts
tests/unit/lib/analytics-reports.test.ts
tests/unit/lib/api-parsers.test.ts
tests/unit/lib/api-response.test.ts
tests/unit/lib/aptitude-evaluation.test.ts
tests/unit/lib/attendance-tracker.test.ts
tests/unit/lib/audit-logger.test.ts
tests/unit/lib/auth-middleware-helpers.test.ts
tests/unit/lib/auth-otp.test.ts
tests/unit/lib/auth-passkey-config.test.ts
tests/unit/lib/auth-password.test.ts
tests/unit/lib/auth-permissions.test.ts
tests/unit/lib/auth-roles.test.ts
tests/unit/lib/calendar-semesters.test.ts
tests/unit/lib/calendar-types.test.ts
tests/unit/lib/certificates-formatters.test.ts
tests/unit/lib/certificates-validation.test.ts
tests/unit/lib/compliance-checker.test.ts
tests/unit/lib/courses-categories.test.ts
tests/unit/lib/courses-validation.test.ts
tests/unit/lib/currency.test.ts
tests/unit/lib/database-types.test.ts
tests/unit/lib/documents-classifier.test.ts
tests/unit/lib/documents-types.test.ts
tests/unit/lib/documents-validation.test.ts
tests/unit/lib/easa-grading.test.ts
tests/unit/lib/easa-modules.test.ts
tests/unit/lib/email-admissions.test.ts
tests/unit/lib/email-index.test.ts
tests/unit/lib/email-registry.test.ts
tests/unit/lib/email-sender.test.ts
tests/unit/lib/email-service.test.ts
tests/unit/lib/email-template-engine.test.ts
tests/unit/lib/email-templates.test.ts
tests/unit/lib/email-types.test.ts
tests/unit/lib/email-webhooks.test.ts
tests/unit/lib/enrollment-deduplication.test.ts
tests/unit/lib/enrollment-engine.test.ts
tests/unit/lib/enrollment-pathway.test.ts
tests/unit/lib/enrollment-status.test.ts
tests/unit/lib/enrollment-validation.test.ts
tests/unit/lib/events-helpers.test.ts
tests/unit/lib/events-manager.test.ts
tests/unit/lib/examiner-results.test.ts
tests/unit/lib/exams-bookings.test.ts
tests/unit/lib/exams-components.test.ts
tests/unit/lib/exams-events.test.ts
tests/unit/lib/exams-grading.test.ts
tests/unit/lib/exams-questions.test.ts
tests/unit/lib/finance-amounts.test.ts
tests/unit/lib/finance-currency.test.ts
tests/unit/lib/gdpr-anonymise.test.ts
tests/unit/lib/gdpr-export.test.ts
tests/unit/lib/gdpr-retention.test.ts
tests/unit/lib/gdpr-settings.test.ts
tests/unit/lib/grading.test.ts
tests/unit/lib/instructor-queries.test.ts
tests/unit/lib/instructor-validation.test.ts
tests/unit/lib/internal-exam-formatters.test.ts
tests/unit/lib/internal-exam-grading.test.ts
tests/unit/lib/invoice-generator.test.ts
tests/unit/lib/license-categories.test.ts
tests/unit/lib/notifications-formatters.test.ts
tests/unit/lib/notifications-types.test.ts
tests/unit/lib/part145-inspections.test.ts
tests/unit/lib/payment-verification.test.ts
tests/unit/lib/payments-methods.test.ts
tests/unit/lib/payments-references.test.ts
tests/unit/lib/pools-access-control.test.ts
tests/unit/lib/pools-pricing-config.test.ts
tests/unit/lib/pools-pricing.test.ts
tests/unit/lib/pools-queries.test.ts
tests/unit/lib/pools-types.test.ts
tests/unit/lib/progression-tracker.test.ts
tests/unit/lib/rate-limit.test.ts
tests/unit/lib/realtime-client.test.ts
tests/unit/lib/realtime-events.test.ts
tests/unit/lib/realtime-messages.test.ts
tests/unit/lib/referral-rewards.test.ts
tests/unit/lib/referral-validation.test.ts
tests/unit/lib/revision-manager.test.ts
tests/unit/lib/scheduling-classes.test.ts
tests/unit/lib/scheduling-classrooms.test.ts
tests/unit/lib/scheduling-conflicts.test.ts
tests/unit/lib/scheduling-recurrence.test.ts
tests/unit/lib/scheduling-slots.test.ts
tests/unit/lib/seb-config.test.ts
tests/unit/lib/security-hash.test.ts
tests/unit/lib/security-xss.test.ts
tests/unit/lib/settings-defaults.test.ts
tests/unit/lib/settings-values.test.ts
tests/unit/lib/signed-url.test.ts
tests/unit/lib/staff-roles.test.ts
tests/unit/lib/staff-status.test.ts
tests/unit/lib/staff-types.test.ts
tests/unit/lib/storage-proxy.test.ts
tests/unit/lib/storage-supabase-storage.test.ts
tests/unit/lib/student-error-handler.test.ts
tests/unit/lib/student-progress.test.ts
tests/unit/lib/students-gpa.test.ts
tests/unit/lib/students-manager.test.ts
tests/unit/lib/students-types.test.ts
tests/unit/lib/supabase-client.test.ts
tests/unit/lib/teaching-materials-queries.test.ts
tests/unit/lib/teaching-materials-types.test.ts
tests/unit/lib/totp.test.ts
tests/unit/lib/uploads-media.test.ts
tests/unit/lib/uploads-validation.test.ts
tests/unit/lib/users-avatar.test.ts
tests/unit/lib/users-permissions.test.ts
tests/unit/lib/users-queries.test.ts
tests/unit/lib/utils-array.test.ts
tests/unit/lib/utils-constants.test.ts
tests/unit/lib/utils-currency.test.ts
tests/unit/lib/utils-date.test.ts
tests/unit/lib/utils-grading.test.ts
tests/unit/lib/utils-index.test.ts
tests/unit/lib/utils-natural-sort.test.ts
tests/unit/lib/utils-sanitize.test.ts
tests/unit/lib/utils-serialization.test.ts
tests/unit/lib/utils-url.test.ts
tests/unit/lib/utils-validation.test.ts
tests/unit/lib/validation-errors.test.ts
tests/unit/lib/validation-schema.test.ts
tests/unit/lib/validation-schemas.test.ts
tests/unit/lib/validation-validators.test.ts
tests/unit/lib/wallet-balance.test.ts
tests/unit/lib/wallet-transactions.test.ts
tests/unit/lib/wallet-types.test.ts
tests/unit/lib/welcome-messages.test.ts
tests/unit/lib/withdrawal-types.test.ts
tests/unit/lib/withdrawal-validation.test.ts
tests/unit/lib/auth/totp.test.ts
tests/unit/lib/certificates/generator.test.ts
tests/unit/lib/middleware/seb-validation.test.ts
tests/unit/proxy.test.ts
tests/unit/hooks/use-confirm-dialog.test.ts
tests/unit/hooks/use-current-role.test.ts
tests/unit/hooks/use-current-user.test.ts
tests/unit/hooks/use-debounce.test.ts
tests/unit/hooks/use-mobile.test.ts
tests/unit/hooks/use-pagination.test.ts
tests/unit/hooks/use-table-filter.test.ts
tests/unit/hooks/use-table-sort.test.ts
tests/unit/hooks/use-toast.test.ts
tests/unit/hooks/use-unsaved-changes.test.ts
tests/unit/hooks/use-wallet-balance.test.ts
tests/unit/hooks/useAnalytics.test.ts
tests/unit/hooks/useBadgeCounts.test.ts
tests/unit/hooks/useRealtimeMessages.test.ts
tests/unit/hooks/useUnsavedChanges.test.ts
tests/unit/utils/sanitize.test.ts
tests/unit/utils/string.test.ts
```

#### 3.5.3 `tests/components/` — 108 files (component tests)

`tests/components/` contains 108 component-test files. Restore from
`C:\Users\Pekay\AppData\Local\Temp\kilo\recovered-files\tests\components\`.

#### 3.5.4 `tests/e2e/` — 7 files

Restore from `C:\Users\Pekay\AppData\Local\Temp\kilo\recovered-files\tests\e2e\`.

#### 3.5.5 `tests/` root — 3 files

```
tests/STANDARDS.md
tests/factories.ts
tests/vitest-globals.d.ts
```

### 3.6 `docs/` — 31 files lost

```
docs/architecture/applicant-portal.md
docs/audits/2026-08-30-portal-qa-issues.md
docs/audits/API-AUDIT-2026-08-29.md
docs/audits/CENTRAL-TRACKER.md
docs/audits/portal-audits/PORTAL-AUDIT-TRACKER.md
docs/audits/portal-audits/applicant/applicant-portal-audit-2026-08-27.md
docs/audits/portal-audits/examiner/examiner-portal-audit-2026-08-27.md
docs/audits/portal-audits/instructor/instructor-portal-audit-2026-08-27.md
docs/audits/portal-audits/staff/staff-code-quality.md
docs/audits/portal-audits/staff/staff-easa.md
docs/audits/portal-audits/staff/staff-performance.md
docs/audits/portal-audits/staff/staff-portal-audit-2026-08-27.md
docs/audits/portal-audits/staff/staff-security.md
docs/audits/portal-audits/staff/staff-typescript.md
docs/audits/portal-audits/staff/staff-ui-ux.md
docs/audits/portal-audits/student/student-portal-audit-2026-08-27.md
docs/branch-strategy.md
docs/guides/analytics-features.md
docs/guides/easa-exam-compliance.md
docs/html/analytics-features.html
docs/plans/anticheat-vs-internal-exam-comparison.md
docs/plans/certificate-pdf-generation-plan.md
docs/plans/implementation-gap-report.md
docs/plans/internal-exam-system-ui-plan-assessment.md
docs/plans/internal-exam-system-ui-plan-review.md
docs/plans/internal-exam-system-ui-plan.md
docs/plans/seb-and-certificates-plan.md
docs/plans/seb-certificates-tests-plan.md
docs/plans/seb-config-deployment-plan.md
docs/plans/test-suite-remediation.md
docs/teamcity-evaluation.md
```

> Note: `docs/guides/sortable-tables.md` was re-authored this session and IS in the working
> tree. The Antigravity copy is stale.

### 3.7 `scripts/` — 47 files lost

All PowerShell and shell scripts in `scripts/`. Restore from
`C:\Users\Pekay\AppData\Local\Temp\kilo\recovered-files\scripts\`.

### 3.8 `.kilo/` — 6 files lost

```
.kilo/agent/docs-html-builder.md
.kilo/command/skill-update.md
.kilo/plans/1787842321707-portal-audit-orchestration.md
.kilo/plans/1788099263147-anticheat-exam-system-plan.md
.kilo/skills/aerojet-code-standards/SKILL.md
.kilo/skills/docs-html-build/SKILL.md
```

### 3.9 Root — 13 files lost

```
.anchored-summary.md
.cursor/ralph/scratchpad.md
ACCESSIBILITY.md
check-backticks.cjs
check-backticks2.cjs
check-bt.cjs
eslint.config.mjs
fix-mocks.ps1
run-tsc-bg.bat
run-tsc-full.bat
run-tsc-node.cjs
run-tsc-node.mjs
run-tsc.bat
run-tsc2.bat
tmp_consolidate.mjs
tsconfig.staff.json
vitest.config.ts
```

### 3.10 `tools/` — 7 files lost

```
tools/flipbook-scraper/config.ts
tools/flipbook-scraper/index.ts
tools/flipbook-scraper/inspect.ts
tools/flipbook-scraper/pdf-converter.ts
tools/flipbook-scraper/README.md
tools/flipbook-scraper/scraper.ts
tools/flipbook-scraper/presets/suntech.json
```

---

## 4. Tracked modifications lost in the destructive reset

The destructive reset did **not** lose tracked files (`git checkout` would have re-applied
them, and `git clean -fd` only touches untracked files). What was lost was:

- All uncommitted modifications to tracked files (the staff portal tables work, the
  `app/staff/enrollments/_components/EnrollmentsTable.tsx` conversion, the `lib/staff/types.ts`
  970-line type additions, the 20+ server `redirect()` → `useRouter().replace()` rewrites,
  the `app/(public)/newsroom/page.tsx` + `app/(public)/newsroom/[slug]/page.tsx` work, etc.).
- All untracked new files (the 844 in §3).

The destroyed in-flight modifications must be reapplied by either:

1. Cherry-picking the relevant changes from `recovery/claude-checkpoint-2` (only for files
   the Cline session actually improved; check `git diff 68aa17e1..73e6d24c -- <path>` first).
2. Re-doing the lost work (the `SortableTh` table conversion, the redirect fixes, the
   `lib/staff/types.ts` extensions, etc.).

A pre-revert backup of the few files saved manually before the destructive step is at
`C:\Users\Pekay\AppData\Local\Temp\kilo\primitives-backup\`.

---

## 5. Recovery procedure

```powershell
# 1. Restore untracked new files from the Antigravity backup
$backup = 'C:\Users\Pekay\AppData\Local\Temp\kilo\recovered-files'
$root   = 'C:\Projects\aerojet-academy'
# Skip files already re-authored this session
$skip = @(
  'components/ui/sortable-th.tsx',
  'components/shared/DataTable.tsx',
  'lib/utils/build-order-by.ts',
  'docs/guides/sortable-tables.md',
  '.gitattributes',
)
Get-ChildItem $backup -Recurse -File | ForEach-Object {
  $rel = $_.FullName.Substring($backup.Length + 1) -replace '\\', '/'
  if ($skip -contains $rel) { return }
  $dest = Join-Path $root $rel
  New-Item -ItemType Directory -Path (Split-Path $dest) -Force | Out-Null
  Copy-Item $_.FullName $dest -Force
}

# 2. Rebuild the 11 deleted tracked files from §1 (no source — manual work)
# 3. Re-apply lost in-flight tracked modifications
#    (SortableTh table work, redirect() -> useRouter().replace(), types.ts extensions)
# 4. Run: bun run type-check && bun run test --run
```

---

## 6. Audit trail

- 2026-09-01 ~08:00 UTC: Antigravity Local History contains 543 buckets / 1943 entries.
  Script `restore-history.mjs` read 112 paths; 23 restored (new files), 89 skipped
  (clobber-existing), 0 missing.
- 2026-09-01 ~08:30 UTC: `git fsck --unreachable --no-reflogs` found 166 unreachable commits
  on the Cline checkpoint branch. `git diff dev..recovery/claude-checkpoint-2` produced
  `C:\Users\Pekay\AppData\Local\Temp\kilo\recovery.patch` (6.4 MB; **not safe to apply
  wholesale**).
- 2026-09-01 ~10:00 UTC: This manifest created from `find-lost.mjs` output.
