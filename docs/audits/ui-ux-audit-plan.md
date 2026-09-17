# UI/UX Audit & Remediation Plan

## LLM Council Synthesis — 2026-09-10

### Audit Scope

5 portals, ~280 files audited for: unsaved changes warnings, error banners, loading states, empty states, silent catch blocks.

### Priority Matrix

| Priority | Category                         | Count | Impact                                 |
| -------- | -------------------------------- | ----- | -------------------------------------- |
| P0       | Silent `catch {}` blocks         | ~43   | Hides real errors, debugging nightmare |
| P1       | Missing unsaved changes warnings | ~60   | Data loss on navigation/refresh        |
| P2       | Missing empty states             | ~25   | Confusing blank UI, no guidance        |
| P3       | Missing error banners            | ~15   | Errors invisible to users              |
| P4       | Missing loading states (inline)  | ~10   | Client-side fetches show nothing       |

### Implementation Strategy

**Wave 1 — Infrastructure (reusable hooks/components)**

- Create `useFormDirty` hook: combines `useUnsavedChanges` + `beforeunload` listener
- Create `ErrorBanner` component: reusable error display
- Create `LoadingState` component: reusable loading display

**Wave 2 — Silent Catch Remediation (P0)**

- Fix all `catch {}` / `.catch(() => {})` blocks across all portals
- Replace with proper error state + user-facing feedback

**Wave 3 — Unsaved Changes Warnings (P1)**

- Apply `useFormDirty` to all form-bearing components
- High-risk: exam entry, contact forms, profile edits, payment forms

**Wave 4 — Empty States (P2)**

- Add `EmptyState` component to data tables and lists

**Wave 5 — Verification (3-pass LLM Council)**

- Pass 1: Audit fixes
- Pass 2: Verify no regressions
- Pass 3: Final sign-off

### Files to Modify

**New infrastructure:**

- `hooks/useFormDirty.ts` — enhanced unsaved changes + beforeunload
- `components/shared/ErrorBanner.tsx` — reusable error display
- `components/shared/LoadingState.tsx` — reusable loading display

**Silent catch fixes (~25 files):**

- Staff: PeopleTabs, StaffTopBar, CoursesClient, BackupManager, ExamBankManager, ApprovalQueue, ExamOperations, SchedulingMatrix, EditAcademicPeriodDialog, IntakeCycleManager, QuestionEditor, ExamDetailClient
- Instructor: GradingDialog, InstructorExamsDashboard, BankManager, ClassMonitorPage, ClassAnalyticsPage, GradingQueueView, GradingHistoryView, AttendanceRow
- Student/Applicant: TestInterface (3), AntiCheatProvider

**Unsaved changes (~30 files):**

- Staff: EditCourseForm, exam event/pool forms, profile dialogs, settings forms, etc.
- Instructor: AvailabilityManager, AcademicCalendar, CreateGradeDialog, GradingDialog, MaterialsManager, BankManager, etc.
- Student/Applicant: ProfileForm, CalendarGrid, NewMessageDialog, PreExamForm, UploadProofForm, etc.
- Public/Examiner: ContactForm, exam access code, ResultsEntry, AvailabilityManager

**Empty states (~15 files):**

- Student: StudentWalletTransactionsTable, ExamResultsTable, EnrolmentTable, GradesTable, StudentBookingsTable, StudentTopbarActions
- Instructor: InstructorExamsDashboard, BankManager, IntakeGroupTable, StudentEnrollmentsView, MaterialsManager, InstructorStudentsView
- Staff: StudentDetailPanel
