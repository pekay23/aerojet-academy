# Admissions Pipeline — Full Implementation Plan

## Context

Aerojet Academy currently uses a simplified 4-step applicant flow: Register → Pay Registration Fee → Staff Approves → Applicant Portal Access. The academy previously relied on BambooHR to manage the full admissions pipeline (aptitude testing, interview scheduling, medical clearance). This plan brings the entire admissions lifecycle in-house, replacing BambooHR with a fully integrated system within the existing Next.js portal.

The user went through this process firsthand as an applicant — the design is based on their real experience.

**Who this affects:** Full-time programme applicants (FULL_TIME_4YEAR, FULL_TIME_2YEAR, MILITARY_1YEAR, MODULAR). EXAM_ONLY applicants bypass the pipeline entirely and continue using the existing simplified flow.

### Programme-Specific Pipeline Paths

Not all programmes follow the same pipeline. The state machine must support per-programme stage skipping:

| Stage | FULL_TIME_4YEAR | FULL_TIME_2YEAR | MILITARY_1YEAR | MODULAR | EXAM_ONLY |
|-------|:-:|:-:|:-:|:-:|:-:|
| Registration + Payment | Yes | Yes | Yes | Yes | Existing flow |
| Document Uploads | Yes (admin-configured) | Yes (admin-configured) | Yes (admin-configured) | Yes (admin-configured) | Skip |
| Aptitude Test | Yes | Yes | Yes | Optional (admin toggle) | Skip |
| Shortlisting | Yes | Yes | Yes | Auto-accept if aptitude passed | Skip |
| Interview | Yes | Yes | Yes | Skip | Skip |
| Medical | Yes | Yes | Yes | Skip | Skip |
| Enrollment | → Batch + Class + AcademicYear (scholarship, no cert issue, bonded) | → Batch + Class + AcademicYear (self-funded, certs issued, no OJT) | → Batch + Class (accelerated) | → Course catalog + completion deadline | → Exam access only |

**Implementation:** `Application` model gets a `programmeChoice ProgrammeChoice` field. The state machine's `allowedTransitions` map checks this field to skip inapplicable stages (e.g., modular applicants transition directly from `SHORTLISTED` → `SELECTED` → `ENROLLED`, skipping interview and medical).

### Post-Enrollment Divergence

What happens after `MEDICAL_CLEARED` / `ENROLLED` depends on programme:

- **Full-time (4yr/2yr):** Staff creates an IntakeCycle → admitted students form a batch (~50) → batch is split into Classes (~25 each) → classes linked to AcademicYear + Semester. Uses existing batch enrollment (`/staff/classes/[id]/roster/BatchEnrollmentForm.tsx`).
- **Military 1-year:** Same as full-time but with accelerated semester structure (admin configures compressed AcademicTerms).
- **Modular:** No batch/class/academic year. Student gets course catalog access. `Application.completionDeadline` is set by admin (e.g., 2 years from enrollment). Cron job warns students approaching deadline. Primary activity is self-paced exam booking.
- **EXAM_ONLY:** Unchanged — direct exam booking access.

---

## Feature Flag Strategy — Gradual Activation

The entire new system is built behind feature flags. The current simplified flow (Register → Pay → Approve → Portal Access) remains the **default** until admin explicitly activates each subsystem. This means:

1. We can implement, test, and even deploy everything without affecting live users.
2. Admin enables each subsystem independently when confident it's ready.
3. If something goes wrong, admin flips the switch off and the old flow resumes instantly.

### SystemSettings Feature Flags

| Key | Default | What it controls |
|-----|---------|-----------------|
| `admissions_pipeline_enabled` | `false` | Master switch. When OFF: registration creates User only (current flow). When ON: also creates Application record, state machine activates, full pipeline kicks in. |
| `aptitude_test_enabled` | `false` | When OFF: applicants skip aptitude stage entirely (auto-transition PAYMENT_VERIFIED → SHORTLISTED). When ON: applicants must complete aptitude test. |
| `interview_system_enabled` | `false` | When OFF: shortlisted applicants skip interview (auto-transition SHORTLISTED → SELECTED). When ON: interview scheduling activates. |
| `medical_review_enabled` | `false` | When OFF: selected applicants skip medical (auto-transition SELECTED → ENROLLED). When ON: medical upload/review flow activates. |
| `internal_exam_system_enabled` | `false` | When OFF: students use existing exam flow. When ON: internal exam test-taking UI available. |
| `document_uploads_enabled` | `false` | When OFF: no document upload step in pipeline. When ON: applicants see document upload page after payment verification. |

### How the Code Checks Flags

**Registration API** (`app/api/public/register/route.ts`):
```
if (admissions_pipeline_enabled && programmeChoice !== 'EXAM_ONLY') {
  // Create Application record, set stage to REGISTERED
} else {
  // Current flow — User + Profile only, no Application
}
```

**Approval API** (`app/api/staff/applicants/[id]/approve/route.ts`):
```
if (admissions_pipeline_enabled && application exists) {
  // Use state machine transitions
} else {
  // Current flow — set status ACTIVE, generate email, etc.
}
```

**Applicant status page** (`app/applicant/application/status/page.tsx`):
```
if (admissions_pipeline_enabled && application exists) {
  // Show dynamic pipeline tracker
} else {
  // Show current 4-step tracker
}
```

**Applicant sidebar** (`app/applicant/_components/ApplicantSidebar.tsx`):
```
if (admissions_pipeline_enabled && application exists) {
  // Show stage-aware menu items
} else {
  // Show current sidebar links
}
```

**Staff sidebar** (`app/staff/_components/StaffSidebar.tsx`):
```
if (admissions_pipeline_enabled) {
  // Show "Admissions" section with sub-pages
}
if (internal_exam_system_enabled) {
  // Show "Internal Exams" under Academics
}
```

**State machine** (`lib/admissions/state-machine.ts`):
```
// Before transitioning, check if the target stage's subsystem is enabled
// If aptitude_test_enabled === false, skip APTITUDE_PENDING → APTITUDE_COMPLETED
// If interview_system_enabled === false, skip INTERVIEW_* stages
// If medical_review_enabled === false, skip MEDICAL_* stages
```

### Activation Sequence (Recommended)

Admin enables subsystems in this order as confidence grows:

1. **`admissions_pipeline_enabled`** — Activates Application creation + pipeline tracker. All sub-stages auto-skip since their flags are off. Net effect: same flow as before, but with Application record tracking.
2. **`document_uploads_enabled`** — Adds document upload step. Low risk, easy to verify.
3. **`aptitude_test_enabled`** — Adds aptitude testing. Test with a few applicants first.
4. **`interview_system_enabled`** — Adds interview scheduling. Requires admin to set up schedules/slots first.
5. **`medical_review_enabled`** — Adds medical examination flow. Full pipeline now active.
6. **`internal_exam_system_enabled`** — Independent of admissions pipeline. Activates student exam system.

### Admin UI

**New:** `app/staff/settings/feature-flags/page.tsx`
- Simple toggle switches for each flag
- Warning banner: "Changing this affects all new applicants immediately"
- Shows current state of each subsystem with a green/red indicator
- "Test Mode" option: enable a flag for a specific intake cycle only (future enhancement)

---

## Phase 1: Foundation — Data Model + State Machine + Pipeline Visibility

### 1.1 New Prisma Models & Enums

**File:** `prisma/schema.prisma`

```
New Enums:
- ApplicationStage (17 values): REGISTERED → PAYMENT_PENDING → PAYMENT_SUBMITTED → PAYMENT_VERIFIED → APTITUDE_PENDING → APTITUDE_COMPLETED → SHORTLISTED → INTERVIEW_PENDING → INTERVIEW_SCHEDULED → INTERVIEW_COMPLETED → SELECTED → MEDICAL_PENDING → MEDICAL_SUBMITTED → MEDICAL_CLEARED → ENROLLED → REJECTED → WITHDRAWN
- AptitudeCategory: MATH, ENGLISH, ENGINEERING, LOGICAL_REASONING, PHYSICS
- AptitudeQuestionType: MCQ, NUMERIC_INPUT, TRUE_FALSE
- QuestionDifficulty: EASY, MEDIUM, HARD
- TestSessionStatus: NOT_STARTED, IN_PROGRESS, COMPLETED, TIMED_OUT, FLAGGED, VOIDED
- InterviewResult: PASS, FAIL, CONDITIONAL, NO_SHOW
- MedicalStatus: PENDING, SCHEDULED, IN_PROGRESS, DOCUMENTS_SUBMITTED, CLEARED, FAILED, EXEMPTED

New Models:
- Application (central pipeline tracker — 1:1 with User)
  - programmeChoice     ProgrammeChoice (mirrors User.programmeChoice for pipeline logic)
  - fundingType         FundingType (SCHOLARSHIP, SELF_FUNDED, SPONSORED)
  - completionDeadline  DateTime? (admin-set deadline for modular students)
  - interviewRescheduleCount Int @default(0)
- ApplicationStageLog (immutable stage transition history)
- IntakeCycle (admissions cycle grouping, linked to AcademicYear)
  - intakeCycleId on Application — which intake cycle the applicant applied under
- AptitudeTestBank (named question collections)
  - applicableProgrammes ProgrammeChoice[] (tag banks by programme for admin organization — all programmes currently use the same general aptitude scope, but tagging allows admin to differentiate later if needed)
- AptitudeQuestion (individual questions with category, type, options, difficulty)
- AptitudeTestSession (per-user test attempt with anti-cheat tracking)
- AptitudeAnswer (per-question response within a session)
- InterviewSchedule (date range + cycle link)
- InterviewSlot (individual bookable time slot)
- ApplicationDocumentType (admin-configurable document requirements — name, slug, fileTypes, maxSize, isRequired, applicableProgrammes)
- ApplicationDocument (per-applicant uploaded document — links Application to FileUpload + DocumentType, with review status)

User model additions: application (Application?), aptitudeTestSessions (AptitudeTestSession[])

New Enums:
- FundingType: SCHOLARSHIP, SELF_FUNDED, SPONSORED
- DocumentReviewStatus: PENDING, APPROVED, REJECTED
```

### 1.2 State Machine

**New file:** `lib/admissions/state-machine.ts`

Core function: `transitionApplication(applicationId, targetStage, actorId, metadata?)`
- Validates transition against allowed transitions map
- Updates `Application.stage` and `Application.previousStage`
- Creates `ApplicationStageLog` entry
- Triggers side effects (emails, notifications, auto-transitions)
- Returns updated Application

**New file:** `lib/admissions/constants.ts`
- Stage labels, colors, descriptions, icons
- Allowed transitions map
- Stage-specific instructions for the applicant status page

### 1.3 Integration Points

**Modify:** `app/api/public/register/route.ts`
- After creating User + Profile, also create `Application` record for non-EXAM_ONLY applicants
- Set initial stage to `REGISTERED`, auto-transition to `PAYMENT_PENDING`

**Modify:** `app/api/staff/applicants/[id]/approve/route.ts`
- After existing approval logic, transition Application to `PAYMENT_VERIFIED` → `APTITUDE_PENDING`

**Modify:** `app/applicant/application/status/page.tsx`
- Replace hardcoded 4-step timeline with dynamic pipeline tracker reading from `Application.stage`
- Show stage-specific instructions and next actions

**New:** `app/staff/admissions/page.tsx` + `loading.tsx`
- Pipeline overview: counts per stage (funnel visualization)
- Quick filters: by intake cycle, programme choice
- Links to sub-sections (aptitude, interviews, medical, shortlisting)

**Modify:** Staff sidebar (`app/staff/_components/StaffSidebar.tsx`)
- Add "Admissions" section with children: Pipeline, Intake Cycles, Aptitude Tests, Interviews, Medical Review, Shortlisting

---

## Phase 2: Document Uploads + Intake Cycles

### 2.1 Configurable Document Requirements

The academy requires various documents from applicants — not just CV and cover letter. Known document types include:
- CV / Resume
- Cover Letter
- National Identification (Ghana Card, Driving License, Passport, etc.)
- High School Certificate
- University Bachelor's Certificate
- Others as needed

**Admin must be able to add, remove, and configure required documents** per intake cycle or programme type, without code changes.

**New model:** `ApplicationDocumentType`
```
- id, name (display label), slug (unique key), description
- fileTypes (allowed MIME types — default PDF + image)
- maxSizeMB (default 4)
- isRequired Boolean (vs optional)
- applicableProgrammes ProgrammeChoice[] (empty = all programmes)
- sortOrder Int (display ordering)
- isActive Boolean
```

**New model:** `ApplicationDocument`
```
- id, applicationId, documentTypeId, fileUploadId
- status: PENDING | APPROVED | REJECTED
- rejectionReason String?
- reviewedBy, reviewedAt
```

**Modify:** `app/api/uploadthing/core.ts`
- Add single generic route slug: `applicantDocument` (PDF + images, configurable max size)

**New:** `app/applicant/application/documents/page.tsx` + `loading.tsx` + `_components/DocumentUploadForm.tsx`
- Dynamically renders upload fields based on active `ApplicationDocumentType` records matching applicant's programme
- Shows required vs optional labels, upload status per document, re-upload option
- Staff can review and approve/reject individual documents

**New:** `app/staff/admissions/document-types/page.tsx`
- Admin CRUD for document type configuration
- Set which documents are required for which programmes
- Reorder, activate/deactivate

**New API:** `app/api/staff/admissions/document-types/route.ts` (GET/POST)
- `app/api/staff/admissions/document-types/[id]/route.ts` (PUT/DELETE)

This replaces the original hardcoded CV/cover letter approach — the system is now fully flexible for any document the academy needs in the future.

### 2.2 Intake Cycles

**New pages:**
- `app/staff/admissions/intake-cycles/page.tsx` — List all cycles
- `app/staff/admissions/intake-cycles/create/page.tsx` — Create new cycle

**New API:** `app/api/staff/admissions/intake-cycles/route.ts` (GET/POST)
- `app/api/staff/admissions/intake-cycles/[id]/route.ts` (GET/PUT/DELETE)

### 2.3 Updated Applicant Sidebar

**Modify:** `app/applicant/_components/ApplicantSidebar.tsx`
- Dynamically show menu items based on `Application.stage`:
  - Always: Dashboard, My Application, Notifications
  - After PAYMENT_VERIFIED: Upload Documents
  - At APTITUDE_PENDING: Aptitude Test
  - At INTERVIEW_PENDING/SCHEDULED: Interview
  - At MEDICAL_PENDING: Medical Examination
  - Existing items (Wallet, Courses, Exam Bookings) remain for pathway-eligible applicants

---

## Phase 3: Aptitude Test System

### 3.1 Admin — Question Bank Management

**New pages:**
- `app/staff/admissions/aptitude/page.tsx` — Question bank list
- `app/staff/admissions/aptitude/banks/[id]/page.tsx` — Edit bank + questions
- `app/staff/admissions/aptitude/banks/[id]/_components/QuestionEditor.tsx` — CRUD for questions
- `app/staff/admissions/aptitude/config/page.tsx` — Test settings (via SystemSettings)
- `app/staff/admissions/aptitude/results/page.tsx` — All session results

**New APIs:**
- `app/api/staff/admissions/aptitude/banks/route.ts` (GET/POST)
- `app/api/staff/admissions/aptitude/banks/[id]/route.ts` (GET/PUT/DELETE)
- `app/api/staff/admissions/aptitude/banks/[id]/questions/route.ts` (GET/POST)
- `app/api/staff/admissions/aptitude/banks/[id]/questions/[questionId]/route.ts` (PUT/DELETE)
- `app/api/staff/admissions/aptitude/sessions/route.ts` (GET — all sessions)
- `app/api/staff/admissions/aptitude/sessions/[id]/route.ts` (GET — detail)
- `app/api/staff/admissions/aptitude/sessions/[id]/void/route.ts` (POST — void flagged session)

**SystemSettings keys:**
- `aptitude_time_limit_minutes` (default 60)
- `aptitude_pass_threshold_pct` (default 50)
- `aptitude_math_count` (default 10)
- `aptitude_english_count` (default 10)
- `aptitude_engineering_count` (default 5)
- `aptitude_reasoning_count` (default 5)
- `aptitude_max_tab_switches` (default 3)
- `aptitude_active_bank_id` (fallback — overridden by bank's `applicableProgrammes` matching)
- `aptitude_require_for_modular` (default false — toggle whether modular applicants must take aptitude test)
- `aptitude_shuffle_questions` (default true)
- `aptitude_shuffle_options` (default true)
- `aptitude_allow_retake` (default false)
- `aptitude_show_results_to_applicant` (default false)

### 3.2 Applicant — Test Taking UI

**New pages:**
- `app/applicant/application/aptitude-test/page.tsx` — Pre-test info + start button
- `app/applicant/application/aptitude-test/results/page.tsx` — View results (if configured)

**New client components** (under `_components/`):
- `TestWarningModal.tsx` — Rules, fullscreen notice, timer info, confirm to start
- `TestInterface.tsx` — Main test-taking UI (fullscreen, renders questions one-at-a-time or all)
- `QuestionCard.tsx` — Renders MCQ (radio buttons), NUMERIC_INPUT (number field), TRUE_FALSE
- `TestTimer.tsx` — Countdown synced with server `expiresAt`
- `AntiCheatProvider.tsx` — React context wrapping Fullscreen API + visibility listeners

**New APIs:**
- `app/api/applicant/aptitude/start/route.ts` — Create session, select random questions, return question set
- `app/api/applicant/aptitude/answer/route.ts` — Save answer(s), validate session active
- `app/api/applicant/aptitude/submit/route.ts` — Finalize, auto-grade, calculate score, transition stage
- `app/api/applicant/aptitude/anti-cheat/route.ts` — Report tab switch / fullscreen exit
- `app/api/applicant/aptitude/session/route.ts` — GET current session state (for resume)

**New library files:**
- `lib/aptitude/grading.ts` — Compare answers to correct answers, calculate score
- `lib/aptitude/question-selector.ts` — Random selection per category from active bank
- `lib/aptitude/anti-cheat.ts` — Server-side validation (expiry check, flag threshold)

### 3.3 Anti-Cheat Measures

**Client-side (deterrent):**
- `document.documentElement.requestFullscreen()` on test start
- `document.addEventListener('visibilitychange')` — detect tab switch
- `window.addEventListener('blur')` — detect window switch
- CSS `user-select: none`, `oncontextmenu` prevention on test area
- Warning overlay on each violation, auto-submit after threshold
- Disable browser back/forward navigation during test

**Server-side (authoritative):**
- `expiresAt` set on session start — no submissions accepted after
- `tabSwitchCount` and `fullscreenExits` tracked via API calls
- Auto-flag when thresholds exceeded (configurable via SystemSettings)
- IP + user agent logged
- One active session per user enforced
- Answer timestamps validated for plausible completion times

### 3.4 Auto-Grading

- MCQ: compare selected option to `correctAnswer`
- TRUE_FALSE: direct string comparison
- NUMERIC_INPUT: parse as float, compare with tolerance (per-question or global epsilon)
- Score = sum of `pointsAwarded` / sum of `points` → percentage
- `passed` = percentage >= `aptitude_pass_threshold_pct`

---

## Phase 4: Shortlisting

### 4.1 Scoring Engine

**New file:** `lib/admissions/scoring.ts`
- Composite score calculation: `(aptitude_score * weight_a) + (profile_completeness * weight_p) + (referral_bonus * weight_r)`
- Weights configurable via SystemSettings:
  - `shortlist_aptitude_weight` (default 60)
  - `shortlist_profile_weight` (default 20)
  - `shortlist_referral_weight` (default 10)
  - `shortlist_experience_weight` (default 10) — based on CV/background (manual staff score)
- Auto-shortlist threshold: `shortlist_auto_threshold` (default 70)
- Auto-reject threshold: `shortlist_auto_reject_threshold` (default 30)

### 4.2 Staff Shortlisting Dashboard

**New:** `app/staff/admissions/shortlisting/page.tsx`
- Table of applicants at `APTITUDE_COMPLETED` stage
- Columns: Name, Programme, Aptitude Score, Composite Score, CV (link), Actions
- Filters: by programme, intake cycle, score range
- Bulk actions: Shortlist Selected, Reject Selected
- Individual action: Review detail → Shortlist / Reject with reason

**New API:** `app/api/staff/admissions/shortlist/route.ts` (POST — individual or bulk)

---

## Phase 5: Interview Scheduler

### 5.1 Admin — Schedule & Slot Management

**New pages:**
- `app/staff/admissions/interviews/page.tsx` — Schedule list + calendar view
- `app/staff/admissions/interviews/schedules/[id]/page.tsx` — Edit schedule, manage slots
- `app/staff/admissions/interviews/schedules/[id]/_components/SlotGenerator.tsx` — Bulk generate slots
- `app/staff/admissions/interviews/schedules/[id]/_components/InterviewNotesForm.tsx` — Record notes/score

**New APIs:**
- `app/api/staff/admissions/interviews/schedules/route.ts` (GET/POST)
- `app/api/staff/admissions/interviews/schedules/[id]/route.ts` (GET/PUT/DELETE)
- `app/api/staff/admissions/interviews/schedules/[id]/slots/route.ts` (GET/POST)
- `app/api/staff/admissions/interviews/schedules/[id]/slots/generate/route.ts` (POST — bulk generate)
- `app/api/staff/admissions/interviews/[applicationId]/notes/route.ts` (POST — record interview outcome)

**Bulk slot generator logic:** Admin provides date range, available days of week, time blocks (e.g. 9-10am, 10-11am, 2-3pm), daily capacity limit → system creates all `InterviewSlot` records.

**SystemSettings keys:**
- `interview_max_reschedules` (default 2)
- `interview_reschedule_cutoff_hours` (default 24)
- `interview_duration_minutes` (default 60)
- `interview_daily_capacity` (default 10)

### 5.2 Applicant — Self-Service Booking

**New pages:**
- `app/applicant/interview/schedule/page.tsx` — Calendar showing available slots, book button
- `app/applicant/interview/status/page.tsx` — View booking details, reschedule option

**New APIs:**
- `app/api/applicant/interview/available-slots/route.ts` (GET — returns slots with `bookedCount < capacity`)
- `app/api/applicant/interview/book/route.ts` (POST — book slot with race-condition-safe transaction)
- `app/api/applicant/interview/reschedule/route.ts` (POST — release old slot, book new)

**Race condition prevention:** Use `prismaUnfiltered.$transaction()` with re-check inside:
```
1. Find slot, verify bookedCount < capacity
2. Increment bookedCount
3. Set Application.interviewSlotId + stage = INTERVIEW_SCHEDULED
```

**Rescheduling rules:**
- Max reschedules tracked on `Application.interviewRescheduleCount`
- Cannot reschedule within N hours of slot (cutoff from SystemSettings)
- On reschedule: decrement old slot bookedCount, increment new, update Application

### 5.3 Interview Outcome Recording

Staff records outcome via `InterviewNotesForm`:
- Score (0-100)
- Notes (text)
- Result: PASS / FAIL / CONDITIONAL / NO_SHOW
- On PASS → transition to `SELECTED` → auto-transition to `MEDICAL_PENDING`
- On FAIL → transition to `REJECTED` with reason

---

## Phase 6: Medical Examination & Enrollment Completion

### 6.1 Medical Tracking

Medical status is embedded in `Application` model (simple status + documents pattern):
- `medicalStatus` enum field
- `medicalClearedAt`, `medicalClearedBy`, `medicalNotes`, `medicalFacility`
- Documents stored via existing `FileUpload` model with `referenceType: 'MEDICAL'`

**SystemSettings keys:**
- `medical_exam_fee` (default 200)
- `medical_exam_currency` (default EUR)
- `medical_exam_location` (default address)
- `medical_allow_own_facility` (default true)
- `medical_required_documents` (default "medical_report,eye_test")

### 6.2 Applicant Medical Page

**New:** `app/applicant/application/medical/page.tsx` + `_components/MedicalUploadForm.tsx`
- Display: fee amount, payment instructions, examination location
- Toggle: "I will use the academy's facility" / "I will use my own facility" (+ facility name input)
- Upload medical documents (uses `medicalDocument` UploadThing route slug)
- Status tracker showing current medical status

### 6.3 Staff Medical Review

**New:** `app/staff/admissions/medical/page.tsx`
- Queue of applications at `MEDICAL_SUBMITTED` stage
- View uploaded documents
- Actions: Clear / Request Resubmission / Fail

### 6.4 Final Enrollment

On final stage reached (programme-dependent — `MEDICAL_CLEARED` for full-time/military, `SELECTED` or `SHORTLISTED` for modular):

**All programmes:**
- Create StudentProfile, generate student ID
- Change role: APPLICANT → STUDENT
- Send enrollment completion email
- Application stage → `ENROLLED`
- Trigger existing promotion flow (currently in `app/api/applicant/pay-milestone/route.ts`)

**Full-time (4yr/2yr) + Military (1yr) — additional steps:**
- Assign to AcademicYear (current or next active year)
- Staff later creates IntakeCycle batch → splits into Classes (~25 each) using existing batch enrollment system
- Student gains access to: class schedule, classmates directory, seating, attendance

**Modular — additional steps:**
- Set `Application.completionDeadline` (admin-configurable, default 2 years from enrollment)
- No batch/class/academic year assignment
- Student gains access to: course catalog, self-paced exam booking, study materials
- Cron job: warn students at 75% and 90% of deadline elapsed

**Modular "class option":**
- Modular students who opt for academy-provided class lessons are enrolled into a Class (like full-time) but without a fixed academic year/semester. Admin creates ad-hoc classes for modular groups when demand exists.

---

## Phase 7: Email Templates

**New emails to add in `lib/email/service.ts`** (following existing `renderXxx` / `sendXxx` pattern):

| Template | Trigger | Key Content |
|----------|---------|-------------|
| `aptitude-test-invitation` | Payment verified | Link to start test, rules, time limit |
| `aptitude-test-result` | Test completed | Score, pass/fail (if configured to show) |
| `shortlisted` | Staff shortlists | Congrats, next step: interview scheduling |
| `interview-invitation` | Shortlisted | Link to schedule interview, available dates |
| `interview-confirmed` | Slot booked | Date, time, location, what to bring |
| `interview-rescheduled` | Slot changed | New date/time/location |
| `interview-reminder` | Cron (24h before) | Reminder with details |
| `interview-result-pass` | Interview passed | Congrats, medical next steps |
| `interview-result-fail` | Interview failed | Rejection with reason |
| `medical-instructions` | Selected | Fee, location, documents needed, own-facility option |
| `medical-cleared` | Medical approved | Congrats, enrollment confirmation |
| `medical-resubmit` | Docs rejected | What needs to be resubmitted |
| `application-rejected` | Rejected at any stage | Stage-specific rejection with reason |
| `enrollment-complete` | Medical cleared → enrolled | Welcome as student, portal link |

**New cron jobs** (add to existing cron infrastructure):
- Interview reminders (24h before)
- Aptitude test reminders (if not started within N days)
- Modular completion deadline warnings (at 75% and 90% of deadline elapsed)
- Modular deadline enforcement (flag/notify admin when deadline passes)

---

## Phase 8: Internal Exam System (Reusing Aptitude Test Infrastructure)

The aptitude test infrastructure (Phase 3) is designed for pre-enrollment screening, but the same test-taking engine can be reused for internal student exams — both EASA module assessments and non-EASA course tests. This avoids building a second test system.

### Current Implementation Status (2026-05-15)

The internal exam system is implemented behind the `internal_exam_system_enabled` feature flag and is wired through the staff, student, API, and settings surfaces.

Implemented:
- Staff exam-bank management: `app/staff/exams/internal/page.tsx`, `app/staff/exams/internal/_components/ExamBankManager.tsx`, `app/api/staff/exams/internal/banks/route.ts`, and `app/api/staff/exams/internal/banks/[bankId]/questions/route.ts`.
- Staff share links: expanded bank rows expose a copyable student-facing link in the form `/student/exams/internal?bankId=<bankId>`. Students still pass normal role and enrollment checks before starting.
- Student exam dashboard: `app/student/exams/internal/page.tsx` and `InternalExamDashboard.tsx` list only exam banks tied to courses the student is enrolled in, show attempt/retake/ban state, and open the matching pre-exam lobby from a shared bank link.
- Candidate confirmation: before starting, the lobby auto-fetches the student's profile, student ID, and programme details from `GET /api/student/exams/internal/progress`; the student must confirm these details before the start button is enabled.
- Live exam UI: `InternalExamInterface.tsx` supports answered/unanswered counts, question navigation, explicit skip-and-return behavior, autosave, final submission confirmation, and immediate result rendering.
- Exam APIs: `start`, `session`, `answer`, `submit`, and `progress` routes enforce authentication, `STUDENT` role, the internal-exam feature flag, course enrollment, retake waits, active-bank checks, and session ownership.
- Anti-cheat: when bank rules enable `allowKeyboardAutoSubmit`, a keyboard press during the active exam auto-submits the attempt and increments `InternalExamSession.keyboardEvents`. Timeout submission is also recorded through the same submit path.

Remaining implementation gaps:
- Staff-facing session/result review pages are still thinner than the plan: there is not yet a dedicated `/staff/exams/internal/sessions` detail surface for reviewing every answer and exporting a regulatory audit packet.
- Essay questions are scaffolded in the model, but the current live student UI is MCQ-focused.
- The standalone `keyboard-event` endpoint described in the original plan was folded into the submit path instead of implemented as a separate route.

### 8.1 EASA Module Exam Rules (from EASA Part 66 / aviacareers.com)

These are the official rules the academy follows for internal EASA module exams:

- **Question format:** Multiple-choice with **3 options** (only 1 correct). Essay questions also supported (20 min per essay).
- **Time per MCQ:** 75 seconds per question. Total time = questions × 75s (e.g., 40 questions = 50 minutes).
- **Pass mark:** 75% for each module and sub-module.
- **No penalty marking** — wrong answers don't deduct points.
- **Retake waiting period:** Failed modules cannot be retaken for **90 days** after the failed attempt.
- **Completion window:** All modules for a license category must be passed within **5 years** of passing the first module.
- **Anti-cheat (academy rule):** Any keyboard press during the exam **auto-submits the current answers and renders results immediately**. This prevents students from Alt-Tab / Ctrl-Tab screen switching. Combined with fullscreen enforcement from the aptitude test system.

### 8.2 How It Differs from Aptitude Tests

| Aspect | Aptitude Test (Pre-Enrollment) | Internal Exam (Post-Enrollment) |
|--------|-------------------------------|-------------------------------|
| Who takes it | Applicants | Enrolled students |
| Purpose | Admissions screening | Course module assessment |
| Question source | AptitudeTestBank | InternalExamBank (per course/module) |
| Question format | MCQ, numeric, true/false | MCQ (3 options), essay |
| Time calculation | Fixed total (admin-set, e.g. 60 min) | Per-question (75s × question count for EASA) |
| Pass mark | 50% (configurable) | 75% (EASA) / admin-configurable (non-EASA) |
| Anti-cheat | Tab switch warning → threshold → auto-submit | **Any keyboard press = instant auto-submit** |
| Retake rules | Admin toggle (allow/deny) | 90-day wait (EASA) / admin-configurable (non-EASA) |
| Results | Score + pass/fail (optionally hidden) | Score + pass/fail (always shown to student) |
| Certificate | N/A | Issued on pass (except 4yr scholarship — scores only) |

### 8.3 New Models

**File:** `prisma/schema.prisma`

```
New Enums:
- ExamRuleSet: EASA, CUSTOM (determines which rules apply)

New Models:
- InternalExamBank (per course/module question collection)
  - courseId        String (links to Course)
  - moduleCode     String? (e.g., "M1", "M3", "M11A")
  - ruleSet        ExamRuleSet @default(EASA)
  - name           String
  - description    String?
  - isActive       Boolean @default(true)

- InternalExamQuestion (reuses same structure as AptitudeQuestion)
  - bankId         String
  - text           String
  - options        Json (array of 3 options for EASA MCQ)
  - correctAnswer  String
  - points         Int @default(1)
  - isEssay        Boolean @default(false)
  - essayTimeMins  Int @default(20) (only used if isEssay)
  - sortOrder      Int?

- InternalExamSession (per-student exam attempt)
  - studentId      String
  - bankId         String
  - classId        String? (which class context)
  - sittingId      String? (links to ExamSitting if during formal exam event)
  - ruleSet        ExamRuleSet
  - status         TestSessionStatus (reuse existing enum)
  - startedAt      DateTime
  - expiresAt      DateTime (calculated: MCQ count × 75s + essay count × 20min)
  - submittedAt    DateTime?
  - autoSubmitted  Boolean @default(false) (true if keyboard press triggered submission)
  - score          Int?
  - totalPoints    Int?
  - percentage     Float?
  - passed         Boolean?
  - tabSwitchCount Int @default(0)
  - fullscreenExits Int @default(0)
  - keyboardEvents Int @default(0)
  - ipAddress      String?
  - userAgent      String?
  - retakeEligibleAt DateTime? (startedAt + 90 days for EASA failures)

- InternalExamAnswer (per-question response)
  - sessionId      String
  - questionId     String
  - selectedAnswer String?
  - essayText      String? (for essay questions)
  - isCorrect      Boolean?
  - pointsAwarded  Int @default(0)
  - answeredAt     DateTime

- InternalExamRuleOverride (admin-configurable rules per bank for non-EASA)
  - bankId         String @unique
  - passMarkPct    Int @default(75)
  - timePerQuestionSecs Int @default(75)
  - retakeWaitDays Int @default(90)
  - allowKeyboardAutoSubmit Boolean @default(true)
  - maxRetakes     Int? (null = unlimited)
  - completionWindowYears Int @default(5)
  - customInstructions String? (shown to student before exam)
```

### 8.4 Instructor — Question Upload & Exam Management

**New pages:**
- `app/staff/exams/internal/page.tsx` — List all internal exam banks grouped by course
- `app/staff/exams/internal/banks/[id]/page.tsx` — Edit bank + questions
- `app/staff/exams/internal/banks/[id]/_components/QuestionEditor.tsx` — CRUD for questions (reuse pattern from aptitude QuestionEditor)
- `app/staff/exams/internal/banks/[id]/results/page.tsx` — All student results for this bank
- `app/staff/exams/internal/rules/page.tsx` — Rule overrides for non-EASA banks

**New APIs:**
- `app/api/staff/exams/internal/banks/route.ts` (GET/POST)
- `app/api/staff/exams/internal/banks/[id]/route.ts` (GET/PUT/DELETE)
- `app/api/staff/exams/internal/banks/[id]/questions/route.ts` (GET/POST)
- `app/api/staff/exams/internal/banks/[id]/questions/[qId]/route.ts` (PUT/DELETE)
- `app/api/staff/exams/internal/banks/[id]/rules/route.ts` (GET/PUT — rule overrides)
- `app/api/staff/exams/internal/sessions/route.ts` (GET — all sessions with filters)
- `app/api/staff/exams/internal/sessions/[id]/route.ts` (GET — detail + answers)

### 8.5 Student — Test Taking UI

**New pages:**
- `app/student/exams/internal/page.tsx` — List available exams (by enrolled courses)
- `app/student/exams/internal/[bankId]/page.tsx` — Pre-exam info + rules + start button
- `app/student/exams/internal/[bankId]/results/page.tsx` — View past results

**New client components** (under `_components/`, shared with aptitude where possible):
- `InternalExamInterface.tsx` — Main test UI. Fullscreen, timed, renders MCQ (3-option) + essay.
  - **Keyboard listener:** `document.addEventListener('keydown')` on the exam container. Any keypress (except mouse clicks on answer options) triggers immediate auto-submit.
  - Timer calculated from question count × time-per-question.
  - Shows "Question X of Y" navigation (EASA allows going back to previous questions within the time limit).
- `ExamRulesModal.tsx` — Displays EASA rules or custom rules before start. Student must acknowledge.
- `ExamResultsView.tsx` — Score breakdown, pass/fail, retake eligibility date.

**New APIs:**
- `app/api/student/exams/internal/progress/route.ts` (GET — enrolled-course exam banks, progress, retake/ban state, and student details for confirmation)
- `app/api/student/exams/internal/start/route.ts` (POST — create session, select questions, calculate time)
- `app/api/student/exams/internal/answer/route.ts` (POST — save answer)
- `app/api/student/exams/internal/submit/route.ts` (POST — finalize, grade, check pass, set retake date)
- `app/api/student/exams/internal/session/route.ts` (GET — current session state for resume)

Note: keyboard-triggered auto-submit is currently handled by `submit/route.ts` with `autoSubmitted: true`, rather than a separate `keyboard-event` route.

### 8.6 Shared Infrastructure with Aptitude Tests

Reuse from Phase 3:
- `AntiCheatProvider.tsx` — Extended with keyboard listener (configurable per exam type)
- `TestTimer.tsx` — Same countdown component, different calculation input
- `QuestionCard.tsx` — Extended to support 3-option MCQ + essay textarea
- `lib/aptitude/grading.ts` → generalize into `lib/exams/grading.ts` (shared grading logic)
- Fullscreen API, visibility change detection, IP/user agent logging

**New shared file:** `lib/exams/time-calculator.ts`
- EASA: `mcqCount * 75 + essayCount * 20 * 60` (seconds)
- Custom: `mcqCount * timePerQuestionSecs + essayCount * essayTimeMins * 60`

### 8.7 Retake Enforcement

- On EASA exam failure: `retakeEligibleAt = submittedAt + 90 days`
- Student cannot start a new session for the same bank until `retakeEligibleAt`
- For non-EASA: `retakeWaitDays` from `InternalExamRuleOverride` (default 90, admin-configurable)
- Optional `maxRetakes` limit for non-EASA exams

### 8.8 Certificate Suppression (Scholarship Students)

- After passing an internal exam, results are always shown to the student.
- Certificate download (PDF) is available for self-funded students (2yr, modular, military, exam-only).
- 4yr scholarship students: certificate download is **suppressed**. They see their score but cannot download/export individual module certificates. This is enforced by checking `Application.fundingType === 'SCHOLARSHIP'` in the certificate download API.

---

## Phase 9: Legacy Data Import + Flexible Fields

### 9.1 Problem
The first and second batches have records scattered across CSVs, Word documents, images, and various online storage. Admin needs to:
1. Import this data into the system with validation
2. Occasionally add new data fields for applicants/students without requiring schema changes

### 9.2 Admin-Defined Custom Fields

**New model:** `CustomFieldDefinition`
```
- id, name (display label), slug (unique key)
- fieldType: TEXT, NUMBER, DATE, SELECT, MULTI_SELECT, FILE, BOOLEAN
- options Json? (for SELECT/MULTI_SELECT — array of allowed values)
- appliesTo: APPLICATION | STUDENT_PROFILE | USER (which entity this field extends)
- isRequired Boolean @default(false)
- applicableProgrammes ProgrammeChoice[] (empty = all)
- sortOrder Int
- isActive Boolean @default(true)
```

**New model:** `CustomFieldValue`
```
- id, fieldDefinitionId, entityId (the Application/StudentProfile/User id), entityType
- value String (stored as string, parsed based on fieldType)
- fileUploadId String? (for FILE type)
- @@unique([fieldDefinitionId, entityId])
```

This is the EAV (Entity-Attribute-Value) pattern — admin can add fields like "Blood Type", "Emergency Contact", "Prior Aviation Experience", "Uniform Size", etc. without schema migrations. The trade-off is querying flexibility (no SQL filtering on custom fields), but these are typically display/report fields, not filter criteria.

**New pages:**
- `app/staff/settings/custom-fields/page.tsx` — Admin CRUD for field definitions
- Custom field rendering component that dynamically generates form inputs based on `fieldType`

**New APIs:**
- `app/api/staff/settings/custom-fields/route.ts` (GET/POST)
- `app/api/staff/settings/custom-fields/[id]/route.ts` (PUT/DELETE)

### 9.3 Bulk Data Import Tool

**New:** `app/staff/admissions/import/page.tsx`

Step-by-step import wizard:
1. **Upload** — Accept CSV files (and optionally Excel via a parser library)
2. **Column Mapping** — Admin maps CSV columns to system fields (first name, last name, email, programme, license categories, custom fields, etc.). Auto-detect common column names.
3. **Validation** — Preview rows with per-row validation:
   - Required fields present (name, email, programme)
   - Email format valid + not already registered
   - Programme choice is a valid enum value
   - Custom fields validated against their `fieldType`
   - Flag warnings (not errors) for optional missing data
4. **Review** — Show valid rows (green), warning rows (yellow), error rows (red). Admin can fix or skip error rows.
5. **Import** — Create User + Profile + Application records for each valid row. For already-enrolled students (historical), also create StudentProfile and set appropriate stage (`ENROLLED`).

**File attachments for imported records:**
- Separate upload step or per-row file attachment for scanned documents (images, PDFs)
- Stored via existing `FileUpload` model with `referenceType: 'IMPORT'`

**New APIs:**
- `app/api/staff/admissions/import/validate/route.ts` (POST — accepts CSV, returns validation results)
- `app/api/staff/admissions/import/execute/route.ts` (POST — creates records from validated data)

### 9.4 Historical Batch Context
- Second batch was smaller, admitted to replace students who left. Most of the second batch also departed; one remains.
- Import tool should support setting `Application.stage` to `ENROLLED`, `WITHDRAWN`, or `REJECTED` for historical records so the system accurately reflects who is still active vs. who left.
- Admin can attach scattered files (images, scanned docs) to imported records via the document upload system.

---

## Phase 10: Polish & Integration

- Pipeline analytics on staff dashboard (funnel chart, conversion rates)
- Applicant dashboard shows pipeline progress prominently
- Notification triggers for all stage transitions
- Audit logging for all admissions actions (reuse `createAuditLog`)
- Seed data: sample question banks, intake cycles for development
- Welcome tour updates: add aptitude test and interview steps to applicant tour

---

## Key Architectural Decisions

1. **Separate Application model** (not extending User) — User is already 83 fields. Clean separation, supports future multi-application scenarios.
2. **EXAM_ONLY bypass** — No Application record created. Existing flow untouched. Zero risk.
3. **Programme-specific pipelines** — Single state machine with per-programme stage skipping, not separate pipelines. One `Application` model serves all programme types; the `programmeChoice` field determines which stages are applicable. Keeps the system unified while allowing radically different journeys.
4. **Medical embedded in Application** — Simple status+documents workflow. No separate model needed. Can extract later if requirements grow.
5. **Question bank tagging by programme** — `AptitudeTestBank.applicableProgrammes` for admin organization. Currently all programmes share the same general aptitude scope (military applicants are training for civilian work, not leveraging military expertise). Tagging future-proofs the system if admin later wants differentiated tests.
6. **Configurable document requirements** — `ApplicationDocumentType` model lets admin define which documents are required per programme/intake (CV, national ID, high school cert, university cert, etc.) without code changes. Replaces hardcoded CV/cover letter fields.
7. **Question options as JSON** — `AptitudeQuestion.options` is `Json?` for MCQ flexibility. Questions themselves are relational for querying/analytics.
8. **Interview slots as records** (not calendar events) — Dedicated model with `bookedCount` and `capacity` for atomic booking. Not the same as `AdminCalendarEvent` which is display-only.
9. **IntakeCycle → Batch → Class chain** — IntakeCycle groups applicants for one admissions round. After enrollment, admitted students form a batch (cohort). Admin splits the batch into Classes using existing infrastructure. IntakeCycle links to AcademicYear for full-time programmes.
10. **Modular completion deadline** — Stored on Application, enforced by cron. Modular students have no academic year/semester structure — they self-pace through courses and exam bookings within admin-set time limits.
11. **Funding type tracking** — `FundingType` enum (SCHOLARSHIP, SELF_FUNDED, SPONSORED) on Application. Affects financial reporting and payment flow logic. First batch was scholarship; future intakes may mix.
12. **No subdomain** — Everything stays within the existing app structure using existing portal routing (`/applicant/...`, `/staff/admissions/...`).

---

## Academy Operational Context (Domain Knowledge)

This section captures how the academy actually operates, to ensure the implementation matches reality.

### Batch → Class Structure
- A batch (cohort) size depends on total classroom capacity. Currently ~50 students (2 classrooms × 25–28 seats each), but will grow as the academy adds more classrooms for cabin crew, non-EASA courses, EASA courses, etc.
- The batch is split across available classrooms (currently 2 classes of ~25 each).
- Both classes study the same courses on the same schedule, but at different times of day:
  - Class 1: morning (8 AM–11 AM)
  - Class 2: afternoon (12 PM–3 PM or 1 PM–3:30 PM)
- The instructor teaches the same material to both classes back-to-back.
- 5–15 minute breaks after every hour of instruction.

### Academic Calendar (Full-Time Programmes)
- 4-year programme split into years, each with 2 semesters.
- Each semester covers ~3–4 course modules (e.g., M1, M2, M3).
- Daily instruction: 3–5 hours per class, every weekday.
- After completing a semester's modules, students write exams. Results are graded instantly by the examiner and communicated to students.

### License Categories & Exam Levels
- Students enroll targeting specific license categories: B1.1, B2, etc.
- B2 is a higher level than B1 — writing the B2 exam for a module automatically covers B1 (the higher exam subsumes the lower).
- A class may contain students enrolled for B1.1 only and students enrolled for B1.1+B2. They study together but write at different exam levels.

### Programme Pathways (How They Differ)
| Aspect | Full-Time 4yr (Scholarship) | Full-Time 2yr | Military (1yr) | Modular | Exam Only |
|--------|---------------------------|---------------|----------------|---------|-----------|
| Batch/Class | Yes (~25/class) | Yes (~25/class) | Yes (accelerated) | No (unless class option) | No |
| Academic Year | Yes | Yes | Yes (compressed) | No | No |
| Funding | Scholarship | Self-funded | Self-funded | Self-funded | Self-funded |
| OJT (Part 145) | Academy provides facility | Student finds own facility | Student finds own facility | N/A | N/A |
| Exam certificates | Not issued individually (scores only) | Issued on pass | Issued on pass | Issued on pass | Issued on pass |
| Post-completion | Academy bonds student → places in engineering facility | Independent | Independent | Independent | Independent |
| Study schedule | Fixed daily hours | Fixed daily hours | Fixed (accelerated) | Self-paced | Already studied |
| Exam booking | Scheduled per semester | Scheduled per semester | Scheduled (compressed) | Self-service, any window | Self-service |
| Completion deadline | Programme duration | Programme duration | 1 year | Admin-set (default 2yr) | Per-booking |
| Admission pipeline | Full | Full | Full | Light (no interview/medical) | None |

**Scholarship bonding model:** 4-year scholarship students do not receive individual course exam certificates — they only see their scores. The academy places them in its engineering facility after completion and bonds them (contractual obligation to work for the academy/partners). This ensures ROI on the scholarship investment. 2-year and other self-funded students receive certificates immediately on passing and are independent after graduation.

### EASA Regulatory Changes (EU 2023/989 — Effective 12 June 2024)

These changes directly affect the academy's course content, exam structure, and training delivery:

**Exam Structure Changes:**
- **Modules 9 & 10:** Essay questions permanently REMOVED. Exams are now purely MCQ.
- **Module 10:** MCQ count increased from 40 to 44 to compensate for essay removal.
- The internal exam system must support per-module question counts (not a fixed number). Admin configures question count per InternalExamBank.

**New Syllabus Content (affects course materials):**
- **Module 6 (Materials):** Composite materials and additive manufacturing (3D printing)
- **Module 7 (Maintenance Practices):** Electrical Wiring Interconnection Systems (EWIS) and Critical Design Configuration Control Limitations (CDCCL)
- **Module 9 & 10:** Safety Management Systems (SMS), occurrence reporting, risk management
- **Module 13 (Aero Structures & Systems):** Modern avionics, fly-by-wire systems

**Distance Learning (now permanent — was COVID temporary):**
- **VCE (Virtually Controlled Environment):** Synchronous instructor-led remote sessions. The academy could offer this for modular students.
- **Asynchronous distance learning:** Permitted with mandatory instructor interaction balance.
- **Synthetic Training Devices:** VR/AR tools allowed in practical training when approved.
- This validates the modular "class option" — admin can create online/remote classes for modular students, not just physical ones.

**OJT (On-the-Job Training) Changes:**
- Moved from rigid checklist to **competence-based assessment** model.
- OJT task list is now adaptable to actual maintenance environment.
- Affects 4-year scholarship students (academy provides Part-145 OJT facility).

**Experience Requirements:**
- B1.1, B1.3, B2: minimum **12 months** in EASA Part-145 approved organisation
- A, B1.2, B1.4, B3: minimum **6 months** in Part-145
- 2-year full-time students must find their own Part-145 facility for this.

**Coming 2025+ (plan for future):**
- **Anti-exam-fraud measures (NPA 2023-10):** Question randomization, stricter proctoring. Our internal exam system already handles this with shuffling and anti-cheat.
- **e-Licence:** Digital Part-66 licence rollout beginning late 2025/2026. May affect certificate generation.
- **Language proficiency standards** for instructors and students (typically English).

**Full Module List (17 modules):**

| # | Module | B1.1 | B1.2 | B2 |
|---|--------|:----:|:----:|:--:|
| 1 | Mathematics | Yes | Yes | Yes |
| 2 | Physics | Yes | Yes | Yes |
| 3 | Electrical Fundamentals | Yes | Yes | Yes |
| 4 | Electronic Fundamentals | Yes | Yes | Yes |
| 5 | Digital Techniques / Electronic Instrument Systems | Yes | Yes | Yes |
| 6 | Materials and Hardware | Yes | Yes | Yes |
| 7 | Maintenance Practices | Yes | Yes | Yes |
| 8 | Basic Aerodynamics | Yes | Yes | Yes |
| 9 | Human Factors | Yes | Yes | Yes |
| 10 | Aviation Legislation | Yes | Yes | Yes |
| 11 | Turbine Aeroplane Aero, Structures & Systems | Yes | - | - |
| 12 | Helicopter Aero, Structures & Systems | - | - | - |
| 13 | Aircraft Aero, Structures & Systems | Yes | Yes | Yes |
| 14 | Propulsion | Yes | Yes | - |
| 15 | Gas Turbine Engine | Yes | - | - |
| 16 | Piston Engine | - | Yes | - |
| 17 | Propeller | Yes | Yes | - |

**License Categories (full list):** A, B1.1, B1.2, B1.3, B1.4, B2, B2L, B3, L, C

**Training paths:**
- Part 147 basic training course: 2,400 hours (~20 months) + 2 years Part-145 experience
- Technical trade school: + 3 years experience
- Part 147 MTO exam path: + 5 years experience (work while studying)

**Impact on the plan:**
1. `InternalExamBank` must store per-module question count (not rely on a global default) since M10 now has 44 MCQs, not the standard 40.
2. Essay question support in internal exams can be deprioritized — EASA is removing them. Keep the model field (`isEssay`) for non-EASA courses only.
3. The anti-cheat and question randomization we're building aligns with EASA's upcoming anti-fraud requirements.
4. Distance learning support (VCE) could be added as a class delivery mode for modular students.
5. OJT tracking could be a future module (competence-based assessment records).

### Exam Pool System (Already Built — No Changes Needed)
- Pool = one classroom (max 28 seats), up to 4 modules per session (examiner limit).
- Booking types: single, twin-pack (2 at discount), four-pack (4 at deeper discount), group charter.
- If a student books multiple exams (e.g., twin-pack), each exam goes into a separate session (student can't write 2 exams simultaneously). Session 1 might be 8–10 AM, Session 2 might be 12–2 PM.
- Pool auto-fills as students book. When pool reaches 28, a new pool opens.
- All programme types (full-time, modular, exam-only) use the same pool system for exam booking.

### Revision Sessions
- **Online revision**: ~1 week before exam window, via Zoom/Teams link sent by admin to concerned students.
- **In-person revision**: On exam day, examiner does a quick review session before each exam module starts. E.g., M1 revision at 7 AM before M1 exam at 8 AM; M2 revision between sessions.
- Admin manages this through existing notification/communication tools.

---

## Critical Files to Modify

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add all new models and enums |
| `app/api/public/register/route.ts` | Create Application for non-EXAM_ONLY |
| `app/api/staff/applicants/[id]/approve/route.ts` | Trigger pipeline stage transitions |
| `app/applicant/application/status/page.tsx` | Full pipeline tracker UI |
| `app/applicant/_components/ApplicantSidebar.tsx` | Stage-aware navigation |
| `app/staff/_components/StaffSidebar.tsx` | Add Admissions section |
| `app/api/uploadthing/core.ts` | New upload route slugs (CV, cover letter, medical, question images) |
| `lib/email/service.ts` | 14 new email templates |
| `components/Tour/AppTour.tsx` | Update applicant tour steps |
| Exam result/certificate display logic | Suppress individual certificate downloads for SCHOLARSHIP-funded students (show scores only) |

## Reusable Existing Infrastructure

| What | Where | Reuse How |
|------|-------|-----------|
| File uploads | `FileUpload` model + UploadThing | CV, cover letter, medical docs |
| Email sending | `lib/email/service.ts` + `sender.ts` | All new email templates |
| Notifications | `Notification` model | Stage transition alerts |
| Audit logging | `lib/audit/logger.ts` | All admissions actions |
| System settings | `SystemSetting` + `lib/settings.ts` | All admin-configurable values |
| API patterns | `lib/api/response.ts` | apiSuccess, apiError, withErrorHandler |
| Auth helpers | `lib/auth/helpers.ts` | getAuthSession, requireStaff |
| Zod validation | `lib/validation/schemas.ts` | New admission schemas |
| Skeleton components | `components/shared/DashboardSkeleton.tsx` | All new loading.tsx files |

---

## Verification

1. **Schema:** `npx prisma migrate dev` passes cleanly
2. **Types:** `npx tsc --noEmit` passes (excluding known pre-existing errors)
3. **Registration:** New applicant (non-EXAM_ONLY) creates Application record with correct programmeChoice; EXAM_ONLY does not
4. **Pipeline tracker:** Applicant status page shows correct stage with programme-appropriate steps (modular shows fewer steps than full-time)
5. **Aptitude test:** Full flow — start → answer → submit → auto-grade → stage transition
6. **Programme-tagged banks:** Banks tagged by programme for admin organization; all programmes currently share the same general aptitude scope
7. **Anti-cheat:** Tab switch and fullscreen exit correctly tracked and flagged
8. **Stage skipping:** Modular applicant skips interview/medical stages and proceeds directly to enrollment
9. **Interview booking:** Race condition test — two concurrent bookings for last slot
10. **Rescheduling:** Correctly enforces max reschedules and cutoff time
11. **Medical:** Upload → Staff review → Clear → Auto-promote to student (full-time/military only)
12. **Emails:** All 14+ new emails send correctly at their trigger points
13. **EXAM_ONLY bypass:** Existing flow completely unaffected
14. **Post-enrollment (full-time):** Student assigned to academic year; staff can create classes and batch-enroll the cohort
15. **Post-enrollment (modular):** Student gets course catalog access; completionDeadline is set; no batch/class
16. **Modular deadline cron:** Warnings fire at 75% and 90% elapsed; admin notified on expiry
17. **Funding type:** Application tracks SCHOLARSHIP/SELF_FUNDED/SPONSORED correctly
18. **Internal EASA exam:** 3-option MCQ, 75s/question timer, 75% pass mark, keyboard press = auto-submit
19. **Internal exam retake:** Failed EASA exam sets retakeEligibleAt = +90 days; student blocked until then
20. **Non-EASA exam:** Admin can override rules (pass mark, time per question, retake wait, keyboard auto-submit)
21. **Certificate suppression:** Scholarship students see scores but cannot download certificates; self-funded students can
22. **Instructor question upload:** Staff can create exam banks per course/module and upload questions
23. **Feature flags OFF:** All flags disabled → system behaves exactly like current flow. No Application created, no pipeline stages, no aptitude/interview/medical.
24. **Feature flags ON (incremental):** Enable admissions_pipeline_enabled → Application records created, pipeline tracker shows. Enable aptitude → test appears. Each flag independently toggleable.
25. **Flag toggle:** Admin can turn flags on/off from settings page; changes take effect immediately for new applicants
26. **State machine skip logic:** When a subsystem flag is off, state machine auto-transitions past those stages
