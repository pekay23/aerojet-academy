# Staff Portal — EASA 147/145 Compliance Audit
Date: 2026-08-27
Auditor: EASA Compliance Auditor Agent

## Executive Summary

The Aerojet Academy Staff portal contains a partially mature EASA compliance substrate: attendance tracking enforces a configurable 80% threshold, exam scheduling includes sophisticated conflict detection and demand analytics, and certificate release logic encodes pathway-specific rules. However, critical regulatory gaps remain in OJT/Part-145 experience tracking (no staff-facing review workflow), practical assessment management (no dedicated UI despite a complete schema), certificate expiration and renewal tracking, and formal compliance reporting for aviation authority submission.

## Findings

### Attendance Tracking (Part-147)

#### No Part-147 Session-Type Distinction
- **File**: `app/staff/attendance/_components/AttendanceManager.tsx`
- **Lines**: 16-24, 125-126
- **Severity**: High
- **Type**: Improvement
- **Description**: Attendance statuses are generic (PRESENT, ABSENT, LATE, EXCUSED). Part-147 training requires differentiation between theoretical knowledge instruction, practical training, and simulator sessions, each with distinct minimum attendance requirements. The current UI calculates a single attendance rate without weighting by session type.
- **Recommendation**: Add a `sessionType` field (THEORY / PRACTICAL / SIMULATOR) to the `AttendanceRecord` model and AttendanceManager UI. Enforce per-module thresholds in `lib/attendance.ts` rather than a single global rate.
- **Code Reference**: `lib/attendance.ts:68` — `const percentage = Math.round((attendedCount / total) * 100)` computes a flat rate with no session-type weighting.

#### Missing Module-Level Attendance Compliance Reporting
- **File**: `app/staff/reports/attendance/page.tsx`
- **Lines**: 1-5
- **Severity**: Medium
- **Type**: Improvement
- **Description**: The attendance report page redirects to `/staff/reports?tab=attendance`, which shows aggregate metrics only. Part-147 requires per-module attendance evidence to demonstrate individual student compliance with training programme requirements.
- **Recommendation**: Build a per-student, per-module attendance compliance report that flags students below threshold by module, with export capability (CSV/PDF) for authority audits.
- **Code Reference**: `app/staff/reports/page.tsx:712-847` — `AttendanceTab` shows only aggregate charts and a flat recent-history table.

#### Attendance API Lacks Module Filtering
- **File**: `app/api/staff/attendance/route.ts`
- **Lines**: 24-88
- **Severity**: Medium
- **Type**: Improvement
- **Description**: The GET endpoint filters by `classId` and `date` only. There is no way to query attendance for a specific module or course across classes, which is required for Part-147 compliance verification.
- **Recommendation**: Add `courseId` and `moduleCode` query parameters to the attendance API.
- **Code Reference**: `app/api/staff/attendance/route.ts:32-37` — `where` clause only supports `classId` and `date`.

---

### OJT / Experience Tracking (Part-145)

#### No Staff-Facing OJT Logbook Review or Approval Workflow
- **File**: `app/staff/users/[id]/_components/OjtSection.tsx`
- **Lines**: 33-307
- **Severity**: Critical
- **Type**: Bug
- **Description**: `OjtSection` is a read-only display plus status-toggle for OJT periods. Staff can change status (PENDING/ACTIVE/COMPLETED/FAILED) but cannot review, approve, or edit `OJTLogbookEntry` records. The `OJTLogbookEntry` schema includes `supervisorSignature`, `studentSignature`, `verifiedByManagement`, and `competencyRating` — none of which have staff-facing management interfaces.
- **Recommendation**: Create `app/staff/ojt/` with pages for logbook review, entry approval, competency rating, and mentor assignment management. Wire audit logging for all Part-145 experience approvals.
- **Code Reference**: `prisma/schema.prisma:2163-2196` — `OJTLogbookEntry` defines full Part-145 evidence fields but no staff UI exists to manage them.

#### Missing Part-145 Facility and Mentor Tracking UI
- **File**: `prisma/schema.prisma`
- **Lines**: 2199-2236
- **Severity**: High
- **Type**: Improvement
- **Description**: The `OJTLogbook` model stores `facilityName`, `facilityApprovalNo`, and `OJTMentorAssignment` links, but there is no staff interface to verify facility approvals, assign/revoke mentors, or track mentor-to-student ratios per EASA 145.147 requirements.
- **Recommendation**: Add facility approval verification and mentor assignment management under the OJT section. Display `facilityApprovalNo` and mentor credentials for inspector review.
- **Code Reference**: `prisma/schema.prisma:2203-2204` — `facilityName` and `facilityApprovalNo` exist in the model but have no staff-facing validation UI.

#### No OJT API Route
- **File**: `app/staff/users/[id]/_components/OjtSection.tsx`
- **Lines**: 72-93, 96-112
- **Severity**: Critical
- **Type**: Bug
- **Description**: The component calls `POST /api/staff/students/${userId}/ojt` and `PATCH /api/staff/students/${userId}/ojt`, but these routes do not exist in the codebase. OJT status updates and creation will fail at runtime.
- **Recommendation**: Implement the missing API routes with proper validation, RLS, and audit logging.
- **Code Reference**: `app/staff/users/[id]/_components/OjtSection.tsx:72` — `fetch(`/api/staff/students/${userId}/ojt`, ...)` with no matching route file.

---

### Exam Management

#### No EASA Exam Session Manifest for Authority Review
- **File**: `app/staff/exams/events/[id]/page.tsx`
- **Lines**: 293-336
- **Severity**: High
- **Type**: Improvement
- **Description**: The exam event detail page shows sittings and assignments but does not generate a regulatory manifest (candidate list, examiner credentials, venue, session times, attendance outcomes) required for EASA 147 examination oversight.
- **Recommendation**: Add a "Generate Authority Manifest" button that produces a timestamped PDF/CSV containing all candidates, their attendance status, scores, examiner name and signature, and venue details per sitting.
- **Code Reference**: `app/staff/exams/events/[id]/page.tsx:293-336` — sittings are listed with `_count.assignments` but no exportable manifest.

#### Question Bank Changes Lack Immutable Audit Trail
- **File**: `app/staff/exams/internal/_components/ExamBankManager.tsx`
- **Lines**: 1-239
- **Severity**: Medium
- **Type**: Improvement
- **Description**: The ExamBankManager shows pool health and pending questions but does not track who added, modified, or retired questions. EASA 147 requires question bank integrity controls.
- **Recommendation**: Add versioning and immutable change logs for exam questions and bank metadata. Include reviewer, timestamp, and diff in the audit trail.
- **Code Reference**: `app/staff/exams/internal/_components/ExamBankManager.tsx:45-55` — `fetchBanks` loads current state only; no history is queried or displayed.

#### Exam Result Editing Without Integrity Check
- **File**: `app/staff/actions.ts`
- **Lines**: 297-529
- **Severity**: High
- **Type**: Bug
- **Description**: `updateExamBooking` allows staff to edit exam scores, results, and categories with only a generic `UPDATE` audit log. There is no immutability flag, no two-person verification, and no prevention of result alteration after certificate issuance. This undermines result integrity for EASA compliance.
- **Recommendation**: Freeze `ExamResult` records once a certificate is issued. Add a `resultLocked` boolean and require supervisor override for post-lock edits. Enrich audit log with before/after diff.
- **Code Reference**: `app/staff/actions.ts:372-401` — booking updates allow unrestricted score/result mutation.

---

### Certificate Management

#### No Certificate Expiration or Renewal Tracking
- **File**: `prisma/schema.prisma`
- **Lines**: 2454-2474
- **Severity**: High
- **Type**: Improvement
- **Description**: `StudentDocument` has an `expiresAt` field, but there is no staff-facing expiration dashboard, no renewal reminders, and no workflow to trigger re-issuance. EASA certificates and ratings have mandatory validity periods.
- **Recommendation**: Build a certificate expiration tracker under `app/staff/certificates/` that lists documents approaching expiry, automates reminder notifications, and initiates renewal workflows.
- **Code Reference**: `prisma/schema.prisma:2463` — `expiresAt DateTime?` exists but is not surfaced in any staff report.

#### Rating / License Expiration Not Modeled
- **File**: `prisma/schema.prisma`
- **Lines**: 338-347
- **Severity**: High
- **Type**: Improvement
- **Description**: `StudentLicenseTarget` links students to `LicenseCategory` but stores no expiration date, validity period, or rating class details. EASA 147/145 requires tracking of license ratings, type ratings, and their expiry for both training and maintenance staff.
- **Recommendation**: Extend `StudentLicenseTarget` (or create a `LicenseInstance` model) with `issuedAt`, `expiresAt`, `issuingAuthority`, and `ratingCode`. Add a staff dashboard for rating status and renewal.
- **Code Reference**: `prisma/schema.prisma:338-347` — `StudentLicenseTarget` is a minimal join table with no temporal or validity fields.

#### Certificate Release Override Lacks Supervisor Authorization
- **File**: `app/staff/actions.ts`
- **Lines**: 967-1015
- **Severity**: Medium
- **Type**: Improvement
- **Description**: `setCertificateRelease` allows any staff member to force-release certificates. There is no role check beyond `requireStaff()`, no secondary authorization, and no justification field in the audit log for the override reason.
- **Recommendation**: Restrict force-release to ADMIN/SUPER_ADMIN roles. Add an override justification field and require it for audit completeness.
- **Code Reference**: `app/staff/actions.ts:972` — `await requireStaff()` is the only gate.

---

### Practical Assessments

#### No Staff-Facing Practical Assessment Management
- **File**: `app/staff/students/[id]/_components/StudentDetailTabs.tsx`
- **Lines**: 15-22
- **Severity**: Critical
- **Type**: Bug
- **Description**: The student detail tabs include Profile, Journey, Exams, Wallet, Academic, and Admin Notes — but no Practical Training tab. The `PracticalTrainingRecord` model exists with `instructorId`, `assessorId`, `result`, `signedByInstructor`, `signedByStudent`, and `ataChapterId`, yet there is no staff UI to create, review, or approve practical assessments.
- **Recommendation**: Add a Practical Assessments tab to `StudentDetailTabs` and build `app/staff/practical/` pages for assessment scheduling, evidence upload, dual-sign-off, and ATA-chapter task tracking.
- **Code Reference**: `app/staff/students/[id]/_components/StudentDetailTabs.tsx:15-22` — `TABS` array omits practical assessments entirely.

#### Practical Assessment Result Cannot Be Amended After Sign-Off
- **File**: `prisma/schema.prisma`
- **Lines**: 2238-2269
- **Severity**: Medium
- **Type**: Improvement
- **Description**: `PracticalTrainingRecord` has `signedByInstructor` and `signedByStudent` booleans but no `lockedAt` or `lockedBy` fields. Once signed, there is no technical prevention against later modification, which compromises assessment integrity.
- **Recommendation**: Add `lockedAt` / `lockedBy` fields and enforce immutability in the API layer once both signatures are recorded.
- **Code Reference**: `prisma/schema.prisma:2255-2257` — signature booleans exist without a lock mechanism.

---

### Scheduling

#### No Instructor Availability Validation in Class Creation
- **File**: `lib/scheduling/conflicts.ts`
- **Lines**: 29-127
- **Severity**: Medium
- **Type**: Improvement
- **Description**: `findConflicts` detects overlaps after they exist but does not check instructor availability windows (e.g., declared unavailability, maximum daily instructional hours per EASA 147). Staff can double-book instructors across classes.
- **Recommendation**: Integrate `StaffAvailability` slots into conflict detection. Block class creation when an instructor has no availability window for the proposed time slot.
- **Code Reference**: `lib/scheduling/conflicts.ts:34-61` — queries `Class` records only; no join to instructor availability.

#### Recurrence Expansion Does Not Respect maxDailyHours
- **File**: `lib/scheduling/recurrence.ts`
- **Lines**: 60-120
- **Severity**: Low
- **Type**: Improvement
- **Description**: `expandClass` generates occurrences for recurring classes but does not validate that total instructional hours per day stay within EASA 147 limits (typically 8 hours theory, fewer for practical).
- **Recommendation**: Add a daily-hours cap check in `expandClass` or in the class creation/update action.
- **Code Reference**: `lib/scheduling/recurrence.ts:93-118` — the while loop emits every allowed day occurrence without duration validation.

---

### Reporting

#### No EASA Compliance Report Export
- **File**: `app/staff/reports/page.tsx`
- **Lines**: 1-1128+
- **Severity**: High
- **Type**: Improvement
- **Description**: The reports dashboard provides operational analytics (enrollment, revenue, attendance, exams) but no EASA-specific compliance report. There is no export to PDF/CSV formatted for Part-147/145 authority submission.
- **Recommendation**: Add a "Compliance Reports" section generating: (1) Part-147 training completion report per student/module, (2) Part-145 OJT experience logbook summary, (3) exam session manifest, (4) certificate/rating status register.
- **Code Reference**: `app/staff/reports/page.tsx:55-270` — OverviewTab shows only operational KPIs with no compliance framing.

#### No Attendance Compliance Report per Student
- **File**: `app/api/staff/attendance/summary/route.ts`
- **Lines**: 11-69
- **Severity**: Medium
- **Type**: Improvement
- **Description**: The summary endpoint returns per-class attendance rates and cumulative training hours toward 2,400h, but it does not flag students who are non-compliant with Part-147 module attendance requirements or identify those at risk of failing the programme.
- **Recommendation**: Add a `complianceStatus` field (COMPLIANT / AT_RISK / NON_COMPLIANT) and include it in the response.
- **Code Reference**: `app/api/staff/attendance/summary/route.ts:37-45` — `belowThreshold` is computed but not returned as a structured compliance status.

---

### Data Integrity

#### Exam Results Can Be Deleted Without Trace
- **File**: `app/staff/actions.ts`
- **Lines**: 731-762
- **Severity**: High
- **Type**: Bug
- **Description**: `deleteExamRecord` hard-deletes `ExamResult` or `ExamBooking` rows. For EASA compliance, exam results must be immutable once issued; deletion destroys the evidence chain.
- **Recommendation**: Replace hard delete with a soft-delete flag (`deletedAt`) and require ADMIN+ role. Never allow deletion of issued results; only allow supersession via a new record with a reference to the original.
- **Code Reference**: `app/staff/actions.ts:741-745` — `prismaUnfiltered.examResult.delete()` and `prismaUnfiltered.examBooking.delete()`.

#### Audit Log Does Not Capture IP or User-Agent Consistently
- **File**: `lib/audit/logger.ts`
- **Lines**: 39-60
- **Severity**: Low
- **Type**: Improvement
- **Description**: `logAuditEvent` accepts `ipAddress` and `userAgent` but most callers (including `updateExamBooking`, `createExamRecord`, `setCertificateRelease`) do not pass them. Regulatory audits require provenance metadata.
- **Recommendation**: Update all audit log callers in `app/staff/actions.ts` to pass `ipAddress` and `userAgent` from the request context.
- **Code Reference**: `app/staff/actions.ts:505-522` — `createAuditLog` is called without IP/UA fields.

## Appendix

### Files Audited
- `app/staff/attendance/page.tsx`
- `app/staff/attendance/_components/AttendanceManager.tsx`
- `app/staff/users/[id]/_components/OjtSection.tsx`
- `app/staff/students/[id]/_components/CertificateReleaseControl.tsx`
- `app/staff/students/[id]/_components/ExamsTab.tsx`
- `app/staff/students/[id]/_components/StudentDetailTabs.tsx`
- `app/staff/students/[id]/page.tsx`
- `app/staff/users/[id]/page.tsx`
- `app/staff/exams/internal/_components/ExamBankManager.tsx`
- `app/staff/exams/internal/page.tsx`
- `app/staff/exams/events/[id]/page.tsx`
- `app/staff/reports/page.tsx`
- `app/staff/reports/attendance/page.tsx`
- `app/staff/timetable/conflicts/page.tsx`
- `app/staff/actions.ts`
- `app/api/staff/attendance/route.ts`
- `app/api/staff/attendance/summary/route.ts`
- `lib/attendance.ts`
- `lib/exams/attendance.ts`
- `lib/exams/scheduler.ts`
- `lib/scheduling/recurrence.ts`
- `lib/scheduling/conflicts.ts`
- `lib/certificates/eligibility.ts`
- `lib/audit/logger.ts`
- `prisma/schema.prisma` (models: AttendanceRecord, OJTLogbook, OJTLogbookEntry, OJTMentorAssignment, PracticalTrainingRecord, ExamAttendance, ExamResult, ExamBooking, ExamSitting, ExamEvent, StudentDocument, StudentLicenseTarget, Maintenance145Transfer, Class, Classroom)

### Total Findings
- Critical: 3
- High: 6
- Medium: 7
- Low: 2
- No Action Needed: 0
