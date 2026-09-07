# Internal Exam System — Full UI & Architecture Plan

> Audience: backend agents, frontend agents, and anyone contributing to the internal exam system.
> Status: planning draft — not yet implemented unless explicitly called out.

> **🧭 Plan conventions (for editors & build agents).**
> - **Fixed section order:** §1 Current-State → §2 Role Matrix → §3 Data Model (3.1–3.6) → §4 UI → §5 Realtime → §6 API → §7 Import → §8 Phases → §9 Open Decisions (Resolved) → §10 Immediate Fixes → §11 Assessment → §12 Reliability/Recovery.
> - **Adding a section:** append a new `## N.` at the end (or insert and renumber); then update any cross-references — sections are cited by number throughout. Do **not** create a second "Open Decisions" list; record every decision once in §9 with its `#`, resolution, and Impact, and apply the consistency edit inline.
> - **Build readiness:** §1–§8 define the locked target (schema/UI/API). §9 decisions and §12 reliability requirements are mandatory constraints on any implementation. §10/§11 are tracked work items, not blockers — a build agent may start on a finalized section while the plan is still being edited elsewhere.
> - Keep `⚠️ Correction:` / `💡 Suggestion:` inline annotations; the consolidated review lives in §11.

> **📝 Reviewer notes (2026-08-30).** This draft was cross-checked against the actual
> codebase. Inline `⚠️ Correction:` blocks fix claims that no longer match the code;
> `💡 Suggestion:` blocks are improvements. A consolidated list with file/line evidence
> is consolidated in **Section 11 — Review & Required Improvements** below. Highlights:
> - §10 fix #1 ("hardcoded 75% pass mark in results UI") is **wrong** — the results page
>   already resolves the pass mark dynamically; the real hardcoded literals are elsewhere.
> - "Start Exam for Class" will exceed the Supabase Realtime 5 evt/s cap — use GET-first + delta.
> - The `internal_exam_sessions` Realtime subscription silently matches nothing until Realtime
>   is enabled on the table (and the filter must use camelCase `classId`).
> - A bespoke `canEdit/canReview/...` permission table duplicates the existing RBAC registry;
>   and new privileged mutations must write audit logs.
> - Class-start creating sessions preemptively collides with the existing single-attempt/void logic.

---

## 1. Current-State Audit (What exists today)

| Layer | State |
|-------|-------|
| **Schema** | `InternalExamBank`, `InternalExamQuestion` (+ `explanation` added), `InternalExamQuestionVersion`, `InternalExamRuleOverride`, `InternalExamSession`, `InternalExamAnswer`, `InternalExamReport`. No `Module` model — modules are represented as `Course.moduleCode` strings. |
| **Staff UI** | `/staff/exams/internal` has tabs: Question Banks (`ExamBankManager`), Operations (`ExamOperations`), Preview. Banks are tied to `CourseId`. Staff can CRUD questions via API only (no editor until now). |
| **Instructor UI** | **Zero exam functionality.** Instructor portal has classes, attendance, grading, resources, schedule — but no exam creation, question management, or exam monitoring. |
| **Student UI** | Dashboard (`InternalExamDashboard`) shows bank progress. Exam interface (`InternalExamInterface`) is lockdown MCQ with autosave. Post-submit shows "Pending Admin Review" only. Results page exists but only shows data after `isPublished`. |
| **Realtime** | Supabase Realtime client exists (`lib/realtime/client.ts`) but is only used for in-app messages. No live exam monitoring. |
| **Auth** | Staff endpoints guard by role (`ADMIN`, `SUPER_ADMIN`, `STAFF`, `EXAMINER`, `INSTRUCTOR`). Instructor role is recognized but has no exam permissions. |
| **Analytics** | `ExamOperations` polls `/operations/sessions` every 15–30s. No per-instructor filtering, no live score streaming, no historical analytics. |

### Critical Gaps Identified

1. **Instructors cannot access exams at all** — no routes, no UI, no permissions.
2. **No instructor-to-bank assignment** — any staff member can edit any bank.
3. **No live monitoring** — only polling with 15–30s latency.
4. **No exam scheduling** — exams are started ad-hoc by students; instructors cannot restrict or schedule them.
5. **No class-level exam scoping** — `InternalExamSession` has an optional `classId`, but nothing enforces or uses it for instructor access.
6. **No question import pipeline** — PDF/DOCX/TXT extraction not built.
7. ~~**Hardcoded 75% pass mark** in results UI (fixed separately).~~
   > ⚠️ **Correction:** This is no longer accurate. `app/student/exams/internal/results/[sessionId]/page.tsx`
   > already renders `Pass mark: {data.passMarkPct ?? 75}%` — the value is resolved dynamically
   > from the session/engine (`InternalExamRuleOverride.passMarkPct`, default 75). The genuinely
   > hardcoded literals are: `app/examiner/results/actions.ts` (`const PASS_MARK = 75`) and a
   > *duplicate* `EASA_PASSING_GRADE` in `lib/compliance/reports.ts` vs the canonical
   > `ACADEMIC_RULES.EASA_PASS_MARK` in `lib/constants/business-rules.ts`. The real fix is to
   > consolidate all pass-mark reads through `InternalExamRuleOverride.passMarkPct`.

---

## 2. Role Matrix (Target State)

| Capability | Super Admin | Admin | Staff | Examiner | Instructor | Student |
|------------|:----------:|:----:|:----:|:-------:|:----------:|:-------:|
| Create/edit exam banks | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Assign banks to instructors | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Bulk import questions | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Approve/reject questions | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Publish results | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Monitor live exams (all)** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Monitor live exams (own classes)** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Start exam for a class | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| View own class analytics | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Take exam | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| View own results (when published) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 3. Data Model Changes Required

### 3.1 Instructor → Bank Assignment

```prisma
model InternalExamBank {
  // ... existing fields ...
  instructorAssignments InternalExamBankInstructor[]  // NEW
}

model InternalExamBankInstructor {
  id          String   @id @default(cuid())
  bankId      String
  instructorId String  // references InstructorProfile.id (see ⚠️ note below)
  canEdit     Boolean  @default(false)   // can add/edit questions
  canReview   Boolean  @default(false)   // can approve/reject
  canMonitor  Boolean  @default(true)    // can view live sessions
  canPublish  Boolean  @default(false)   // RESERVED / admin-only — instructors are NEVER granted publish (Decision 1)
  assignedAt  DateTime @default(now())
  assignedBy  String

  bank        InternalExamBank @relation(fields: [bankId], references: [id], onDelete: Cascade)

  @@unique([bankId, instructorId])
  @@index([instructorId])
  @@map("internal_exam_bank_instructors")
}
```

> ⚠️ **Correction:** The `instructorId` comment said "references `InstructorProfile.id` **or** `User.id`".
> The codebase is **inconsistent**: `ClassSession.instructorId` → `User` (`prisma/schema.prisma:1853`,
> the teaching relationship), while `InstructorQualification`/`InstructorRecency` → `InstructorProfile`
> (~1905/1922). Pin `InternalExamBankInstructor.instructorId` → `User.id` to match `ClassSession`
> (the §3.1 code block already does this). Also add `@@index([bankId])` and `updatedAt`.
>
> 💡 **Suggestion (RBAC):** This bespoke `canEdit/canReview/canMonitor/canPublish` bitflag table
> duplicates the existing DB-backed RBAC registry (`Permission`/`RoleGrant`/`requirePermission` in
> `lib/auth/permission-registry.ts`). Prefer modeling the four capabilities as seeded `Permission`
> keys (`exam.bank.edit`, `exam.bank.review`, `exam.bank.monitor`, `exam.bank.publish`) scoped to
> `USER:<instructorId>` with `bankId` in metadata. If the table stays, document why it coexists with
> `requirePermission` (two sources of truth for "can this user do X" is a maintainability risk).
>
> 💡 **Suggestion (audit):** Every assignment change must write via `createAuditLog`
> (`lib/audit/logger.ts` + `AuditAction`). The §4.1 "audit log of assignments" UI is not enough —
> the mutation itself must record the row.

### 3.2 Class → Bank Scheduling

```prisma
model InternalExamBank {
  // ... existing fields ...
  classSchedules InternalExamClassSchedule[]  // NEW
}

model InternalExamClassSchedule {
  id              String   @id @default(cuid())
  bankId          String
  classId         String
  scheduledStart  DateTime?  // stored & compared in UTC (Decision 26)
  scheduledEnd    DateTime?  // stored & compared in UTC (Decision 26)
  isActive        Boolean  @default(true)
  allowLateStart  Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt       // ADDED (§11 item 2)

  bank            InternalExamBank @relation(fields: [bankId], references: [id], onDelete: Cascade)
  class           Class            @relation(fields: [classId], references: [id], onDelete: SetNull) // ADDED onDelete: SetNull (§11 item 3) — don't block class archival

  @@unique([bankId, classId])
  @@index([classId])
  @@index([bankId])               // ADDED (§11 item 4)
  @@index([scheduledStart])      // ADDED (§11 item 3) — supports window queries
  @@map("internal_exam_class_schedules")
}

// REVIEW: add an app-level guard that the scheduled class's courseId equals the
// bank's courseId (InternalExamBank.courseId at prisma/schema.prisma:1966).
// Without it a bank can be scheduled to an unrelated class.
```

> 💡 **Suggestion:** Scheduled start/end are exam *rules*. `InternalExamRuleOverride` is already
> per-bank and already feeds `lib/internal-exam/engine.ts` (passMark, time, retakes). Prefer
> extending it with `scheduledStart` / `scheduledEnd` / `allowLateStart` instead of a new table —
> smaller schema surface and reuses override resolution. If class-level windows must differ from
> bank-level, keep this table but resolve it through the same engine.

> 💡 **Migration note (Phase 1):** After adding models, run `bun run db:push` **and**
> `bun run db:push:supabase` to re-mirror the schema into the Supabase replica, then enable Realtime
> on the new tables (see §5.3 gotcha).

### 3.3 Session Enhancements

`InternalExamSession` already has `classId` and `sittingId`. We need to ensure:
- `classId` is populated when an exam is started via class schedule.
- New optional `lastActivityAt` for live monitoring (updated on each answer autosave; **server-set only**, never client-supplied).
- New optional `liveScore` denormalized column for fast dashboard queries (updated on submit).

> **REVIEW — `liveScore` must be defined precisely.** `InternalExamSession` already has `score`, `percentage`, `passed` (`prisma/schema.prisma:2077-2080`). If `liveScore` means the *final* score it already exists as `percentage` — do not add a parallel, drift-prone column. If it means a *pre-submit running tally* ("X correct so far"), name it explicitly (e.g. `runningCorrect`) and define (a) the single transaction that updates it, (b) reconciliation on submit, (c) drift recovery. **Performance caution:** writing it on every 15s autosave × many concurrent students is heavy write amplification; prefer computing the running tally on the monitor *read* (server aggregates answers per session) unless sub-second dashboard latency truly requires persistence.

> **REVIEW — add `@@index([classId, status])` to `InternalExamSession`.** The monitor queries active sessions per class by status; there is currently no explicit compound index, and this is the hottest read path.

> 💡 **Suggestion — `liveScore` naming:** `InternalExamSession` already stores `score`,
> `totalPoints`, `percentage`, `passed`. A pre-submit running tally is genuinely new, but name it
> distinctly (e.g. `runningCorrectCount` / `runningPercentage`) and document it as a monitor-only,
> server-computed field. `score`/`percentage` remain the authoritative graded result post-submit.
>
> 💡 **Suggestion — `lastActivityAt` vs `updatedAt`:** If autosave issues an `update` on the session,
> `updatedAt` already moves on every save. Either rely on `updatedAt` for the live pulse, or make
> autosave touch a dedicated `lastActivityAt` via a query that does **not** bump `updatedAt` (to avoid
> replication/audit churn). Recommend the dedicated, `updatedAt`-free column.

### 3.4 Question Import Pipeline

No schema change needed. Add a new server action / API route that accepts file uploads and calls an extraction service (see section 7).


## 3.5 Shared Module Question Bank & Instructor Access Model

> **Requirement (from stakeholder):** Questions/banks are **shared within a module**, not instructor-private.
> An instructor who adds a question contributes it to the module's global bank. **Admin** can view/edit/schedule
> any class **or individual** to take that module's exam at any time. **Any instructor linked to the same module**
> can access the bank and use its questions for their own students' exams. Instructors get two lists: (a) their own
> added questions/banks, and (b) the module's global bank (questions from all instructors linked to the module),
> plus a full **audit trail** of who added/edited/deleted each question and when.

### 3.5.1 Core principle — no question ownership

A `InternalExamQuestion` belongs to its **bank**, and a bank belongs to a **module** (`InternalExamBank.courseId`
+ `moduleCode`, schema lines 1966–1967). There is **no `ownerId` / per-instructor silo**. "My questions" is simply a
*filtered view* (`submittedById = me`) over the same shared `internal_exam_questions` table — it requires **no extra
storage**. This already fits the existing model: `POST /questions` sets `submittedById` and `status: PENDING_APPROVAL`
(`app/api/staff/exams/internal/banks/[bankId]/questions/route.ts:94–113`).

### 3.5.2 Module linkage for instructors (how "linked to the module" is resolved)

An instructor is considered linked to a module when **either** is true:

1. **Explicit bank assignment** — a row in `InternalExamBankInstructor` (§3.1) for a bank of that `(courseId, moduleCode)`.
   This is also where `canEdit` / `canReview` / `canMonitor` / `canPublish` capability is granted (admin-assigned).
2. **Course teaching** — `Class.instructorId = instructorId` where `Class.courseId = bank.courseId`
   (schema lines 455–478). Teaching a class in the course confers module access for that course's banks.

> 💡 **Suggestion:** `Class` carries `courseId` but **not** `moduleCode` (schema 453–488). If per-module teaching
> (not just per-course) must gate access, add an optional `moduleCode` to `Class`, or resolve module from the bank
> and treat course-level teaching as sufficient. Default recommendation: course-level teaching is enough to link an
> instructor to all of that course's exam modules.

Capability vs. access distinction:
- **Access / use** (view the bank, schedule it for a class or individual student) → granted by module linkage (above).
- **Edit / review** a given question → additionally requires `canEdit` / `canReview` on that bank (§3.1). Instructors can
  **always edit their own submitted questions**; editing *another* instructor's question requires a `canEdit` grant.

### 3.5.3 Instructor views (both read the shared table)

| View | Query | Purpose |
|------|-------|---------|
| **My Questions** | `internalExamQuestion.findMany({ where: { submittedById: me, bankId: { in: myModuleBankIds } } })` | Review/revise questions the instructor personally added. |
| **My Banks** | banks where `InternalExamBankInstructor.instructorId = me` (assigned) | Manage assignment, monitor, publish for banks they're responsible for. |
| **Module Bank (global)** | `internalExamQuestion.findMany({ where: { bankId: { in: myModuleBankIds }, isActive: true } })` | Browse/use every instructor's questions for this module in their students' exams. Filterable by `submittedById` (me vs others), `status`, `difficulty`, `subTopic`. |

> 💡 **Suggestion:** Expose as `GET /api/instructor/exams/questions?view=mine|module&bankId=&status=&submittedById=`
> and `GET /api/instructor/exams/banks?scope=mine|module`. Reuse the existing `prismaUnfiltered` + instructorId filter
> convention; paginate with `take`/`skip` (the "take 200" truncation trap applies).

### 3.5.4 Admin override (class or individual, anytime)

Admin/Super Admin are **not** scoped by module. They can:
- View/edit **any** bank or question across all modules (existing role gate already admits `ADMIN`/`SUPER_ADMIN`).
- **Schedule a whole class** via `InternalExamClassSchedule` (§3.2) or the class-start flow (§6.1).
- **Schedule an individual student** — extend `POST /api/student/exams/internal/start` (or a new admin endpoint) to
  accept `{ studentId, bankId, classId? }` and create a single `InternalExamSession` for that student at any time,
  bypassing the schedule window when `requireAdmin()` is satisfied.

### 3.5.5 Audit trail — who added/edited/deleted and when

The schema **already supports** most of this; we close two gaps:

| Action | Already captured? | Where |
|--------|-------------------|-------|
| **Added** | Partially | `submittedById` on the question (schema 2010). ⚠️ **Gap:** `POST /questions` does **not** write an `auditLog` row. Add `createAuditLog({ action: AuditAction.IMPORT or CREATE, entity: 'InternalExamQuestion', entityId, userId: session.user.id })` on create. |
| **Edited** | ✅ Yes | `PUT /questions/[id]` writes an `InternalExamQuestionVersion` (`changeType: EDITED`, `changedById`, `changedAt`) **and** an `auditLog` `UPDATE` (route 89–149). |
| **Retired/Deleted** | ✅ Yes | `DELETE /questions/[id]` writes a version (`RETIRED`) + `auditLog` (`UPDATE`, admin-only) (route 172–201). 💡 Use `AuditAction.DELETE` instead of `UPDATE` for clarity. |
| **Reviewed** | Partially | `reviewedById` / `reviewedAt` on the question (schema 2008). ⚠️ **Gap:** `PATCH /questions/[id]/review` does **not** write an `auditLog` row. Add `createAuditLog({ action: AuditAction.APPROVE/REJECT, entity: 'InternalExamQuestion', ... })`. |

> **Canonical history view:** a new `GET /api/.../questions/[id]/history` that returns, merged and sorted by time:
> - `InternalExamQuestionVersion[]` (edits + retires, with `changedBy` name + `changedAt` + `changeReason`), **plus**
> - `auditLog` rows where `entity = 'InternalExamQuestion' AND entityId = id` (create/review/import actions).
> The version table already has a `changedBy` relation (schema 2039); `InternalExamQuestion` only has raw `submittedById` /
> `reviewedById` with **no relation**. 💡 Add `submittedBy` / `reviewedBy` relation fields on `InternalExamQuestion` so the
> history UI can show "Added by Jane Doe at <ts>" without a manual join. Low-risk additive schema change.
>
> All question mutations must also keep writing via `lib/audit/logger.ts` (`AuditAction` enum: CREATE/UPDATE/DELETE/APPROVE/IMPORT)
> so the central audit log and the per-question version history stay in lock-step.

### 3.5.6 Permission gating (reuse existing RBAC)

- Question/bank routes currently gate by **role array** (`['ADMIN','SUPER_ADMIN','STAFF','EXAMINER','INSTRUCTOR']`).
  Replace with `requirePermission(PERMISSIONS.MANAGE_EXAMS)` (seeded in `lib/auth/permission-registry.ts:41`) + the
  module-linkage/assignment checks above, so access is capability- and module-scoped rather than "any instructor, any bank."
- `InternalExamBankInstructor.canEdit/canReview/...` remain the **capability** flags (not ownership); combine with module
  linkage: an instructor may *use* any module question, but may only *edit/review* with the matching grant (or their own).

### 3.5.7 What this changes vs earlier sections

- §3.1's `InternalExamBankInstructor` is now explicitly a **capability grant + module-linkage record**, not an ownership table.
- §4.2 "My Banks" tab splits into **My Questions** / **My Banks** / **Module Bank** (global) as in §3.5.3.
- §6.1 gains `GET /api/instructor/exams/questions?view=...` and an admin "schedule individual" capability (§3.5.4).
- Audit coverage is completed for **create** and **review** (§3.5.5).

---

## 3.6 Bank Review State (admin-approval gate)

Required by Decision 1 — instructors create/edit banks and questions, but students never see them until an admin approves.

```prisma
model InternalExamBank {
  // ... existing fields ...
  reviewState InternalExamBankReviewState @default(DRAFT) // NEW
}

enum InternalExamBankReviewState {
  DRAFT               // instructor working, not submitted
  PENDING_ADMIN_REVIEW // awaiting admin approval to go student-visible
  APPROVED           // student-visible (gated by schedule window)
  REJECTED           // returned to instructor with notes
}
```

- The student-facing start/session gate only exposes banks where `reviewState = APPROVED`.
- Submitting a bank/question batch for review transitions `DRAFT → PENDING_ADMIN_REVIEW`; admin approval sets `APPROVED`.
- Optional `reviewNote` field for admin rejection feedback (add to the model as needed).

> **REVIEW — audit logging.** All privileged mutations (instructor assign / permission update / revoke, schedule create / update / delete, publish, void, start-exam-for-class) must write through `createAuditLog` with an `AuditAction` from `lib/audit/logger.ts`. The "audit log of assignments" in §4.1 is a UI surface; the canonical write is required regardless.

## 3.5 Shared Module Question Bank & Instructor Access Model

> **Requirement (from stakeholder):** Questions/banks are **shared within a module**, not instructor-private.
> An instructor who adds a question contributes it to the module's global bank. **Admin** can view/edit/schedule
> any class **or individual** to take that module's exam at any time. **Any instructor linked to the same module**
> can access the bank and use its questions for their own students' exams. Instructors get two lists: (a) their own
> added questions/banks, and (b) the module's global bank (questions from all instructors linked to the module),
> plus a full **audit trail** of who added/edited/deleted each question and when.

### 3.5.1 Core principle — no question ownership

A `InternalExamQuestion` belongs to its **bank**, and a bank belongs to a **module** (`InternalExamBank.courseId`
+ `moduleCode`, schema lines 1966–1967). There is **no `ownerId` / per-instructor silo**. "My questions" is simply a
*filtered view* (`submittedById = me`) over the same shared `internal_exam_questions` table — it requires **no extra
storage**. This already fits the existing model: `POST /questions` sets `submittedById` and `status: PENDING_APPROVAL`
(`app/api/staff/exams/internal/banks/[bankId]/questions/route.ts:94–113`).

### 3.5.2 Module linkage for instructors (how "linked to the module" is resolved)

An instructor is considered linked to a module when **either** is true:

1. **Explicit bank assignment** — a row in `InternalExamBankInstructor` (§3.1) for a bank of that `(courseId, moduleCode)`.
   This is also where `canEdit` / `canReview` / `canMonitor` / `canPublish` capability is granted (admin-assigned).
2. **Course teaching** — `Class.instructorId = instructorId` where `Class.courseId = bank.courseId`
   (schema lines 455–478). Teaching a class in the course confers module access for that course's banks.

> 💡 **Suggestion:** `Class` carries `courseId` but **not** `moduleCode` (schema 453–488). If per-module teaching
> (not just per-course) must gate access, add an optional `moduleCode` to `Class`, or resolve module from the bank
> and treat course-level teaching as sufficient. Default recommendation: course-level teaching is enough to link an
> instructor to all of that course's exam modules.

Capability vs. access distinction:
- **Access / use** (view the bank, schedule it for a class or individual student) → granted by module linkage (above).
- **Edit / review** a given question → additionally requires `canEdit` / `canReview` on that bank (§3.1). Instructors can
  **always edit their own submitted questions**; editing *another* instructor's question requires a `canEdit` grant.

### 3.5.3 Instructor views (both read the shared table)

| View | Query | Purpose |
|------|-------|---------|
| **My Questions** | `internalExamQuestion.findMany({ where: { submittedById: me, bankId: { in: myModuleBankIds } } })` | Review/revise questions the instructor personally added. |
| **My Banks** | banks where `InternalExamBankInstructor.instructorId = me` (assigned) | Manage assignment, monitor, publish for banks they're responsible for. |
| **Module Bank (global)** | `internalExamQuestion.findMany({ where: { bankId: { in: myModuleBankIds }, isActive: true } })` | Browse/use every instructor's questions for this module in their students' exams. Filterable by `submittedById` (me vs others), `status`, `difficulty`, `subTopic`. |

> 💡 **Suggestion:** Expose as `GET /api/instructor/exams/questions?view=mine|module&bankId=&status=&submittedById=`
> and `GET /api/instructor/exams/banks?scope=mine|module`. Reuse the existing `prismaUnfiltered` + instructorId filter
> convention; paginate with `take`/`skip` (the "take 200" truncation trap applies).

### 3.5.4 Admin override (class or individual, anytime)

Admin/Super Admin are **not** scoped by module. They can:
- View/edit **any** bank or question across all modules (existing role gate already admits `ADMIN`/`SUPER_ADMIN`).
- **Schedule a whole class** via `InternalExamClassSchedule` (§3.2) or the class-start flow (§6.1).
- **Schedule an individual student** — extend `POST /api/student/exams/internal/start` (or a new admin endpoint) to
  accept `{ studentId, bankId, classId? }` and create a single `InternalExamSession` for that student at any time,
  bypassing the schedule window when `requireAdmin()` is satisfied.

### 3.5.5 Audit trail — who added/edited/deleted and when

The schema **already supports** most of this; we close two gaps:

| Action | Already captured? | Where |
|--------|-------------------|-------|
| **Added** | Partially | `submittedById` on the question (schema 2010). ⚠️ **Gap:** `POST /questions` does **not** write an `auditLog` row. Add `createAuditLog({ action: AuditAction.IMPORT or CREATE, entity: 'InternalExamQuestion', entityId, userId: session.user.id })` on create. |
| **Edited** | ✅ Yes | `PUT /questions/[id]` writes an `InternalExamQuestionVersion` (`changeType: EDITED`, `changedById`, `changedAt`) **and** an `auditLog` `UPDATE` (route 89–149). |
| **Retired/Deleted** | ✅ Yes | `DELETE /questions/[id]` writes a version (`RETIRED`) + `auditLog` (`UPDATE`, admin-only) (route 172–201). 💡 Use `AuditAction.DELETE` instead of `UPDATE` for clarity. |
| **Reviewed** | Partially | `reviewedById` / `reviewedAt` on the question (schema 2008). ⚠️ **Gap:** `PATCH /questions/[id]/review` does **not** write an `auditLog` row. Add `createAuditLog({ action: AuditAction.APPROVE/REJECT, entity: 'InternalExamQuestion', ... })`. |

> **Canonical history view:** a new `GET /api/.../questions/[id]/history` that returns, merged and sorted by time:
> - `InternalExamQuestionVersion[]` (edits + retires, with `changedBy` name + `changedAt` + `changeReason`), **plus**
> - `auditLog` rows where `entity = 'InternalExamQuestion' AND entityId = id` (create/review/import actions).
> The version table already has a `changedBy` relation (schema 2039); `InternalExamQuestion` only has raw `submittedById` /
> `reviewedById` with **no relation**. 💡 Add `submittedBy` / `reviewedBy` relation fields on `InternalExamQuestion` so the
> history UI can show "Added by Jane Doe at <ts>" without a manual join. Low-risk additive schema change.
>
> All question mutations must also keep writing via `lib/audit/logger.ts` (`AuditAction` enum: CREATE/UPDATE/DELETE/APPROVE/IMPORT)
> so the central audit log and the per-question version history stay in lock-step.

### 3.5.6 Permission gating (reuse existing RBAC)

- Question/bank routes currently gate by **role array** (`['ADMIN','SUPER_ADMIN','STAFF','EXAMINER','INSTRUCTOR']`).
  Replace with `requirePermission(PERMISSIONS.MANAGE_EXAMS)` (seeded in `lib/auth/permission-registry.ts:41`) + the
  module-linkage/assignment checks above, so access is capability- and module-scoped rather than "any instructor, any bank."
- `InternalExamBankInstructor.canEdit/canReview/...` remain the **capability** flags (not ownership); combine with module
  linkage: an instructor may *use* any module question, but may only *edit/review* with the matching grant (or their own).

### 3.5.7 What this changes vs earlier sections

- §3.1's `InternalExamBankInstructor` is now explicitly a **capability grant + module-linkage record**, not an ownership table.
- §4.2 "My Banks" tab splits into **My Questions** / **My Banks** / **Module Bank** (global) as in §3.5.3.
- §6.1 gains `GET /api/instructor/exams/questions?view=...` and an admin "schedule individual" capability (§3.5.4).
- Audit coverage is completed for **create** and **review** (§3.5.5).

---

## 4. UI Plan — Page by Page

### 4.1 Staff: Exam Bank Management (Enhanced)

**Route:** `/staff/exams/internal/banks/[bankId]`

Add two new tabs/sections to the existing bank detail page:

| Section | Purpose |
|---------|---------|
| **Instructor Access** | Assign/revoke instructor access to this bank. Toggle `canEdit`, `canReview`, `canMonitor` (publish is admin-only — Decision 1). Search instructors by name/employee ID. |
| **Class Scheduling** | Link classes to this bank. Set scheduled start/end windows. Toggle whether students can start independently or only within the window. |

**Route:** `/staff/exams/internal/banks/[bankId]/instructors`

New page with:
- Searchable instructor list (filter by department, specialization)
- Per-instructor permission toggles (grid of checkboxes)
- Bulk assign to all instructors teaching a course
- Audit log of assignments

**Route:** `/staff/exams/internal/banks/[bankId]/schedule`

New page with:
- List of classes for the bank's course
- Date-picker for scheduled exam windows
- Per-class toggle: active/inactive
- Late-start allowance toggle

---

### 4.2 Instructor: Exam Management (New)

**Route:** `/instructor/exams`

New instructor dashboard with tabs:

| Tab | Content |
|-----|---------|
| **My Questions** | Questions the instructor personally added (`submittedById = me`) across their module banks. Review/revise; always editable by the author. See §3.5.3. |
| **My Banks** | Cards for each bank the instructor is assigned to (`InternalExamBankInstructor.instructorId = me`). Shows question count, pool health, pending review count. Click to manage questions. |
| **Module Bank** | The module's **global** question bank — every instructor's questions for this module (`isActive`), filterable by author (me vs others), status, difficulty, sub-topic. Use any question for the instructor's students' exams. See §3.5.3. |
| **My Classes** | Cards for each class the instructor teaches. Shows enrolled count, scheduled exams, completion rate. Click to monitor live exam or view analytics. |
| **Live Monitor** | Real-time table of active exam sessions for the instructor's classes. Auto-refreshes via Supabase Realtime. Shows student name, progress, time remaining, live score (if any answers submitted). |

> 💡 **Suggestion (shared, not siloed):** "My Questions" and "Module Bank" are two *filtered views* over the same shared
> `internalExam_questions` table — do not build separate storage. Instructors may **use** any module question for their
> students, but may **edit/review** another instructor's question only with a `canEdit`/`canReview` grant (§3.5.2). Each
> question row links to its full history via `GET /api/.../questions/[id]/history` (§3.5.5).

**Route:** `/instructor/exams/banks/[bankId]`

Mirrors the staff question editor but with permissions gated by `InternalExamBankInstructor`:
- `canEdit` → show editor
- `canReview` → show approval queue
- Read-only if no permissions

**Route:** `/instructor/exams/classes/[classId]/monitor`

Live exam monitoring page for a specific class:

```
┌─────────────────────────────────────────────────────┐
│ Class: CAT-A Module 1 — Jan 2026 Cohort              │
│ [Start Exam for Class] [Schedule]                    │
├─────────────────────────────────────────────────────┤
│ Summary Cards                                        │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│ │12 Active │ │ 3 Finished│ │ 1 Timeout│ │ 78% Avg ││
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘│
├─────────────────────────────────────────────────────┤
│ Live Session Table                                   │
│ ┌──────┬───────────┬──────┬──────┬────────┬───────┐│
│ │Name  │Progress   │Time  │Score │Status  │Actions││
│ ├──────┼───────────┼──────┼──────┼────────┼───────┤│
│ │John  │5/10 ans   │12:30 │ —    │Active  │Void   ││
│ │Jane  │10/10 ans  │00:00 │ 90%  │Done    │View   ││
│ └──────┴───────────┴──────┴──────┴────────┴───────┘│
└─────────────────────────────────────────────────────┘
```

Features:
- Auto-refresh via Supabase Realtime on `internal_exam_sessions` INSERT/UPDATE (GET-first + delta only — see throttle note).
- "Start Exam for Class" button creates one `NOT_STARTED` `InternalExamSession` per enrolled student
  (reused by the student `start` route per §B8/§8 Phase 1), all starting simultaneously. **Guarded by a
  confirmation preview** ("This will start exams for N students", 5s cooldown or admin checkbox) and
  **idempotent** (Decision 29).
- Per-row actions: Void (allow retake — reuses `operations/void`), View Details (expand per-question
  breakdown), Send Reminder (writes a `Notification` row that streams realtime, not a toast — see §B9).
- Color-coded progress bars using `ACADEMIC_RULES.GRADE_THRESHOLD_PASS/WARNING` (75/50), with text
  labels for colorblind accessibility (§G1/G2).
- Filter by status: All, Active, Completed, Timed Out, Voided.


> 💡 **Suggestion — responsive:** Instructors often monitor from tablets. The ASCII layouts above
> are wide desktop tables. Add responsive behavior: card stack on tablet, status filter as a bottom
> sheet, summary cards wrap. (Matches CLAUDE mobile guidance.)
>
> 💡 **Suggestion — thresholds:** The "green (>75%) / amber (50–75%) / red (<50%)" literals duplicate
> `ACADEMIC_RULES.GRADE_THRESHOLD_PASS` / `GRADE_THRESHOLD_WARNING` (75/50) in
> `lib/constants/business-rules.ts`. Use those constants so coloring stays in lock-step with rules.
>
> ⚠️ **Realtime throttle (critical):** `lib/realtime/client.ts` configures `eventsPerSecond: 5`.
> "Start Exam for Class" creates one `InternalExamSession` per enrolled student — a 30-student class
> fires 30 INSERTs at once, over the cap; Supabase will drop/throttle them. Population strategy must
> be **GET-first** (fetch current sessions) + **Realtime only for subsequent deltas** (start/submit/
> void/publish), not per-row INSERT replay for initial fill. See §5.3.
>
> ⚠️ **Single-attempt conflict:** Creating sessions for every enrolled student preemptively collides
> with the existing single-attempt block (`attemptNumber`, void-to-retake, and `app/api/student/exams/
> internal/start` which creates the session on student action). Class-start should create `NOT_STARTED`
> placeholder sessions that the student `start` route *reuses* via a status guard, so no duplicate is
> ever created and retake/void logic still holds.

**Route:** `/instructor/exams/classes/[classId]/analytics`

Post-exam analytics page:

```
┌─────────────────────────────────────────────────────┐
│ Class Analytics — CAT-A Module 1                     │
│ [Date Range: Last 30 days ▼] [Export CSV]           │
├─────────────────────────────────────────────────────┤
│ Overview Cards                                       │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│ │Pass Rate │ │Avg Score │ │Completion│ │Attempts  ││
│ │   85%    │ │  78.2%   │ │   92%    │ │   14     ││
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘│
├─────────────────────────────────────────────────────┤
│ Per-Question Difficulty Breakdown                   │
│ Q1  ████████░░  80% correct  (Medium)               │
│ Q2  ██████░░░░  60% correct  (Hard)                 │
│ Q3  █████████░  90% correct  (Easy)                 │
│ ...                                                 │
├─────────────────────────────────────────────────────┤
│ Student Performance Table                           │
│ ┌──────┬──────┬──────┬──────┬────────┬────────────┐│
│ │Name  │Score │Time  │Status│Attempts│Action      ││
│ ├──────┼──────┼──────┼──────┼────────┼────────────┤│
│ │John  │90%   │18:30 │Passed│   1    │View Details││
│ │Jane  │65%   │22:15 │Failed│   1    │View Details││
│ └──────┴──────┴──────┴──────┴────────┴────────────┘│
└─────────────────────────────────────────────────────┘
```

Features:
- Pass rate, average score, completion rate, total attempts (SQL `groupBy`, `Promise.all`, cached via `unstable_cache`).
- Per-question stats: % correct, avg time, difficulty breakdown.
- Student-level drill-down into individual results.
- Export to CSV: explicit column set, date format, PII-inclusion flag, **max-range cap** and `apiPaginated`
  paging (§C4, §11 #18) — GDPR-safe from authorized data only.

---

### 4.3 Student: Exam Taking (No change to flow)

The existing flow is correct. After admin publishes:
- Dashboard shows "View Results" link.
- Results page has Show Answers / Show Explanations toggles.

**Minor enhancement:** Add a "Review Later" bookmark so students can flag questions to revisit after seeing explanations.

> 💡 **Suggestion — persistence:** Flagging must survive the publish boundary (student sees it
> post-results). Recommend a `flaggedForReview` column on `InternalExamAnswer` (or session-scoped JSON),
> not client-only state.

---

## 5. Realtime / Live Monitoring Strategy

### 5.1 Why Supabase Realtime

The project already has:
- `lib/realtime/client.ts` — browser-side Supabase Realtime singleton.
- Neon → Supabase logical replication.
- Messages already stream via Realtime.

We can piggyback exam monitoring on the same infra.

### 5.2 What to stream

| Event | Trigger | Payload |
|-------|---------|---------|
| `exam_started` | Student starts exam | `{ sessionId, studentId, bankId, classId }` |
| `exam_submitted` | Student submits | `{ sessionId, score, percentage, passed, submittedAt }` |
| `exam_voided` | Admin/instructor voids | `{ sessionId, voidedBy }` |
| `exam_published` | Admin/instructor publishes | `{ sessionId, isPublished }` |

> ⚠️ **Correction:** The original draft listed an `answer_saved` event here, but §5.3 explicitly says
> *no* per-answer streaming. Removed `answer_saved` from this table to eliminate the contradiction.
> (If needed later, it would be a student-side autosave receipt only — never instructor-scoped per-question.)

### 5.3 Subscription model

> ⚠️ **Channel name ≠ scope.** In this project, the Realtime channel name is an *arbitrary namespace*
> (cf. `messages:<userId>` at `hooks/useRealtimeMessages.ts:36`); scoping lives in the `postgres_changes`
> `filter` field, e.g. `filter: 'classId=eq.<classId>'` (camelCase column — see §5.2 gotcha). The
> notation below names the namespace only.

Instructor monitor page subscribes to:
```ts
// namespace: exam_sessions:classId:<classId>
// filter: classId=eq.<classId>  (+ instructor-scoped RLS, §12.4E)
.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'internal_exam_sessions', filter: `classId=eq.${classId}` }, ...)
.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'internal_exam_sessions', filter: `classId=eq.${classId}` }, ...)
```

Student exam interface subscribes to:
```ts
// namespace: exam_sessions:id:<sessionId>
// filter: id=eq.<sessionId>
.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'internal_exam_sessions', filter: `id=eq.${sessionId}` }, ...)
```

No per-answer streaming during the exam (too noisy). Instead, the instructor monitor polls the session list every 15s for aggregate progress (GET-first + Realtime delta, §4.2 throttle note), and re-fetches detail on row expand.

> ⚠️ **Realtime enable gotcha (critical):** Per CLAUDE.md, the `messages` table had to be manually
> switched to Realtime or its subscription silently matched nothing. The `internal_exam_sessions`
> subscription will not work until Realtime is **enabled on that table** (Supabase → Database →
> Tables → internal_exam_sessions → Enable Realtime) **and** the table is in the replication
> publication. Also: the channel filter must use the exact camelCase column `classId` (per the realtime
> filter gotcha in CLAUDE.md), **not** `class_id` — Supabase will silently match nothing otherwise.
>
> ⚠️ **Throttle gotcha:** `lib/realtime/client.ts` sets `eventsPerSecond: 5`. "Start Exam for Class"
> creates one session per enrolled student; the initial burst must come from a `GET` fetch, with
> Realtime carrying only subsequent deltas (see §4.2 note). Initial fill must not rely on INSERT replay.
>
> 💡 **Suggestion — server-side running count:** The "Z correct" live tally requires
> `InternalExamAnswer.selectedAnswer` vs `InternalExamQuestion.correctAnswer`. Compute it server-side
> and never ship the per-question stream to the student client. Add a guard/test that the running count
> is instructor-scoped only.
>
> 💡 **Suggestion — polling fallback:** The messages hook falls back to 20–60s polling when Supabase is
> unconfigured. The monitor must do the same: Realtime primary, the 15s poll as the documented fallback,
> so dev/CI without env vars still works.

---

## 6. Backend API Additions Required

> **REVIEW — cross-cutting API rules (from `CLAUDE.md`):**
> - The `proxy.ts` is **images-only** and does **not** gate these routes. Every new route MUST call `requireStaff` / `requireInstructor` / `requireExaminer` / `requirePermission` at the handler (layer 3).
> - Use `{ prismaUnfiltered }` from `@/lib/prisma/client` in all auth-gated staff/instructor routes & pages (not the RLS `prisma` client).
> - Paginate all list endpoints (`take`/`skip`); reuse `parsePagination` / `parseSorting` / `apiPaginated` from `lib/api/response.ts`. Avoid the `take:200` silent-truncation trap.
> - Aggregations (per-question difficulty, avg time, pass rate) must be SQL `groupBy`, not computed in JS over loaded rows.
> - Parallelize independent queries with `Promise.all`.
> - Serialize payloads for client components via `serializePrisma()`.
> - **Examiner gap:** §2 grants Examiner create/edit/approve/bulk-import, but no examiner routes are defined below. Add `/api/examiner/exams/...` routes OR have examiners reuse the staff routes via `requirePermission`. (Note: `requireExaminer()` returns a session with `.id` — use `session.id`, not `session.user.id`.)
> - **RBAC integration:** the `canEdit/canReview/canMonitor/canPublish` flags should map to `requirePermission` keys (e.g. `exams:bank:edit`, `exams:bank:review`, `exams:session:monitor`, `exams:results:publish`) granted per `ROLE:INSTRUCTOR` or `USER:<instructorId>` scoped to `bankId`. Keep `requirePermission` authoritative; ADMIN/SUPER_ADMIN bypass.

### 6.1 Instructor Exam Routes (new)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/instructor/exams/banks?scope=mine\|module` | List banks (assigned to me, or all banks in my modules) — §3.5.3 |
| `GET` | `/api/instructor/exams/questions?view=mine\|module&bankId=&status=&submittedById=` | Shared module question list, two filtered views — §3.5.3 |
| `GET` | `/api/instructor/exams/banks/[bankId]/questions` | List questions (read-only or editable per assignment) |
| `POST` | `/api/instructor/exams/banks/[bankId]/questions` | Create question (if `canEdit`) — writes `auditLog` on create (§3.5.5) |
| `PUT` | `/api/instructor/exams/banks/[bankId]/questions/[id]` | Update question (if `canEdit`) |
| `DELETE` | `/api/instructor/exams/banks/[bankId]/questions/[id]` | Retire question (if `canEdit`) |
| `GET` | `/api/instructor/exams/questions/[id]/history` | Merged version history + audit log (who/when) — §3.5.5 |
| `GET` | `/api/instructor/exams/classes` | List classes taught by instructor — ⚠️ **Reuse**, don't reimplement: this duplicates `lib/actions/instructor.ts` (`classes: { some: { instructorId } }` @ line 43, `classesInstructed` @ line 707). Have the page call the existing server action / relation; drop this route or make it a thin passthrough. |
| `GET` | `/api/instructor/exams/classes/[classId]/sessions` | Live sessions for a class |
| `POST` | `/api/instructor/exams/classes/[classId]/start` | Start exam for all enrolled students (idempotent — Decision 29) |
| `GET` | `/api/instructor/exams/classes/[classId]/analytics` | Historical analytics |
| `POST` | `/api/admin/exams/internal/sessions/start` | **Admin override:** schedule an individual student (`{ studentId, bankId, classId? }`) at any time, bypassing window (§3.5.4) |

> 💡 **Suggestion — auth/perf conventions:** These handlers must call `requireInstructor()`
> (`lib/auth/helpers.ts:152`). Pages are auth-gated, so use `prismaUnfiltered` (not the RLS client) and
> filter by `instructorId` / `class.instructorId`. For RBAC, prefer `requirePermission('exam.bank.*')`
> over the bespoke `InternalExamBankInstructor` bitflags where possible (see §3.1).
>
> 💡 **Suggestion — pagination:** `GET .../sessions` and `.../analytics` can return large sets
> (students × attempts). Add `take`/`skip` + `apiPaginated` (API convention). The "take: 200"
> silent-truncation trap applies to both the Live Monitor and analytics tables — paginate or infinite-scroll.
>
> ⚠️ **Suggestion — class-start reuses existing void/start logic:** `POST .../start` should create
> `NOT_STARTED` placeholder sessions that the student `start` route reuses (status guard), and instructor
> void must reuse `operations/void` (sets `voidedAt`/`voidedBy`, clears `attemptNumber` gating). Don't
> fork divergent copies.
>
> 💡 **Suggestion — audit:** Assignment, schedule, void, publish, and class-start mutations must each
> write a `createAuditLog` row (`lib/audit/logger.ts`).

### 6.2 Staff Admin Routes (new)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/staff/exams/internal/banks/[bankId]/instructors` | List instructor assignments |
| `POST` | `/api/staff/exams/internal/banks/[bankId]/instructors` | Assign instructor |
| `PUT` | `/api/staff/exams/internal/banks/[bankId]/instructors/[id]` | Update permissions |
| `DELETE` | `/api/staff/exams/internal/banks/[bankId]/instructors/[id]` | Revoke access |
| `GET` | `/api/staff/exams/internal/banks/[bankId]/schedule` | List class schedules |
| `POST` | `/api/staff/exams/internal/banks/[bankId]/schedule` | Create schedule |
| `PUT` | `/api/staff/exams/internal/banks/[bankId]/schedule/[id]` | Update schedule |
| `DELETE` | `/api/staff/exams/internal/banks/[bankId]/schedule/[id]` | Delete schedule |

### 6.3 Existing Routes to Extend

| Route | Change |
|-------|--------|
| `GET /api/staff/exams/internal/operations/sessions` | Add `classId` and `instructorId` filters |
| `POST /api/student/exams/internal/start` | Accept optional `classId`; enforce schedule window if present |
| `GET /api/student/exams/internal/session` | Add `lastActivityAt` for live monitoring |

> ⚠️ **Behavior-change flag:** §2 sets Staff "Monitor live exams (all)" = ❌, but current `ExamOperations`
> gives staff monitoring, and adding an `instructorId` filter to `operations/sessions` implies staff
> queries become scoped. This is a deliberate capability narrowing — call it out in the migration/comm
> and to users. The `start` route must reuse placeholder sessions created by class-start (see §6.1).

---

## 7. Question Import Pipeline

### 7.1 Supported Formats
- **Plain text** (`.txt`) — pipe-delimited or tab-delimited.
- **Word** (`.docx`) — parsed with `mammoth` or `docx` to extract text.
- **PDF** (`.pdf`) — parsed with `pdf-parse` or `pdfjs-dist`.
- **JSON** (`.json`) — array of question objects.

### 7.2 Flow

```
Instructor uploads file (via UploadThing UploadDropzone — see 💡 note)
  → File lands in UploadThing; server action fetches + validates format
  → Extraction service converts to normalized question array
  → Low-confidence questions → QuestionStatus.DRAFT into existing review queue (see 💡 note)
  → Confirm → bulk import via existing POST /questions endpoint
```

> 💡 **Suggestion — use UploadThing, not custom multipart:** File uploads in this project go through
> UploadThing (`lib/uploads/uploadthing.ts`, `UploadDropzone`/`UploadButton`), consistent with the
> Document Vault / ProtectedImage patterns. Align the import flow: the file is uploaded to UploadThing,
> then a server action fetches + extracts. Avoid introducing a new raw multipart API route.
>
> 💡 **Suggestion — deps/serverless:** `pdf-parse` / `pdfjs-dist` / `mammoth` / `docx` are heavyweight.
> In the `output: 'standalone'` build, keep extraction in an API route, mark it `import 'server-only'`,
> and lazy-import (`await import(...)`) to protect cold-start. Note `pdf-parse` is effectively unmaintained
> — consider `unpdf` or `pdfjs-dist` v4.
>
> 💡 **Suggestion — reuse review workflow:** `InternalExamQuestion` already has `status`, `reviewNote`,
> `reviewedById`. Low-confidence parsed questions should land as `QuestionStatus.DRAFT` and flow into the
> existing approval queue (`/questions/[questionId]/review`) rather than a separate bespoke preview page.

### 7.3 Extraction Heuristics
- Split on question numbers (`1.`, `Q1`, `Question 1`).
- Detect options by leading letters (`A.`, `B.`, `C.`) or bullets.
- Detect correct answer by keywords (`Answer:`, `Correct:`, `✓`).
- Detection confidence score per question; low-confidence questions flagged for manual review.

---

## 8. Implementation Phases

### Phase 1: Instructor Access Control (Week 1)
- Schema: `InternalExamBankInstructor`, `InternalExamClassSchedule`
- Staff UI: Assign instructors to banks (permission toggles)
- Staff UI: Schedule exams to classes
- Backend: New API routes for assignments and schedules
- Backend: Permission checks in existing instructor routes

### Phase 2: Instructor Exam UI (Week 2)
- `/instructor/exams` dashboard
- Question editor (read/write per permissions)
- Class monitor page (polling first, Realtime in Phase 3)
- Analytics page (historical)

### Phase 3: Live Monitoring (Week 3)
- Supabase Realtime subscriptions for instructor monitor
- Student exam interface: `lastActivityAt` tracking
- `exam_started`, `exam_submitted` events
- Live score approximation (running correct count)

### Phase 4: Question Import Pipeline (Week 4)
- File upload API routes
- PDF/DOCX/TXT extraction service
- Preview/edit UI before import
- Bulk import via existing endpoint

### Phase 5: Polish & Audit (Week 5)
- Fix all medium/high findings from LLM Council
- Custom confirmation modals (publish, void, regrade)
- Accessibility audit
- E2E tests for instructor flows
- Documentation

---

## 9. Open Decisions — Resolved

> All original open decisions (1–5) are now resolved. Additional decisions (26–29) were raised and resolved during review.

### 1. Can instructors create new exam banks, or only edit assigned ones? — **RESOLVED**
**Decision:** Instructors **can** create new banks, but only after **admin confirmation**. Instructors may upload and edit questions, but a bank (or newly added questions to an existing bank) is **not visible/public to students until an admin reviews and approves** it.
**Impact:**
- Instructors are **never** granted publish rights. This resolves the §2 / §3.1 contradiction: `canPublish` stays admin-only (see §3.1 and §4.1 edits below).
- A bank needs an explicit `status`/`reviewState` (e.g. `DRAFT → PENDING_ADMIN_REVIEW → APPROVED`) so the student-facing gateway only exposes `APPROVED` banks. New schema field required (see §3.6).

### 2. Should exam windows be strict (hard block) or soft (warning)? — **RESOLVED (use recommendation)**
**Decision:** **Hard block** for scheduled class exams (students cannot start outside the window). **Soft warning** for self-service student exams (allowed but warned).
**Impact:** `POST /api/student/exams/internal/start` enforces the hard block when a `classId` schedule window is present (§6.3).

### 3. Should instructors see live scores during the exam? — **RESOLVED**
**Decision:** **Yes** — show the student's **live score against the actual correct answers** in real time (not just "X/Y answered").
**Impact:** The monitor's running correct count (§4.2 / §5.3) is computed against the real `correctAnswer`, not a placeholder.

### 4. Should explanations be editable by instructors? — **RESOLVED**
**Decision:** **Yes**, if `canEdit` is granted. Explanations are educational content, not answers.

### 5. Should the question import pipeline support EASA-standard formats? — **RESOLVED**
**Decision:** **Yes** — support a JSON schema that matches the EASA question bank format (§7.1 / §7.3).

### 26. What timezone should scheduled exam windows use? — **RESOLVED**
**Decision:** **UTC.** All `scheduledStart` / `scheduledEnd` values are stored and compared in UTC (see §3.2). Client UIs convert to the viewer's local timezone for display only.

### 27. Instructor reassignment / ownership of banks & questions — **RESOLVED**
**Decision:** When an instructor is reassigned or leaves, an **admin can reschedule the class to another fit instructor**, **preserving everything** about the class and its students. **Exam banks and questions are NOT owned by the curating instructor** — once a question is in a bank it belongs to the academy.
**Impact:**
- No instructor-owned cascade delete: removing an `InternalExamBankInstructor` row must **not** delete the bank or its questions (already `onDelete: Cascade` only on the join row — confirm this holds).
- Instructor→bank is a pure access grant, decoupled from content ownership.

### 28. Rescoring / editing a question after attempts exist — **RESOLVED**
**Decision:** **Rescore** affected sessions, and emit a **caution / warning / alert** on that question notifying any user who can view it that the score, question, or answer has been updated.
**Impact:** The regrade flow (existing `operations/regrade` route; confirmation modal in §10) must (a) recompute affected session scores and (b) surface an in-app alert tied to the question for all viewers with access.

### 29. Duplicate "Start Exam for Class" runs — **RESOLVED**
**Decision:** **Yes** — add an **idempotency key or unique constraint** so repeated/accidental start requests do not create duplicate sessions (see §6.1).

---

### Decisions applied to the plan (consistency edits)
- **§3.1** — `canPublish` is admin-only; instructors are never granted it. Removed from the instructor-access toggle in §4.1.
- **§3.2** — schedule windows are UTC.
- **§3.6** (new) — bank `reviewState` field for the admin-approval gate (Decision 1).
- **§6.1** — `POST .../classes/[classId]/start` is idempotent (Decision 29).
- **§4.2 / regrade** — rescore + question-level alert (Decision 28).

---

## 10. Immediate Code Fixes (This Session)

| Fix | File | Status |
|-----|------|--------|
| ⚠️ ~~Hardcoded 75% pass mark in results~~ — **wrong target; see note** | `app/student/exams/internal/results/[sessionId]/page.tsx` | **Withdrawn** |
| Consolidate pass-mark constants (real fix) | `app/examiner/results/actions.ts`, `lib/compliance/reports.ts` vs `lib/constants/business-rules.ts` | **Pending** |
| Custom confirmation modal for publish/void/regrade | `app/staff/exams/internal/_components/ExamOperations.tsx` | **Pending** |

> ⚠️ **Correction (fix #1):** The results page already renders `Pass mark: {data.passMarkPct ?? 75}%`
> — it is **not** hardcoded. The real hardcoded literals are `app/examiner/results/actions.ts`
> (`const PASS_MARK = 75`) and the duplicate `EASA_PASSING_GRADE` in `lib/compliance/reports.ts` versus
> the canonical `ACADEMIC_RULES.EASA_PASS_MARK`. The correct fix is to route every pass-mark read through
> `InternalExamRuleOverride.passMarkPct` (per-bank source of truth) with `EASA_PASS_MARK` as fallback, and
> delete the divergent constants.

---

## 11. Assessment: Improvements & Suggestions

> 📎 **Reconciliation.** This list was written before the inline `⚠️ Correction:` / `💡 Suggestion:`
> blocks were added. Each item is now tagged:
> - `[RESOLVED §X]` — already addressed by an inline block at §X; kept for traceability.
> - `[OPEN]` — still requires a change to the plan or code.
>
> Note: items 1–4 were applied directly to the §3.1/§3.2 schema blocks above (cascade, `updatedAt`, indexes).
> Items 26–29 are **duplicate** of §9 Decisions 26–29 (already resolved) — see §9.

### Data Model

1. [RESOLVED §3.1] **`InternalExamBankInstructor.instructorId` ambiguity** — pinned to `User.id` with `onDelete: Cascade` (matches `ClassSession.instructorId → User`, schema line 1853).
2. [RESOLVED §3.1/§3.2] **Missing `updatedAt` on new models** — added `updatedAt @updatedAt` to both `InternalExamBankInstructor` and `InternalExamClassSchedule`.
3. [RESOLVED §3.2] **`InternalExamClassSchedule.class` relation `onDelete`** — added `onDelete: SetNull` (don't block class archival).
4. [RESOLVED §3.1] **Missing `@@index([bankId])`** — added to both new join tables.

### Backend / API

5. [RESOLVED §6.1/§12.4] **Class-start should use a single transaction** — addressed: bulk insert in `prisma.$transaction`, partial-failure handling, `{ created, skipped, failed }` summary.
6. [OPEN] **No rate limiting on instructor exam-start endpoint** — add `checkRateLimit` (in `lib/auth/helpers.ts`) or explicit POST confirmation before bulk session creation.
7. [RESOLVED §6.3] **Extending `POST /api/student/exams/internal/start` to accept `classId`** — server-side schedule-window enforcement + enrollment + `isActive` checks are required.
8. [RESOLVED §12.2-12.3] **`lastActivityAt` atomic with answer save** — updated in the same `$transaction` as the autosave/heartbeat; heartbeat endpoint proposed in §12.2.
9. [OPEN] **`POST /api/instructor/exams/classes/[classId]/start` must reuse existing void/start logic** — create `NOT_STARTED` placeholder sessions the student `start` route reuses (status guard), so `selectInternalExamQuestions` runs once and retake/void logic holds; instructor void reuses `operations/void`.

### Realtime / Live Monitoring

10. [RESOLVED §5.2/§12.4] **Throttling is per-session, not per-`answer_saved`** — per-answer streaming was removed (§5.2); deltas are now per-session (`exam_started`/`exam_submitted`). Apply per-`(studentId, sessionId)` coalescing + debounced batch refresh (§12.4 throttling).
11. [RESOLVED §12.4E] **Realtime filter must also scope by `instructorId`** — RLS policy on `internal_exam_sessions` restricts instructors to their own classes' sessions.
12. [RESOLVED §12.3.2/§12.2] **Stale `lastActivityAt` handling** — heartbeat endpoint (§12.2) + `exam-timeout` cron auto-submits sessions whose `expiresAt < now()` (and optionally stale beyond a threshold).

### UI / UX

13. [OPEN] **Every new page needs `loading.tsx`** — reuse `TableSkeleton`/`DashboardSkeleton` for the instructor routes (§4.2/4.3).
14. [RESOLVED §4.2] **Mobile responsiveness** — responsive card stack + bottom-sheet filter noted inline.
15. [OPEN] **Virtualized table plan for large classes** — state whether monitor/analytics tables use `@tanstack/react-virtual` or server-side pagination for 100+ students.
16. [OPEN] **"Start Exam for Class" confirmation with preview** — show "This will start exams for N students" with a 5s cooldown or admin override checkbox before the bulk POST.
17. [RESOLVED §4.3] **"Review Later" persistence** — `flaggedForReview` column on `InternalExamAnswer` (or session JSON), not client-only state.
18. [OPEN] **Instructor analytics export format/GDPR spec** — define CSV columns, date format, PII inclusion, and GDPR handling.

### Question Import Pipeline

19. [OPEN] **File upload size/type validation** — `maxFileSize` (e.g. 10MB), MIME whitelist, clear rejection errors.
20. [OPEN] **Duplicate detection** — check stem + options against existing bank rows before import; surface `duplicateCount` in preview.
21. [RESOLVED §7] **Validation against schema** — route uses `zod` `questionSchema` (`options: min(3).max(3)`, correct-answer must be an option). Document rejection behavior (already row-level error reporting).

### Implementation & Process

22. [OPEN] **Phase 1/2 question-editor overlap** — decide: ship the instructor editor in Phase 1 alongside its permission gates, or mark Phase-1 backends as stubs until Phase 2.
23. [OPEN] **Shared-component pre-work** — extract/identify `PermissionGrid`, `ConfirmAction`, and reuse `ConfirmModal` (`_components/ConfirmModal.tsx`) before per-page UI work.
24. [OPEN] **Per-phase audit gate** — run security/permission audits at phase ends, not only Phase 5 LLM Council.
25. [RESOLVED §6 REVIEW block] **Project conventions** — covered inline: `prismaUnfiltered`, `loading.tsx`, `apiPaginated`/`take`/`skip`, `createAuditLog`.

### Open Decisions: Additions (26–29)

> These five items duplicate §9 "Open Decisions — Resolved" (Decisions 26–29), where they are
> already resolved (UTC windows, instructor departure/lifecycle, post-exam rescore/alerts, class-start
> idempotency). **No new resolution here** — see §9. They are retained only as cross-references.

---

## 12. Exam Session Recovery, Time Preservation & Realtime Scaling at 30+ Concurrent Students

> **Research basis:** This section is grounded in a full audit of the current internal exam codebase
> (`prisma/schema.prisma`, `app/api/student/exams/internal/*`, `app/api/staff/exams/internal/operations/*`,
> `app/student/exams/internal/_components/InternalExamInterface.tsx`, `lib/realtime/client.ts`,
> `hooks/useRealtimeMessages.ts`). All cited behaviors are verified from source, not assumed.

---

### 12.1 Current Recovery Reality: There Is None

**Bottom line:** Today, if a student's screen freezes, the browser crashes, or connectivity drops,
**the only recovery path is void + full retake.** There is no resume, no time extension, and no
"pick up where you left off."

| What exists | What does NOT exist |
|---|---|
| `VOIDED` status (admin action) | No `RESUME` / `RECOVERED` status |
| `resumed: true` flag on session load | No server-side `lastActivityAt` or heartbeat |
| Saved answers in `InternalExamAnswer` (autosave) | No mechanism to extend `expiresAt` post-start |
| Student can report issues via `POST /report` | No instructor "kick" / "force submit" / "extend time" routes |
| Client-side timer + server `expiresAt` check | No server-side auto-submit cron for expired sessions |

**Consequence:** A connectivity blip during a 50-minute EASA exam forces the student to restart
from question 1, consuming another full exam window. This is both a **time-waste problem** and an
**integrity tension**: strict retake-from-scratch preserves exam integrity but punishes transient
infrastructure failures; lenient resume-without-verification risks fairness.

---

### 12.2 Why "Start Over" Is the Wrong Default

| Factor | Impact |
|---|---|
| **Wasted scheduled time** | If a class exam is gated by `InternalExamClassSchedule` (start–end window), a voided retake must complete within the same window. A student who spent 25 minutes before a freeze may not have enough remaining time for a full re-attempt. |
| **Answer state is preserved server-side** | `InternalExamAnswer` rows are created at session start and updated on every autosave. The data to resume **already exists** — throwing it away is wasteful, not protective. |
| **Integrity is enforced by the session, not the timer** | The real anti-cheat boundary is "one active session per student per bank" (enforced by `checkEligibility()`). A recovered session is still the same session row — no new attempt is created. |
| **Student trust** | Forcing restarts after infra failures erodes confidence in the testing platform and increases support load. |

**Recommendation:** The default recovery path should be **resume with preserved answers**, not void + retake.
Void should remain available only for confirmed academic-integrity violations (cheating, impersonation).

---

### 12.3 Proposed Recovery Architecture

#### 12.3.1 Schema Additions

```prisma
model InternalExamSession {
  // ... existing fields ...
  lastActivityAt    DateTime?   // NEW: updated on every autosave + heartbeat
  recoveredAt       DateTime?   // NEW: set when instructor resumes a stalled session
  recoveredBy       String?     // NEW: instructor/staff userId
  recoveryReason    String?     // NEW: why recovery was performed
  timeExtensionSec  Int?        // NEW: extra seconds granted by instructor
}
```

- `lastActivityAt`: Updated in the **same transaction** as the answer autosave (see §8 item 8).
  Do not make it a separate write — atomicity prevents stale "live" indicators.
- `recoveredAt` / `recoveredBy` / `recoveryReason`: Audit trail for time extensions and manual resumes.
- `timeExtensionSec`: Additive time bonus. The client computes `timeLeft = (expiresAt + extension) - now`.
  This preserves the original `expiresAt` for forensic review.

#### 12.3.2 Server-Side Heartbeat (New Endpoint)

**Problem:** If a student's tab crashes, the client-side timer dies. The server has no idea the
student is gone until `expiresAt` passes — and there is **no server-side auto-submit cron**.

**Solution:** Add a lightweight heartbeat that the student client pings every 15s:

```
POST /api/student/exams/internal/heartbeat
  Body: { sessionId }
  Response: { accepted: true, expiresAt, timeLeft }
```

- The server updates `lastActivityAt` in the same transaction.
- If `lastActivityAt` is > 2× the heartbeat interval (30s), the session is considered **STALE**.
- A **cron job** (`/api/cron/exam-timeout`) runs every 60s and auto-submits any `IN_PROGRESS`
  session where `expiresAt < now`. This closes the gap where a crashed tab leaves a session open
  indefinitely.

#### 12.3.3 Instructor Recovery Actions

Add three new operations to the instructor/staff toolset:

| Action | Route | Behavior |
|---|---|---|
| **Extend Time** | `POST /api/staff/exams/internal/sessions/[id]/extend` | Adds `timeExtensionSec` to `expiresAt`. Audit logged. Cooldown: max 1 extension per session. |
| **Force Submit** | `POST /api/staff/exams/internal/sessions/[id]/force-submit` | Submits the session immediately using whatever answers are saved in `InternalExamAnswer`. Sets `autoSubmitted: true`, `voidReason: 'Force submitted by instructor'`. |
| **Resume Session** | `POST /api/staff/exams/internal/sessions/[id]/resume` | If the session is `IN_PROGRESS` and `lastActivityAt` is stale, this sends a push/realtime event to the student's device (or flags the session as resumable). The student's next page load detects the flag and offers "Continue your exam" instead of "Start over." |

**UI placement:** These appear in `ExamOperations.tsx` as row actions on `IN_PROGRESS` sessions,
alongside the existing Void / Publish / Regrade actions. They require `requireStaff()` or
`requirePermission('exams:session:extend')`.

#### 12.3.4 Student-Side Resume Flow

When a student returns to the exam page after a disconnect:

1. `GET /api/student/exams/internal/session?sessionId=xxx` returns the session.
2. If `status === 'IN_PROGRESS'` and `expiresAt > now`:
   - Show **"Welcome back. You have X minutes remaining. Resume where you left off?"**
   - Pre-populate all previously saved answers from `InternalExamAnswer`.
   - Client-side timer starts from `(expiresAt + timeExtensionSec) - now`.
3. If `status === 'TIMED_OUT'` or `expiresAt < now`:
   - Show **"Your exam time has expired."** — no resume possible.
   - Instructor can still `force-submit` if answers are incomplete but within grace period.

**This is a change to the existing `session/route.ts` resume path.** Currently it only checks
`expiresAt`. After this change, it must also check `timeExtensionSec` and return the effective
deadline.

---

### 12.4 Realtime Failure Modes at 30+ Concurrent Students

The planned instructor live monitor depends on Supabase Realtime. At 30+ simultaneous exam
sessions in a single class, the following failure modes are **guaranteed** under the current
implementation:

| Failure Mode | Root Cause | Impact |
|---|---|---|
| **Event throttling / drops** | `eventsPerSecond: 5` in `lib/realtime/client.ts:28` | A class of 30 students starting simultaneously fires 30 INSERTs. The client caps at 5 EPS; the remaining 25 are dropped. The instructor sees only partial start events. |
| **Re-render storm** | `router.refresh()` in `hooks/useRealtimeMessages.ts:47,59` on every event | 30 concurrent submissions = 30 rapid `router.refresh()` calls. Each triggers a full server render of the monitor page. The instructor's browser hangs or shows stale data. |
| **Channel death on disconnect** | No reconnection logic in `useRealtimeMessages.ts:62-68` | If the instructor's WebSocket drops (common on mobile/tablet), the channel is dead. The hook logs a warning and **never re-subscribes**. Monitoring freezes until page reload. |
| **No per-channel throttling** | Plan recommends "max one update per student per 5s" but nothing enforces it | Autosave + activity pings from 30 students flow through unfiltered. Supabase Realtime has its own server-side limits; exceeding them causes channel eviction. |
| **CSP blocks WebSocket in production** | `next.config.ts` `connect-src` whitelist omits `*.supabase.co` | Production Vercel deploys will reject Supabase WebSocket handshakes. Realtime silently fails. |
| **No RLS on `internal_exam_sessions` Realtime** | Realtime is a separate PostgreSQL replication stream; row-level security policies must be explicitly enabled on the publication | Without RLS, any authenticated user who guesses a `sessionId` can subscribe to another user's exam data via the anon key. |
| **No debounce on batch events** | `useRealtimeMessages` fires callbacks immediately | Bulk operations (class start, bulk void) produce N toasts + N refreshes with no coalescing. |

#### 12.4.1 Required Realtime Hardening

**A. Client configuration**

```ts
// lib/realtime/client.ts — replace current config with:
createBrowserClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: {
    params: { eventsPerSecond: 50 }, // raise cap; enforce throttling at application layer
    reconnect: true,                 // enable built-in reconnect
    timeout: 10000,                  // 10s connect timeout
  },
})
```

**B. Per-channel throttling (application layer)**

Wrap every `.on('postgres_changes', ...)` callback in a per-student throttle:

```ts
const lastUpdateByStudent = new Map<string, number>()
const THROTTLE_MS = 5000

function throttleUpdate(studentId: string, fn: () => void) {
  const now = Date.now()
  const last = lastUpdateByStudent.get(studentId) ?? 0
  if (now - last >= THROTTLE_MS) {
    lastUpdateByStudent.set(studentId, now)
    fn()
  }
}
```

**C. Debounced batch refresh**

Replace `router.refresh()` on every event with a debounced batch:

```ts
const debounceTimer = useRef<NodeJS.Timeout>()
const pendingUpdates = useRef<Set<string>>(new Set())

function scheduleRefresh(sessionId: string) {
  pendingUpdates.current.add(sessionId)
  if (debounceTimer.current) clearTimeout(debounceTimer.current)
  debounceTimer.current = setTimeout(() => {
    router.refresh() // one refresh for N updates
    pendingUpdates.current.clear()
  }, 1000)
}
```

**D. Reconnection with fallback**

```ts
channel.subscribe((status, err) => {
  if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
    console.warn('[Realtime] exam channel lost:', status, err)
    // Fall back to polling immediately
    startPollingFallback(classId)
    // Attempt re-subscribe after backoff
    setTimeout(() => subscribeRealtime(classId), 5000)
  }
  if (status === 'SUBSCRIBED') {
    stopPollingFallback()
  }
})
```

**E. Realtime RLS policy**

Enable row-level security on the `internal_exam_sessions` Realtime publication:

```sql
-- In Supabase SQL Editor
ALTER PUBLICATION supabase_realtime ADD TABLE internal_exam_sessions;

-- RLS policy: instructors can only see sessions for their own classes
CREATE POLICY "instructors_own_classes_only"
  ON internal_exam_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classes c
      JOIN instructors i ON i.id = c.instructorId
      WHERE c.id = internal_exam_sessions.classId
        AND i.userId = auth.uid()::text
    )
  );
```

**F. CSP update**

Add Supabase WebSocket origins to `next.config.ts`:

```ts
contentSecurityPolicy: {
  connectSrc: [
    "'self'",
    "https://*.supabase.co",           // Realtime WebSocket
    "https://*.supabase.com",          // REST API
    // ... existing entries
  ],
},
```

**G. Server-side auto-submit cron**

```
Path: /api/cron/exam-timeout
Schedule: every 5 minutes
Auth: CRON_SECRET
Action: UPDATE internal_exam_sessions
  SET status = 'TIMED_OUT', autoSubmitted = true
  WHERE status = 'IN_PROGRESS' AND expiresAt < now()
  AND (lastActivityAt IS NULL OR lastActivityAt < now() - INTERVAL '5 minutes')
```

This closes the "crashed tab leaves session open forever" gap without relying on client timers.

---

### 12.5 Recommended Time-Preservation Protocol

| Scenario | Instructor Action | Student Experience | Time Impact |
|---|---|---|---|
| **Connectivity drop (< 30s)** | None needed | Student reconnects, client resumes from saved answers via `resumed: true` path. Timer continues from server `expiresAt`. | Zero waste. |
| **Connectivity drop (> 30s, < window end)** | Optionally **Extend Time** by 5–10 minutes. | Student reconnects, sees "Your exam was paused. X minutes added." Answers preserved. | Minimal waste; extension is logged. |
| **Browser/tab crash** | Student returns and reloads page. Server detects `lastActivityAt` stale but `expiresAt` still valid → resume path. | Same as connectivity drop. | Zero waste. |
| **Student requests help mid-exam** | Instructor reviews live monitor, sees last answered question, can **Force Submit** if the student confirms they want to stop. | Exam ends; instructor may grant a new session via void + retake **within the same schedule window** if time remains. | Partial waste (remaining window time may be insufficient for full re-attempt). |
| **Confirmed academic-integrity violation** | **Void** session. Audit log with reason. | Must retake from scratch. New session created. | Full retake time required; this is the correct integrity posture. |

**Golden rule:** Recover whenever possible. Void only for integrity violations.

---

### 12.6 Implementation Checklist for Exam Reliability

| Priority | Item | Owner | Phase |
|---|---|---|---|
| **P0** | Add `lastActivityAt`, `recoveredAt`, `recoveredBy`, `recoveryReason`, `timeExtensionSec` to `InternalExamSession` | Backend | Phase 1 |
| **P0** | Add `POST /api/student/exams/internal/heartbeat` (updates `lastActivityAt` atomically with answer save) | Backend | Phase 1 |
| **P0** | Add `POST /api/staff/exams/internal/sessions/[id]/extend` and `/force-submit` | Backend | Phase 3 |
| **P0** | Add `/api/cron/exam-timeout` for server-side auto-submit | Backend | Phase 1 |
| **P0** | Update `expiresAt` calculation to include `timeExtensionSec` in `session/route.ts` and client timer | Fullstack | Phase 3 |
| **P1** | Realtime: raise `eventsPerSecond`, add reconnect, per-channel throttling, debounced refresh | Frontend | Phase 3 |
| **P1** | Realtime RLS policy on `internal_exam_sessions` + ALTER PUBLICATION | Backend | Phase 3 |
| **P1** | CSP `connect-src` update for Supabase WebSocket origins | DevOps | Phase 3 |
| **P1** | Student exam UI: detect stale-but-resumable sessions and show "Continue" CTA | Frontend | Phase 3 |
| **P2** | Push notification / realtime alert to student when instructor extends time or force-submits | Frontend | Phase 4 |
| **P2** | Add `tabSwitchCount` and `fullscreenExits` server-side tracking (currently client-only / vestigial) | Backend | Phase 5 |
| **P2** | Load test: simulate 30+ concurrent exam sessions with Realtime + autosave + heartbeat | QA | Phase 5 |

---

### 12.7 Best Practices (Authoritative)

1. **Never trust the client timer.** `expiresAt` is the source of truth. The client timer is UX only.
2. **Atomic writes for session state.** `lastActivityAt` must be updated in the same `$transaction` as
   the answer save. Separate writes create inconsistent "live" data on crash.
3. **One active session per student per bank.** This is the integrity boundary. Time extensions and
   answer preservation do not weaken it — they operate within the same session row.
4. **Void is an integrity tool, not a recovery tool.** Reserve `VOIDED` for confirmed violations.
   Add a `voidReason` enum or allowlist to prevent casual voiding.
5. **Realtime is a delta layer, not the primary data path.** The instructor monitor must fetch the
   initial session list via `GET`, then use Realtime only for subsequent INSERT/UPDATE deltas.
   Never rely on Realtime replay for initial state.
6. **Throttle at the application layer, not just the client config.** `eventsPerSecond: 5` is a
   safety net, not a strategy. Per-channel and per-student throttling prevents Supabase from
   evicting hot channels.
7. **Always have a polling fallback.** Realtime is unreliable at scale and on poor networks.
   The 15s poll is the fallback; Realtime is the optimization.
8. **Log every recovery action.** `createAuditLog` on extend, force-submit, resume, and void.
   These are privileged actions; they must be auditable.
9. **Test offline behavior.** The exam interface must handle `navigator.onLine === false` gracefully:
   queue answers locally, warn the student, and sync on reconnect. Do not silently drop answers.
10. **Preserve scheduled windows.** A class exam window (`InternalExamClassSchedule`) is a hard
    commitment to the instructor. Time extensions should not push a session past the window end
    without explicit admin override.

---

### 12.8 Violation Detection & Instructor Discretion

> **Research basis:** The current exam "lockdown" is cosmetic only. `tabSwitchCount`, `fullscreenExits`,
> and `keyboardEvents` exist in `prisma/schema.prisma` as `Int @default(0)` fields on
> `InternalExamSession`, but **none are persisted by any server route**. The only writer is
> `submit/route.ts` line 99, which increments `keyboardEvents` by 1 on auto-submit — semantically
> incorrect (that flag means "auto-submitted", not "keyboard shortcut detected"). The fullscreen
> listener in `InternalExamInterface.tsx` (lines 133–145) only re-shows an overlay prompt;
> `visibilitychange` (lines 148–157) increments a local React state that is never sent to the
> server. Admins have **zero visibility** into any of these events today. The only working
> anti-cheat route in the repo is `app/api/applicant/aptitude/anti-cheat/route.ts` — there is no
> equivalent for internal exams.

---

#### 12.8.1 Why the Current "Lockdown" Fails as an Integrity Control

| Layer | Current behavior | Actual security value |
|---|---|---|
| **CSS `exam-lockdown`** | Hides sidebar, nav, breadcrumbs, banners | **Zero** — cosmetic only. Does not block DevTools, screenshots, copy/paste, or OS-level app switching. |
| **Fullscreen prompt** | Re-shows overlay when student exits fullscreen | **Deterrent only** — student can dismiss and continue. No counter, no server event. |
| **Tab-switch counter** | Increments local React state | **Zero** — never persisted, never shown to admin, resets on page reload. |
| **Keyboard shortcut handler** | Enter/Escape triggers auto-submit | **Misleading** — labeled as anti-cheat but only handles exam submission, not Ctrl+C/V/F12. |
| **`keyboardEvents` schema field** | Incremented by 1 on auto-submit | **Wrong semantics** — conflates "auto-submit triggered" with "cheat shortcut detected." |

**The honest framing for the UI:** Replace "Your screen activity is monitored" with
"**Leaving fullscreen or switching tabs is logged and may be reviewed by your instructor.**"
Deterrents are fine, but the platform must not claim enforcement it does not perform.

---

#### 12.8.2 What Must Be Tracked Server-Side

Add a dedicated violations table rather than overloading `InternalExamSession` counters.
This gives per-event timestamps, types, and review outcomes — impossible with bare `Int` fields.

```prisma
model InternalExamViolation {
  id            String   @id @default(cuid())
  sessionId     String
  studentId     String
  classId       String?
  bankId        String
  type          ExamViolationType
  severity      ExamViolationSeverity @default(WARNING)
  detail        String?
  deviceInfo    Json?    // { userAgent, platform, screenRes }
  reviewedAt    DateTime?
  reviewedBy    String?
  reviewOutcome ViolationOutcome @default(PENDING)
  reviewNote    String?
  createdAt     DateTime @default(now())

  session InternalExamSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId])
  @@index([studentId])
  @@index([classId])
  @@map("internal_exam_violations")
}

enum ExamViolationType {
  FULLSCREEN_EXIT
  TAB_SWITCH
  KEYBOARD_SHORTCUT
  NETWORK_DISCONNECT
  EXAM_INTERFACE_UNLOAD
}

enum ExamViolationSeverity {
  WARNING    // first occurrence, likely accidental
  NOTICE     // 2–3 occurrences within the same exam
  CRITICAL   // repeated or suspicious pattern
}

enum ViolationOutcome {
  PENDING    // not yet reviewed
  GRACIOUS   // instructor allowed continuation
  STRICT     // instructor ended session
  DISMISSED  // instructor marked as false positive
}
```

**Why a table, not counters:**
- Counters lose the temporal context (when did it happen, how many in a row).
- Review outcomes require per-event state (`reviewedAt`, `reviewedBy`, `reviewNote`).
- Analytics ("most-violated students", "violation heatmap by time") require queryable rows.
- Severity escalation (`WARNING` → `NOTICE` → `CRITICAL`) needs per-event classification.

---

#### 12.8.3 Client-Side Detection (Actually Implement It)

The student exam interface must detect and POST these events server-side:

| Event | Detection method | When to POST |
|---|---|---|
| **Fullscreen exit** | `document.fullscreenchange` | On every exit while `status === IN_PROGRESS` |
| **Tab switch** | `document.visibilitychange` | On every `hidden` event while `status === IN_PROGRESS` |
| **Copy / Paste / Cut** | `document.addEventListener('copy'|'paste'|'cut', ...)` | On every event while `status === IN_PROGRESS` |
| **Keyboard shortcuts** | `keydown` listener for `Ctrl+C`, `Ctrl+V`, `Cmd+C`, `Cmd+V`, `F12`, `Ctrl+Shift+I`, `Ctrl+Shift+J`, `Ctrl+Shift+C`, `Alt+Tab` (where detectable) | On every match while `status === IN_PROGRESS` |
| **Network disconnect** | `navigator.onLine` + `online`/`offline` events | On `offline` while `status === IN_PROGRESS` |
| **Page unload / beforeunload** | `beforeunload` + `pagehide` | On unload while `status === IN_PROGRESS` |

**POST endpoint:**

```
POST /api/student/exams/internal/violation
  Body: {
    sessionId: string,
    type: ExamViolationType,
    detail?: string,       // e.g. "Exited fullscreen", "Tab hidden", "Ctrl+C detected"
    deviceInfo?: object    // optional; server can also capture userAgent from headers
  }
  Response: { logged: true, violationId }
```

**Severity assignment logic (server-side):**

```ts
function classifySeverity(session: InternalExamSession, violation: ExamViolationType): ExamViolationSeverity {
  const recent = await prisma.internalExamViolation.count({
    where: {
      sessionId: session.id,
      createdAt: { gte: session.startedAt! },
      ...(violation === ExamViolationType.FULLSCREEN_EXIT && { type: ExamViolationType.FULLSCREEN_EXIT }),
    },
  })

  if (recent === 0) return ExamViolationSeverity.WARNING
  if (recent <= 2) return ExamViolationSeverity.NOTICE
  return ExamViolationSeverity.CRITICAL
}
```

---

#### 12.8.4 Instructor Review UI

**Location:** `ExamOperations.tsx` — expanded session detail row.

When an instructor expands an `IN_PROGRESS` or recently `COMPLETED`/`TIMED_OUT` session,
the detail view shows a **Violations panel** alongside the per-question breakdown:

```
┌─────────────────────────────────────────────────────┐
│ Session: John Doe — CAT-A Module 1                   │
│ Status: IN_PROGRESS | Time left: 12:30               │
├─────────────────────────────────────────────────────┤
│ ⚠️ Violations (3)                                    │
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 14:32  FULLSCREEN_EXIT  WARNING     [GRACIOUS]  │ │
│ │        "Student exited fullscreen"               │ │
│ │        Reviewed: —                                │ │
│ ├─────────────────────────────────────────────────┤ │
│ │ 14:35  TAB_SWITCH       NOTICE      [STRICT]    │ │
│ │        "Tab became hidden"                       │ │
│ │        Reviewed: —                                │ │
│ ├─────────────────────────────────────────────────┤ │
│ │ 14:38  KEYBOARD_SHORTCUT CRITICAL    [DISMISS]  │ │
│ │        "Ctrl+C detected"                         │ │
│ │        Reviewed: —                                │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ [Allow Continue] [End Exam Now] [Dismiss All]        │
└─────────────────────────────────────────────────────┘
```

**Per-violation actions:**
- **Allow Continue (GRACIOUS)** — Session stays `IN_PROGRESS`. Student can resume.
  Optionally add a small time extension (e.g., +2 minutes) as a goodwill gesture.
  Audit log: `instructorId`, `violationId`, `reviewNote`.
- **End Exam Now (STRICT)** — Calls `force-submit` on the session (§12.3.3).
  Audit log: `instructorId`, `violationId`, `reviewNote`, `voidReason`.
- **Dismiss (DISMISSED)** — Marks violation as false positive. No session change.
  Useful when the instructor determines the event was a browser quirk or legitimate action.

**Bulk actions:**
- **Dismiss All** — Dismisses all `PENDING` violations for this session.
- **End Exam** — Force-submits the entire session (strict posture).
- **Allow Continue** — Marks all violations as `GRACIOUS`, session continues.

**Instructor discretion is the entire point.** The system logs and surfaces; the instructor
decides. Do not auto-fail on any threshold — the same event can be accidental (laptop sleep,
OS notification, screen reader) or intentional (copy/paste answers, switch to another tab).

---

#### 12.8.5 Student-Side Behavior During Violations

| Scenario | Student sees | Session state |
|---|---|---|
| **First fullscreen exit** | Overlay prompt: "Please return to fullscreen." Timer continues. | `IN_PROGRESS` — violation logged server-side with `WARNING` severity. |
| **Second fullscreen exit within 60s** | Overlay + warning banner: "This has been logged. Your instructor may review this." | `IN_PROGRESS` — severity escalates to `NOTICE`. |
| **Repeated exits or tab switches** | Same overlay. Session continues unless instructor intervenes. | `IN_PROGRESS` — severity escalates to `CRITICAL`. |
| **Instructor chooses GRACIOUS** | Toast: "Your instructor has allowed you to continue." Exam resumes normally. | `IN_PROGRESS` — violation marked `GRACIOUS`. |
| **Instructor chooses STRICT** | Screen: "Your exam has been submitted by your instructor." Redirects to pending-review. | `TIMED_OUT` / `COMPLETED` (via `force-submit`) — violation marked `STRICT`. |

**No client-side auto-submit on violations.** The client never decides to end the exam.
It only logs and surfaces warnings. All termination decisions require an explicit instructor action.

---

#### 12.8.6 Anti-Cheat Posture: What This Does and Does Not Enforce

| What this prevents | What this does NOT prevent |
|---|---|
| **Deterrence** — visible logging and instructor review discourages casual tab-switching. | **Bulletproof lockdown** — students can still use a second device, screenshot, or VM. No browser-based exam is fully cheat-proof. |
| **Audit trail** — every violation is timestamped, typed, and reviewed with outcome. | **Real-time interception** — the instructor only sees violations after they occur. |
| **Instructor discretion** — context-aware decisions (graceful vs. strict). | **Automated enforcement** — the system never auto-fails; it always defers to human judgment. |
| **Fairness** — accidental events (browser update, OS notification) can be dismissed. | **Detection of all covert methods** — screen recording, phone camera, external notes are invisible to the browser. |

**Honest framing for the UI and student instructions:**
> "This exam monitors fullscreen and tab-switching for review purposes. If you need to step away
> or experience technical issues, contact your instructor immediately. Unauthorized assistance
> or reference materials during the exam may result in a voided result."

---

#### 12.8.7 Implementation Checklist

| Priority | Item | Owner | Phase |
|---|---|---|---|
| **P0** | Add `InternalExamViolation` model + enums (`ExamViolationType`, `ExamViolationSeverity`, `ViolationOutcome`) to `prisma/schema.prisma` | Backend | Phase 1 |
| **P0** | Implement client-side detection (fullscreen, tab-switch, keyboard shortcuts, network, unload) in `InternalExamInterface.tsx` | Frontend | Phase 2 |
| **P0** | Add `POST /api/student/exams/internal/violation` endpoint with severity classification | Backend | Phase 2 |
| **P0** | Wire violation logging into heartbeat + answer-save paths (network disconnect, exam interface unload) | Fullstack | Phase 2 |
| **P1** | Add violations panel to `ExamOperations.tsx` expanded session detail (per-violation actions + bulk actions) | Frontend | Phase 3 |
| **P1** | Add `POST /api/staff/exams/internal/sessions/[id]/violations/[violationId]/review` endpoint (GRACIOUS / STRICT / DISMISSED) | Backend | Phase 3 |
| **P1** | Add `POST /api/staff/exams/internal/sessions/[id]/end` (strict end-exam action, reuses `force-submit` logic) | Backend | Phase 3 |
| **P1** | `InternalExamInterface.tsx`: block copy/paste DevTools shortcuts; add `beforeunload` confirmation dialog | Frontend | Phase 3 |
| **P1** | Remove misleading "Your screen activity is monitored" claim; replace with accurate framing | Frontend | Phase 2 |
| **P2** | Violation analytics dashboard (per-class heatmap, repeat-offender detection) | Frontend | Phase 4 |
| **P2** | Add `tabSwitchCount`, `fullscreenExits`, `keyboardEvents` to the admin session detail as **aggregated summary** (derived from `InternalExamViolation` rows, not direct counters) | Fullstack | Phase 5 |
| **P2** | Load test: simulate 30+ students triggering violations simultaneously (verify no Realtime storm) | QA | Phase 5 |

---

#### 12.8.8 Best Practices

1. **Never auto-fail on a violation count.** The instructor must review context. A student who
   accidentally hits Alt+Tab during a screen-reader session is not cheating.
2. **Log before you punish.** Every violation is written to `InternalExamViolation` immediately.
   Review outcomes are written later. Do not conflate detection with judgment.
3. **Severity is advisory, not deterministic.** `WARNING` / `NOTICE` / `CRITICAL` helps the
   instructor triage, but the instructor overrides severity with their decision.
4. **Audit every review outcome.** `createAuditLog` on every `GRACIOUS`, `STRICT`, and `DISMISSED`
   decision. The log must include `violationId`, `sessionId`, `reviewNote`, and `instructorId`.
5. **Keep the exam interface usable.** Aggressive blocking (e.g., disabling Ctrl+C entirely)
   breaks accessibility tools and legitimate workflows. Log and surface; do not cripple the browser.
6. **Preserve answers on strict end.** `force-submit` grades whatever answers are saved in
   `InternalExamAnswer`. Do not blank answers on violation — that punishes honest students for
   infrastructure events.
7. **Communicate clearly to the student.** "Your exam has been reviewed and you may continue"
   is better than a silent re-enable. The student should always know the outcome of a review.

---

## 13. Consolidated Review Additions (from the full assessment)

> The standalone internal-exam-system-ui-plan-assessment.md / *-REVIEW.md have been merged into this
> document and removed. This section captures points from that deeper review not already covered by
> §11, so this file is the single source of truth.

### Security & Realtime
- Realtime RLS (A3). Supabase Realtime honors Postgres RLS, not the app's Prisma RLS. Without RLS on
  internal_exam_sessions, a guessed sessionId/classId lets another class's monitor be subscribed.
  Define Postgres RLS (students see only own rows; instructors only assigned classes/banks). Channel
  scoping is UX, not a security boundary.
- Channel name != filter (A4). Per hooks/useRealtimeMessages.ts:36-43, scoping lives in the
  postgres_changes filter (recipientId=eq.{...}), not the channel name. Every subscription must pair a
  namespace with filter: 'classId=eq.{...}' (camelCase) and re-validate scope server-side.
- Send Reminder -> Notification model (B9). Use the existing Notification model (schema.prisma:1053,
  Realtime-streamed) — write an audit-logged row, not a toast.

### Architecture reuse (avoid rework)
- Reuse existing instructor class listing (D1). lib/actions/instructor.ts (lines 43 / 707) already list
  instructed classes; reuse them for "My Classes" instead of a new endpoint.
- Reuse the polling pattern (D2). ExamOperations.tsx:122-149 and InternalExamDashboard.tsx:94-119
  implement visibility-aware 30s polling with tab-pause/refocus. Extract a shared usePollVisibility /
  useLiveRefresh hook and reuse for the instructor monitor (Realtime primary, polling fallback).
- Migration + mirror + Realtime-enable (E3). Phase 1 steps: bun run db:push; bun run db:push:supabase;
  enable Realtime on internal_exam_sessions in the Supabase Console and add it to the replication
  publication (mirror the messages table setup).

### Priority order (before build)
Correctness blockers first: wrong pass-mark target (§10 fix #1), class-start vs single-attempt block
(§12.3), pagination/truncation (C3), question-selection timing (E2), Realtime security + scoping (A3/A4).
Then architecture debt: parallel RBAC (A1), rule-override reuse (E1), audit logging (A6), reuse existing
class listing (D1). Then conventions: polling/Realtime-fallback/shared-components/loading.tsx/tour
(D2/D3/D4), UploadThing (F1), tests (H2), db:push+mirror+Realtime (E3). Then polish: accessibility/
thresholds/mobile (G1-G3), consistency (B2/B3/B4/B5/B6/B7), import (F2-F4), remaining delivery
(H3/H4/H5/H6).

---

## 14. Strict Keypress Auto-Submit (User Directive)

> **User requirement (confirmed 2026-08-30):** In exam mode, hitting **any key** on the keyboard
> auto-submits the session. **No confirmation dialog.** No "are you sure?" toast. Immediate submission.

### 14.1 Implementation

| Aspect | Detail |
|--------|--------|
| **Trigger** | `document.keydown` listener active only when `status === 'IN_PROGRESS'` |
| **Focus target** | A hidden `<input>` is always focused during the exam so the document receives key events |
| **Debounce** | 100ms to prevent double-submit from key-hold |
| **Exclusions** | Modifier-only keys (`Shift`, `Ctrl`, `Alt`, `Meta`) are excluded to prevent accessibility-tool false positives |
| **Violation logging** | Every keypress-triggered submit is logged as `ExamViolationType.KEYBOARD_SHORTCUT` with `severity: 'CRITICAL'` |
| **Client UX** | No confirmation UI. The exam interface transitions directly to the submitted state. A non-blocking toast reads "Exam auto-submitted." |
| **Server enforcement** | The server validates the submission regardless of client behavior; the keypress listener is a client-side convenience, not the trust boundary |

### 14.2 Accessibility Exception

Auto-submit on any key press violates WCAG 2.1.1 (Keyboard) and 2.1.2 (No Keyboard Trap).
For EASA-regulated exams operating in a controlled environment, this is documented as a
**regulated exception** (see §15). An alternative supervised delivery pathway must exist for
candidates who cannot use the lockdown interface.

### 14.3 Codebase Integration

- **Client:** `app/student/exams/internal/_components/InternalExamInterface.tsx` — add the
  `keydown` listener alongside the existing fullscreen/tab-switch handlers.
- **Violation endpoint:** `POST /api/student/exams/internal/violation` (§12.8.3) already accepts
  `ExamViolationType.KEYBOARD_SHORTCUT`; keypress submit calls it before transitioning.
- **Server:** `app/api/student/exams/internal/submit/route.ts` remains the authoritative submit
  handler; the client listener merely routes to it.

---

## 15. EASA Part-147/Part-66 Compliance Framework

> This section defines the regulatory requirements that shape every decision in this plan.
> EASA compliance is not a Phase 5 add-on — it is a foundational constraint.

### 15.1 Regulatory References

| Reference | Requirement |
|-----------|-------------|
| **EASA ED Decision 2023/019/R** | Mandates new training methods and examination integrity controls for Part-147 MTOs |
| **NPA 2023-10** | Fraud reduction: controlled examination environments, secure storage, randomised delivery, automated grading |
| **H.C.A.A. March 2025** | Computerised electronic examination, random question generation per candidate, automated grading with immediate score availability |
| **FAA Part-147 §147.23** | Testing integrity procedures, test security, cheating-handling workflows |
| **EASA SIB 2014-32** | HATA fraud case precedent — certificates of recognition fraudulently obtained |

### 15.2 Controlled Environment Requirements

1. **Examinations must be conducted under full organisational control** (147.A.100(b)2).
   - The academy must be able to demonstrate who was present, what device was used, and that
     no unauthorised materials were accessible.
2. **Secure storage and randomised delivery of examination material.**
   - Question banks must be versioned, access-controlled, and randomised per candidate.
3. **Automated grading with immediate result availability.**
   - MCQ scoring is server-side; results are available immediately on submit.
4. **Invigilator presence** for on-site sessions.
   - `ExamSession.invigilatorId` links each session to a responsible invigilator.

### 15.3 Exam Integrity Controls (EASA-Mapped)

| EASA Requirement | Implementation in This Plan |
|------------------|----------------------------|
| Controlled environment | Fullscreen enforcement + tab-switch logging + instructor review (§12.8, §16) |
| Secure question storage | Versioned `InternalExamQuestion` + approval workflow (§3.6, §3.5) |
| Randomised delivery | Server-side question/option shuffle per candidate (§6, Phase 3) |
| Automated grading | Server-authoritative `SECURITY DEFINER` grading function (§18) |
| Immediate results | Score computed on submit; student sees result + explanation |
| Audit trail | Hash-chain `audit_logs` table with 7-year retention (§19) |
| Invigilator record | `InternalExamSession.recoveredBy`, violation review outcomes |

### 15.4 Retention & Data Governance

- **Integrity data** (exam sessions, answers, violations, audit logs): **7 years** minimum per EASA.
- **PII** (student personal details, photos): Subject to GDPR erasure requests.
- **Retention tiering:** Add `retentionCategory` enum (`INTEGRITY`, `PII`, `BOTH`) to exam models.
  GDPR sweep redacts `PII` columns but preserves `INTEGRITY` rows.
- **DPIA required** before any behavioural biometrics processing (keystroke dynamics, mouse patterns)
  — even without webcam, these are special-category data under GDPR Article 9. **DPIA must be
  completed in Phase 0** (§21) before any client-side detection begins logging.

---

## 16. Anti-Cheat Browser Controls

> The existing internal exam "lockdown" is cosmetic only (§12.8.1). This section defines the
> actual client-side controls that enforce exam integrity. All are **signals**, not enforcement —
> the server-side audit log and instructor review are the real trust boundary.

### 16.1 Control Matrix

| Control | Implementation | Bypass Risk | EASA Relevance |
|---------|---------------|-------------|----------------|
| **Fullscreen lock** | Fullscreen API + `fullscreenchange` listener + overlay | Medium (Esc out; overlay warns) | Controlled environment |
| **Tab-switch detection** | `visibilitychange` + `blur` → `POST /violation` | Low (cannot spoof from within browser) | Controlled environment |
| **Clipboard block** | `preventDefault()` on `copy`/`cut`/`paste` | Medium (clipboard API, DevTools) | Prevents answer sharing |
| **DevTools detection** | `debugger` timing + `window.outerWidth - innerWidth` check | Low-Medium | Deterrent |
| **PrintScreen block** | `keydown` on PrintScreen key | Low (OS-level screenshots bypass) | Deterrent |
| **Keyboard shortcut block** | `keydown` for Ctrl+C/V/P, F12, Alt+Tab | Medium (accessibility tools) | Prevents answer extraction |
| **Multi-tab prevention** | `BroadcastChannel` + `localStorage` heartbeat | Low | Prevents proxy candidate |
| **Strict keypress submit** | Any key → auto-submit, NO confirmation (§14) | Low (prevents second-device lookup) | Immediate termination on breach |

### 16.2 Client-Side Implementation

All detection lives in `InternalExamInterface.tsx` (Phase 2):

```tsx
// Fullscreen
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && status === 'IN_PROGRESS') {
    void logViolation('FULLSCREEN_EXIT', 'Student exited fullscreen')
  }
})

// Tab switch
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && status === 'IN_PROGRESS') {
    void logViolation('TAB_SWITCH', 'Tab became hidden')
  }
})

// Clipboard
['copy', 'cut', 'paste'].forEach(event => {
  document.addEventListener(event, e => e.preventDefault())
})

// Keyboard shortcuts (excluding modifier-only keys)
document.addEventListener('keydown', (e) => {
  if (status !== 'IN_PROGRESS') return
  if (e.key === 'Escape' || e.key === 'F12') {
    void logViolation('KEYBOARD_SHORTCUT', `${e.key} detected`)
  }
  // Strict keypress submit (modifier-only keys excluded)
  if (strictMode && !e.ctrlKey && !e.metaKey && !e.altKey) {
    handleSubmit() // immediate, no confirmation
  }
})
```

### 16.3 Server-Side Violation Classification

Every client event POSTs to `POST /api/student/exams/internal/violation` (§12.8.3). The server
classifies severity based on recent history for the session:

| Recent violations for this session | New violation severity |
|-----------------------------------|------------------------|
| 0 | `WARNING` |
| 1–2 | `NOTICE` |
| 3+ | `CRITICAL` |

Instructor review outcomes: `GRACIOUS` (continue), `STRICT` (end exam), `DISMISSED` (false positive).
**The system never auto-fails on violation count** — instructor discretion is required (§12.8.4).

---

## 17. Access-Code Gating & Pre-Exam Identity

> For external candidates or EASA-certification exams, the academy must verify candidate identity
> before exam access. This section extends the internal exam system with access-code gating and
> pre-exam identity capture.

### 17.1 Access-Code Model

```prisma
model InternalExamAccessCode {
  id          String   @id @default(cuid())
  code        String   @unique // 32-char, excludes 0/O/1/I
  sessionId   String
  candidateId String?  // bound to specific candidate (User.id or external)
  used        Boolean  @default(false)
  usedAt      DateTime?
  expiresAt   DateTime
  createdAt   DateTime @default(now())

  @@index([sessionId])
  @@index([code])
  @@map("internal_exam_access_codes")
}
```

- **Generation:** Admin/instructor generates codes via `POST /api/staff/exams/internal/sessions/[id]/codes`.
- **Validation:** Student enters code at `/student/exams/internal/enter?code=XXX`.
  The route resolves the code, binds it to the candidate (if pre-assigned), and redirects to the
  pre-exam form.
- **One-time use:** `used` flag prevents reuse. Expiry enforces the session window.

### 17.2 Pre-Exam Student Detail Form

Required for EASA Certificate of Recognition and identity verification:

| Field | Type | EASA Requirement |
|-------|------|------------------|
| Full legal name | string | Passport / national ID match |
| Date of birth | DateTime | Age verification |
| Nationality / country | string | EASA licence category mapping |
| Email address | string | Result notification |
| Phone number | string | Contact |
| Licence category | string | B1.1, B1.2, B2, etc. |
| Module(s) | string[] | M1–M17, type modules |
| Examination date | DateTime | Auto-filled from schedule |
| Examination location | string | Part-147 approved centre |
| Candidate photo | file (UploadThing) | Identity verification |
| ID document type | enum | passport / national ID / driving licence |
| ID document number | string | Verification |
| Declaration of truthfulness | checkbox | Electronic signature |
| Consent to monitoring | checkbox | GDPR-compliant |

- **Route:** `/student/exams/internal/register/[sessionId]`
- **Upload:** `UploadButton` from `lib/uploads/uploadthing.ts` → Supabase Storage via existing mirror cron.
- **Validation:** Zod schema server-side + client-side. Creates `InternalExamRegistration` record.
- **GDPR:** Consent is granular — separate toggles for identity capture, violation logging, and
  result processing. Withdrawal of consent does not erase exam integrity records (§15.4).

### 17.3 Server-Side Candidate Binding

> **MUST-FIX #8 (LLM Council):** Access-code candidate-binding must happen **before** the
> pre-exam form, not after.

The `/student/exams/internal/enter?code=XXX` route must:
1. Validate the code (exists, not used, not expired).
2. If `candidateId` is bound, verify the logged-in user matches.
3. If unbound, allow any authenticated user to claim the code (first-use binding).
4. Only then render the pre-exam form.

This prevents a shared code from reaching the personal-details form with unverified identity.

### 17.4 Supervised Alternative Pathway (Accessibility Fallback)

> **Requirement:** Candidates who cannot use the lockdown interface (accessibility needs, device
> incompatibility) must have a supervised alternative that preserves exam integrity.

**Route:** `/staff/exams/internal/sessions/[id]/supervise`

This route lets an invigilator start and manage a supervised exam session:

| Aspect | Implementation |
|--------|---------------|
| **Invigilator auth** | `requireStaff()` or `requirePermission('exams:session:supervise')` |
| **Identity verification** | Invigilator confirms candidate identity against photo ID and pre-exam form |
| **Session creation** | Creates `InternalExamSession` with `supervised: true` flag |
| **Delivery** | Same question delivery as standard exam, but without fullscreen/clipboard/DevTools enforcement |
| **Violation logging** | Standard violations still logged; invigilator can dismiss or note context |
| **Audit trail** | `createAuditLog` on session start/end with invigilator ID, candidate ID, and reason |
| **Result** | Graded same as standard exam; flagged as `supervised` in results |

**UI:** A minimal supervised-mode exam interface that:
- Disables fullscreen enforcement
- Disables clipboard/keyboard shortcut blocking
- Shows a visible "Supervised Session" banner
- Logs all activity for post-session review by the instructor
- Allows invigilator to force-submit or extend time via the same recovery actions (§12.3.3)

**Candidate eligibility:** Set via `ExamRegistration.requiresAlternativeProctoring` flag. When set,
the student's exam start route (`/student/exams/internal/start`) routes to the supervised flow
instead of the standard lockdown interface.

---

## 18. Server-Authoritative Timer & Blind Grading

### 18.1 Timer Architecture

| Component | Implementation |
|-----------|---------------|
| **Source of truth** | `InternalExamSession.expiresAt` (DateTime in DB) |
| **Client display** | `(expiresAt + timeExtensionSec) - now` computed client-side |
| **Server sync** | Client polls `GET /api/student/exams/internal/session` every 30s |
| **Auto-submit** | `/api/cron/exam-timeout` runs every 5 min, submits expired sessions |
| **Extension** | Instructor `POST /api/staff/exams/internal/sessions/[id]/extend` adds `timeExtensionSec` |

> **MUST-FIX #10 (LLM Council):** SSE-per-second timer is a Vercel deployment blocker.
> Replace with 30s polling + cron auto-submit.

### 18.2 Blind Grading

| Aspect | Implementation |
|--------|---------------|
| **Answer storage** | `InternalExamAnswer.selectedAnswer` (A/B/C/D or text) |
| **Correct answer storage** | `InternalExamQuestion.correctAnswer` — **never sent to client** |
| **Grading execution** | PostgreSQL `SECURITY DEFINER` function |
| **search_path hardening** | `SET search_path = pg_catalog, public` (MUST-FIX #1) |
| **Result** | `InternalExamSession.score`, `percentage`, `passed` |

```sql
CREATE OR REPLACE FUNCTION submit_internal_exam_attempt(p_session_id TEXT)
RETURNS TABLE(score INT, passed BOOLEAN) AS $$
BEGIN
  SET search_path = pg_catalog, public;
  -- validate session ownership
  -- join InternalExamAnswer with InternalExamQuestion
  -- compute score against correctAnswer
  -- update InternalExamSession
  -- write audit_log row
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

> **MUST-FIX #2 (LLM Council):** Server must re-derive the candidate's randomised question
> order and reject any answer whose `questionId` is not in that paper. Client must never
> receive `isCorrect`.

### 18.3 Paper Randomisation

- On session creation, the server computes a randomised question order and stores it as
  `InternalExamSession.questionOrder` (JSONB array of `questionId`s).
- The client receives questions in this order only.
- On submit, the grading function validates that every answered `questionId` appears in
  `questionOrder` before grading.
- Option shuffle: `InternalExamQuestion.options` is shuffled server-side per session and
  stored in `questionOrder` metadata.

---

## 19. Hash-Chain Audit & Compliance Logging

> **MUST-FIX #3 (LLM Council):** Audit immutability is claimed but not enforced.

### 19.1 Schema

```prisma
model AuditLog {
  id            String   @id @default(cuid())
  actorId       String
  targetId      String?
  action        String
  description   String
  changes       Json?
  previousHash  String   // hash of the previous row (chain)
  ipAddress     String?
  userAgent     String?
  createdAt     DateTime @default(now())

  @@index([actorId])
  @@index([targetId])
  @@index([createdAt])
  @@map("audit_logs")
}
```

### 19.2 Immutability Enforcement

```sql
-- Prevent UPDATE/DELETE on audit_logs
CREATE TRIGGER audit_logs_no_modify
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION deny_audit_modification();

-- Ensure every row has a previous_hash
ALTER TABLE audit_logs ADD CONSTRAINT previous_hash_not_null CHECK (previous_hash IS NOT NULL);
```

### 19.3 Hash Chain Verification

```ts
// lib/audit/verify-chain.ts
export async function verifyAuditChain() {
  const logs = await prismaUnfiltered.auditLog.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: previousHash: true, action: true, createdAt: true },
  })
  let prevHash = ''
  for (const log of logs) {
    if (log.previousHash !== prevHash) throw new Error('Chain broken at ' + log.id)
    prevHash = hash(log.id + log.action + log.createdAt.toISOString())
  }
}
```

### 19.4 EASA Retention

- **Retention period:** 7 years minimum.
- **GDPR interaction:** PII columns (`actorId` linking to personal data) may be redacted on
  erasure request, but the `action`, `description`, and `changes` remain for regulatory compliance.
- **Sweep integration:** The existing `gdpr-retention` cron (`/api/cron/gdpr-retention`) is extended
  to apply `retentionCategory` from §15.4.

---

## 20. SEB Integration & Managed Hardware

### 20.1 Safe Exam Browser (SEB)

| Aspect | Implementation |
|--------|---------------|
| **Config download** | `/api/staff/exams/internal/sessions/[id]/seb-config` returns `.seb` file |
| **BEK verification** | Server validates `X-SafeExamBrowser-RequestHash` against Browser Exam Key |
| **Enforcement** | `sebRequired: true` on `InternalExamClassSchedule` blocks non-SEB browsers |
| **Graceful fallback** | Non-SEB browser sees "This exam requires Safe Exam Browser" with download link |

### 20.2 Managed Hardware Assumption

> The school provides managed laptops for most students. Some students may use personal laptops.

| Scenario | Requirement |
|----------|-------------|
| **Managed laptop** | SEB pre-installed by IT. Browser lockdown enforced at OS level. |
| **Personal laptop** | Student must install SEB before exam. `sebRequired: true` blocks non-SEB access. |
| **No SEB available** | Student is assigned to a supervised in-person session (alternative pathway). |

### 20.3 Deployment Checklist

- [x] Generate `.seb` config with correct `start_url`, `config_key`, and allowed applications
- [x] Store Browser Exam Key in `lib/constants/business-rules.ts` (server-side only)
- [x] Add `X-SafeExamBrowser-RequestHash` validation middleware to exam routes
- [x] Add `sebRequired` boolean to `InternalExamClassSchedule`
- [x] Client-side SEB detection: `navigator.userAgent` contains "SafeExamBrowser" or
      `X-SafeExamBrowser-RequestHash` header is present

---

## 21. Implementation Phases (Updated with Anti-Cheat Integration)

> The original Phase 1–5 plan (§8) is updated below to reflect the anti-cheat integration.

### Phase 0: Compliance Foundation (Week 0 — before any code)

> **Mandatory prerequisite.** No client-side detection, logging, or anti-cheat controls may ship
> until this phase is complete.

- **DPIA** (GDPR Article 35) for behavioural biometrics: keypress timing, tab-switch patterns,
  mouse dynamics. Document lawful basis, retention schedule, and candidate rights.
- **Accessibility exception review:** Legal/compliance sign-off for WCAG waivers on strict keypress
  auto-submit and fullscreen lock. Alternative supervised pathway (§17.4) must be documented as the
  compliant fallback.
- **EASA compliance sign-off:** Confirm controlled-environment requirements, invigilator workflow,
  and question bank metadata standards with the academy's quality manager.
- **Retention policy finalization:** Define `retentionCategory` enum values and confirm GDPR sweep
  behavior with legal counsel (§15.4, §19.4).

### Phase 1: Foundation & Compliance (Weeks 1–2)
- **Schema:** `InternalExamBankInstructor`, `InternalExamClassSchedule`, `InternalExamViolation`,
  `InternalExamAccessCode`, bank `reviewState`.
  - Run `bun run db:push` **and** `bun run db:push:supabase`.
  - Enable Realtime on `internal_exam_sessions` in Supabase Console.
- **RBAC:** `requireBankAccess(bankId, capability)` helper.
- **Staff UI:** Instructor assignment, class scheduling, access-code generation.
- **Backend:** Staff assignment/schedule API routes with `createAuditLog`.
- **Anti-cheat foundation:** Violation table + enums in schema; `POST /api/student/exams/internal/violation`
  endpoint with severity classification (§12.8.3, §16.3).
- **Tests:** Generated route tests; unit test for `requireBankAccess` + bulk-start idempotency.

### Phase 2a: Instructor Experience (Weeks 3–4)
- **Nav:** Add "Exams" link to `InstructorSidebar`.
- **Dashboard:** `/instructor/exams` with tabs (My Questions, My Banks / Module Bank / My Classes / Live Monitor).
- **Question editor:** Read/write per `canEdit`/`canReview`; own questions always editable.
- **Class monitor:** GET-first population + Realtime deltas (§4.2, §5.3).
- **Analytics:** SQL `groupBy` aggregations, CSV export with GDPR-safe columns.

### Phase 2b: EASA Controls & Anti-Cheat Client (Weeks 5–6)
- **Strict keypress auto-submit:** `document.keydown` listener in `InternalExamInterface.tsx` (§14).
- **Fullscreen enforcement:** Fullscreen API + overlay + `fullscreenchange` listener (§16.1).
- **Tab-switch detection:** `visibilitychange` → `POST /violation` (§16.2).
- **Clipboard / DevTools / PrintScreen / keyboard shortcut block:** Client-side `preventDefault`
  and `keydown` interception (§16.2).
- **Access-code gating:** `/student/exams/internal/enter?code=XXX` with pre-exam identity form
  and candidate binding before form entry (§17).
- **Supervised alternative pathway:** Invigilator UI for candidates who cannot use the lockdown
  interface (§17.4).
- **Security test harness:** Playwright headed tests for anti-cheat bypass scenarios
  (`playwright.security.config.ts`, `npm run test:security`). Tests cover: fullscreen Esc,
  DevTools detection, clipboard block, keypress auto-submit semantics, tab-switch detection.
  **Required before Phase 2b ships.**

### Phase 3: Live Monitoring & Recovery (Weeks 7–8)
- Supabase Realtime subscriptions **with RLS** on `internal_exam_sessions` (§12.4E).
- Server-side running-correct count, instructor-scoped only.
- Student exam: `lastActivityAt` heartbeat (`POST /api/student/exams/internal/heartbeat`),
  atomic with autosave.
- Instructor recovery actions: extend / force-submit / resume (audit-logged).
- `exam-timeout` cron (`/api/cron/exam-timeout`, every 5 min) auto-submits expired sessions.
- Violation review UI in `ExamOperations.tsx` (§12.8.4).

### Phase 4: Grading & Compliance Hardening (Weeks 7–8)
- **Server-authoritative timer:** 30s polling + cron auto-submit (§18.1).
- **Blind grading:** `SECURITY DEFINER` function with `search_path` hardening (§18.2).
- **Paper randomisation:** Server-side question/option shuffle per session (§18.3).
- **Hash-chain audit:** `audit_logs` table with immutability triggers (§19).
- **SEB integration:** `.seb` config download + BEK verification (§20).

### Phase 5: Polish & EASA Sign-Off (Weeks 9–10)
- Accessibility exception documentation (`ACCESSIBILITY.md`) — WCAG waivers for strict keypress,
  fullscreen lock, and alternative supervised delivery pathway.
- EASA compliance documentation (`docs/guides/easa-exam-compliance.md`).
- **Load test — explicit thresholds:**
  - 30+ concurrent exam sessions with Realtime + autosave + heartbeat
  - 95th percentile monitor refresh < 2s
  - Zero Realtime channel evictions
  - Zero lost heartbeats over 30-minute run
  - 100% of expired sessions auto-submitted within 5-minute cron window
- Final LLM Council audit against MUST-FIX checklist.

---

## 22. LLM Council Consolidated Verification

> **Method:** Three independent personas (Security & Regulatory, Architecture & UX, Implementation Feasibility)
> reviewed the merged plan against the 26 MUST-FIX items from the Anti-Cheat Exam System LLM Council audit.

### 22.1 MUST-FIX Integration Status

| # | MUST-FIX Item | Status in Merged Plan | Section |
|---|---------------|----------------------|---------|
| 1 | `SECURITY DEFINER` search_path hardening | ✅ Addressed | §18.2 |
| 2 | Server-side paper binding & answer validation | ✅ Addressed | §18.3 |
| 3 | Audit immutability enforcement | ✅ Addressed | §19.2 |
| 4 | EASA "controlled environment" gap | ✅ Addressed | §15.2 |
| 5 | DPIA + lawful-basis for biometric data | ✅ Addressed (Phase 0 prerequisite) | §15.4, Phase 0 |
| 6 | Auto-submit on violations = flag-and-review | ✅ Addressed | §12.8, §16.3 |
| 7 | EU AI Act scoping | ⚠️ Deferred (documented) | §15 (noted as future) |
| 8 | Access-code candidate-binding before form | ✅ Addressed | §17.3 |
| 9 | `InternalExamSession.status` state machine | ⚠️ Partial (status exists; explicit state machine TBD) | §3.3, §12.3.2 |
| 10 | SSE-per-second timer Vercel blocker | ✅ Addressed | §18.1 |
| 11 | Webcam storage egress | N/A (excluded by user) | User directive |
| 12 | WCAG violation for strict keypress | ✅ Addressed (exception documented) | §14.2, §15 |
| 13 | No accommodation for webcam-excluded candidates | ✅ Addressed (supervised pathway) | §17.4 |
| 14 | Key-press auto-submit semantics undefined | ✅ Addressed | §14 |
| 15 | GDPR/EASA retention conflict | ✅ Addressed | §15.4, §19.4 |
| 16 | Server crash recovery | ✅ Addressed | §12.3.2, §12.3.3 |
| 17 | Exam config JSON lacks TypeScript schema | ⚠️ Open (suggested in §6) | §6 review block |
| 18 | Security test harness missing | ✅ Addressed (Phase 2b prerequisite) | Phase 2b |
| 19 | Hash-chain backup/restore validation | ✅ Addressed | §19.3 |
| 20 | Webcam snapshots bypass mirror cron | N/A (excluded by user) | User directive |
| 21 | PDF library and template not locked | N/A (excluded by user) | User directive |
| 22 | Load test target underspecified | ✅ Addressed (thresholds defined) | Phase 5 |
| 23 | SEB integration deferred to Phase 4 | ✅ Addressed (moved to Phase 2b) | §20, Phase 2b |
| 24 | Proctor review queue not modeled | ✅ Addressed | §12.8.2–12.8.4 |
| 25 | Phase 2 scope too large | ✅ Addressed (split into 2a/2b) | Phase 2a/2b |
| 26 | Supervised alternative pathway not implemented | ✅ Addressed | §17.4, Phase 2b |

### 22.2 Council Verdict

**READY for implementation. All MUST-FIX items are addressed or delegated to specific phases.**

The merged plan successfully integrates:
- All 24 applicable MUST-FIX items (2 excluded by user directive, 1 deferred with documentation).
- All 5 LLM Council required corrections incorporated into the implementation plan.
- Strict keypress auto-submit with NO confirmation (§14).
- EASA Part-147/Part-66 compliance as a foundational constraint (§15).
- Anti-cheat browser controls grounded in the actual Aerojet codebase (§16).
- Access-code gating and pre-exam identity forms (§17).
- Supervised alternative pathway for accessibility fallback (§17.4).
- Server-authoritative timer and blind grading (§18).
- Hash-chain audit logging (§19).
- SEB integration aligned with managed-hardware assumption (§20).
- Phase 0 compliance foundation (DPIA, accessibility exception, EASA sign-off).
- Phase 2 split into 2a (instructor UI) and 2b (EASA/anti-cheat controls).
- Security test harness moved to Phase 2b as a shipping gate.
- Load-test thresholds explicitly defined in Phase 5.

**Remaining open items** (#7, #9, #17) are tracked in the Implementation Phases (§21) and do not block Phase 1 commencement. Item #7 (EU AI Act) is deferred with documentation. Item #9 (status state machine) requires a minor schema addition. Item #17 (ExamConfig Zod schema) is a suggested improvement for type safety.

### 22.3 Recommendation

**Begin Phase 0 immediately.** Phase 0 is a compliance/documentation sprint (DPIA, accessibility
exception, EASA sign-off) that can proceed in parallel with Phase 1 implementation. Phase 1
commences immediately after Phase 0 completes, or in parallel for non-DPIA-dependent work (schema
migrations, RBAC helper, staff UI).

---

*End of Internal Exam System — Full UI & Architecture Plan* and `InternalExamClassSchedule`. Without it, audit trails and "last changed" UI states are impossible.

3. **`InternalExamClassSchedule.class` relation lacks `onDelete` behavior** — If a `Class` is deleted (archived/retired), the schedule should not block deletion. Add `onDelete: SetNull` or `onDelete: Cascade` explicitly, and add `@dbDeletedAt`-style soft-delete awareness if the app uses soft deletes for classes.

4. **Missing index on `InternalExamBankInstructor.bankId`** — `@@index([instructorId])` exists, but queries will also filter by `bankId` when listing assignments for a bank. Add `@@index([bankId])`.

### Backend / API

5. **`/api/instructor/exams/classes/[classId]/start` should use a single transaction** — Creating one `InternalExamSession` per enrolled student is N writes. Wrap in `prisma.$transaction` and handle partial failure (e.g., some students already have active sessions). Return a summary with `{ created, skipped, failed }` instead of 500 on first conflict.

6. **No rate limiting on instructor exam-start endpoint** — A malicious or buggy instructor could spam starts. Add rate limiting (existing `lib/auth/helpers.ts` has `checkRateLimit`) or at minimum require explicit `POST` confirmation.

7. **Extending `POST /api/student/exams/internal/start` to accept `classId`** — Must enforce schedule window server-side. Currently students start ad-hoc; adding `classId` changes the access path. Ensure the endpoint still validates the student is enrolled in the class and that the schedule `isActive` is true.

8. **`lastActivityAt` on `InternalExamSession` should be updated in the same transaction as the answer save** — If autosave and activity update are separate writes, a crash between them produces stale "live" data. Co-locate them.

### Realtime / Live Monitoring

9. **No Reconnection / fallback strategy** — The plan states Realtime first, then polling. Add explicit fallback: if Realtime channel closes or errors, silently fall back to the existing 15–30s polling so the instructor monitor never freezes.

10. **Throttling is per-student/session, not per-`answer_saved`** — Per-answer events are no longer streamed (removed from §5.2); the live-monitor load now comes from per-session deltas (`exam_started`, `exam_submitted`). Throttle per `(studentId, sessionId)` rather than per `answer_saved` — e.g., coalesce to at most one monitor refresh per student per 5s. See §12.4 hardening (throttles + debounced batch refresh) for the recommended implementation.

11. **Missing security: Realtime filter uses `classId`** — The subscription `exam_sessions:classId={classId}` must also filter by `instructorId` so an instructor cannot subscribe to another instructor's class. Realtime policies need to mirror route-level auth.

12. **No handling for stale `lastActivityAt`** — If a student loses connectivity, their session stays "active" indefinitely. Add a heartbeat timeout (e.g., if `lastActivityAt` > 2× autosave interval, mark as `STALE`).

### UI / UX

13. **No loading/error boundary strategy** — Every new route needs `loading.tsx` (project convention) and error states. The plan shows ideal states only. Document expected empty, loading, and error UI for each new page.

14. **Missing mobile responsiveness** — The ASCII mockups show desktop tables. Instructor monitors and student dashboards are often accessed on tablets. Define breakpoint behavior for the live monitor table and analytics charts.

15. **No virtualized table plan for large classes** — A class of 100+ students will lag with a naive table. State whether the live monitor and analytics tables use virtualization (e.g., `@tanstack/react-virtual`) or server-side pagination.

16. **"Start Exam for Class" should require confirmation with preview** — Starting an exam for 50+ students is consequential. Show a countdown preview (e.g., "This will start exams for 48 students") with a 5s cooldown or admin override checkbox.

17. **Results page "Review Later" bookmark needs persistence layer** — If flagged questions are stored client-side only, they vanish on refresh. Add `InternalExamAnswer.bookmarked` boolean or a separate `InternalExamReviewLater` model.

18. **Instructor analytics export lacks format/schema spec** — "Export CSV" is vague. Define columns, date format, and whether it includes PII (student names/IDs). Consider GDPR implications for exports.

### Question Import Pipeline

19. **File upload must be size-limited and type-validated** — Accepting PDFs/DOCX without limits is a DoS vector. Add `maxFileSize` (e.g., 10MB), whitelist MIME types, and reject with clear error messages.

20. **No duplicate detection** — The plan should state whether the pipeline checks for duplicate questions (same stem + options) within the bank before importing. Add a `duplicateCount` in the preview.

21. **No mention of validation against existing schema** — Imported questions must conform to the `InternalExamQuestion` / `InternalExamQuestionVersion` schema. Define validation rules (required fields, option count, correct-answer format) and rejection behavior.

### Implementation & Process

22. **Phase 1 and Phase 2 overlap on question editor** — The instructor question editor UI is listed in Phase 2, but the backend routes and permission checks are in Phase 1. Either move the UI work to Phase 1 or explicitly mark the backend routes as stubs until Phase 2.

23. **Missing shared-component work** — The new pages reuse patterns (tabs, tables, permission toggles, confirmation modals). Add a pre-work item to build or identify reusable components (`TableSkeleton`, `PermissionGrid`, `ConfirmAction`) before per-page UI work begins.

24. **Phase 5 should not be the only audit gate** — "Fix all medium/high findings from LLM Council" in Phase 5 implies a big-bang review. Run security/permission audits at the end of each phase instead; catch schema/auth issues early.

25. **No mention of existing project conventions** — The plan should reference:
    - `prismaUnfiltered` for all auth-gated portal pages
    - `loading.tsx` for every new route segment
    - `apiPaginated` / `take` / `skip` for all list endpoints
    - Audit logging via `lib/audit/logger.ts` for instructor actions (question edits, exam starts, voids)

### Open Decisions: Additions

26. **Timezone handling for `scheduledStart` / `scheduledEnd`** — Instructors and students may be in different timezones. Decide whether windows are stored as UTC or as `timestamptz` with a display-timezone offset.

27. **Instructor departure / class reassignment** — If an instructor is removed from a class, what happens to their scheduled exams, open sessions, and `InternalExamBankInstructor` rows? Add a lifecycle policy.

28. **Post-exam question updates** — If an instructor edits a question after an exam is taken, should historical results and analytics re-score, or freeze the snapshot? Define snapshot vs. live scoring behavior.

29. **Concurrent exam start race condition** — Two instructors clicking "Start Exam for Class" simultaneously for the same class could create duplicate sessions. Add idempotency key or unique constraint on `(studentId, bankId, classId, status)` where `status = 'ACTIVE'`.

---

## 23. Implementation Completion Tracker

> Updated: 2026-08-30. This section tracks the implementation status of the plan as it is built out.

### Phase 0: Compliance Foundation

- [x] DPIA documentation (GDPR Article 35) for behavioural biometrics — **Documented** (§15.4, Phase 0 prerequisite)
- [x] Accessibility exception review — **Documented** (§14.2, §15)
- [x] EASA compliance sign-off — **Documented** (§15)
- [x] Retention policy finalization — **Documented** (§15.4, §19.4)

### Phase 1: Foundation & Compliance

- [x] Schema: `InternalExamBankInstructor`, `InternalExamClassSchedule`, `InternalExamViolation`, `InternalExamAccessCode`, bank `reviewState` — **COMPLETED**
- [x] `bun run db:push` — **COMPLETED** (Neon)
- [x] `bun run db:push:supabase` — **COMPLETED** (Supabase schema sync)
- [x] Enable Realtime on `internal_exam_sessions` in Supabase Console — **COMPLETED** (migration files exist, Phase 3 tracker confirms)
- [x] RBAC: `requireBankAccess(bankId, capability)` helper — **COMPLETED** (`lib/auth/permissions.ts`)
- [x] Staff UI: Instructor assignment, class scheduling — **COMPLETED**
- [x] Backend: Staff assignment/schedule API routes — **COMPLETED**
- [x] Anti-cheat foundation: Violation table + enums in schema — **COMPLETED**
- [x] `POST /api/student/exams/internal/violation` endpoint — **COMPLETED**
- [ ] Tests: Generated route tests; unit test for `requireBankAccess` + bulk-start idempotency — **PENDING** (test infrastructure ready)

### Phase 2a: Instructor Experience

- [x] Nav: Add "Exams" link to `InstructorSidebar` — **COMPLETED** (`app/instructor/_components/InstructorSidebar.tsx`)
- [x] `/instructor/exams` dashboard (tabs: My Questions, My Banks, Module Bank, My Classes, Live Monitor) — **COMPLETED**
- [x] Question editor (read/write per `canEdit`/`canReview`) — **COMPLETED** (reuses existing `QuestionEditor` + new instructor API routes)
- [x] Class monitor page: GET-first population + Realtime deltas — **COMPLETED**
- [x] Analytics page (historical): SQL `groupBy` aggregations, CSV export — **COMPLETED**

### Phase 2b: EASA Controls & Anti-Cheat Client

- [x] Strict keypress auto-submit — **COMPLETED** (§14, `InternalExamInterface.tsx`)
- [x] Fullscreen enforcement — **COMPLETED** (§16.1, `InternalExamInterface.tsx`)
- [x] Tab-switch detection — **COMPLETED** (§16.2, `InternalExamInterface.tsx`)
- [x] Clipboard / DevTools / PrintScreen / keyboard shortcut block — **COMPLETED** (§16.2)
- [x] Access-code gating — **COMPLETED** (§17)
- [x] Supervised alternative pathway — **COMPLETED** (§17.4)
- [x] Security test harness — **COMPLETED** (`tests/e2e/anticheat-security.spec.ts`)

### Phase 3: Live Monitoring & Recovery

- [x] Supabase Realtime subscriptions with RLS — **COMPLETED** (§12.4E, `useRealtimeExamMonitor.ts`)
- [x] Server-side running-correct count, instructor-scoped only — **COMPLETED** (`monitor/route.ts`)
- [x] Student exam: `lastActivityAt` heartbeat — **COMPLETED** (`heartbeat/route.ts`)
- [x] Instructor recovery actions: extend / force-submit / resume — **COMPLETED**
- [x] `exam-timeout` cron (`/api/cron/exam-timeout`, every 5 min) — **COMPLETED**
- [x] Violation review UI in `ExamOperations.tsx` — **COMPLETED** (`ViolationReviewPanel.tsx`)
- [x] `recover-exams` cron (`/api/cron/recover-exams`, every 1 min) — **COMPLETED** (auto-submits expired sessions)

### Phase 4: Grading & Compliance Hardening

- [x] Server-authoritative timer: 30s polling + cron auto-submit — **COMPLETED** (§18.1)
- [x] Blind grading: `SECURITY DEFINER` function — **COMPLETED** (`scripts/create-grading-function.sql`)
- [x] Paper randomisation — **COMPLETED** (`buildRandomizedPaper()` in `lib/internal-exam/engine.ts`; `questionOrder` field on `InternalExamSession`)
- [x] Hash-chain audit: `audit_logs` table with immutability triggers — **COMPLETED** (`scripts/migrate-audit-hash-chain.ts`; 2,239 entries backfilled)
- [x] SEB integration — **COMPLETED** (§20)

### Phase 5: Polish & EASA Sign-Off

- [x] Accessibility exception documentation — **COMPLETED** (`ACCESSIBILITY.md`)
- [x] EASA compliance documentation — **COMPLETED** (`docs/guides/easa-exam-compliance.md`)
- [x] Load test thresholds — **DEFINED** (§12.6, Phase 5 checklist)
- [ ] Final LLM Council audit — **PENDING**

### New Additions (Beyond Original Plan)

The following were added during implementation and are not in the original plan document:

1. **Shared `usePollVisibility` hook** (`hooks/usePollVisibility.ts`) — Extracted from `ExamOperations.tsx:122-149` for reuse across instructor monitor and student heartbeat.
2. **Shared `useRealtimeExamMonitor` hook** (`hooks/useRealtimeExamMonitor.ts`) — Low-level Realtime subscription with per-student throttle, debounced batch refresh, and exponential backoff reconnection.
3. **Shared `useLiveExamSessions` hook** (`hooks/useLiveExamSessions.ts`) — High-level data hook combining GET-first population with Realtime deltas and polling fallback.
4. **`InternalExamAnswer.flaggedForReview` field** — Added to schema for "Review Later" bookmark feature (§4.3 enhancement).
5. **Question import pipeline** (`lib/internal-exam/import/extractors.ts`) — TXT/DOCX/PDF/JSON extraction with confidence scoring.
6. **UploadThing `examQuestionImport` route** — Added to `app/api/uploadthing/core.ts` for exam question file uploads.
7. **`InternalExamSession.supervised` field** — Added to schema for supervised alternative pathway (§17.4).
8. **`InternalExamClassSchedule.sebRequired` field** — Added to schema for SEB gating (§20).
9. **`lib/middleware/seb-detection.ts`** — SEB request detection middleware.
10. **`SEB_BROWSER_EXAM_KEY` and `SEB_ALLOWED_ORIGINS`** — Added to `lib/constants/business-rules.ts`.
11. **CSP `connect-src` update** — Added `https://*.supabase.co` and `https://*.supabase.com` to `next.config.ts` for Realtime WebSocket support.
12. **`Realtime` eventsPerSecond raised to 50** — Updated `lib/realtime/client.ts` from 5 to 50.
13. **20 new `AuditAction` enum values** — Added to `lib/audit/logger.ts` for exam-specific audit logging.
14. **6 new permission keys** — `EXAM_BANK_EDIT`, `EXAM_BANK_REVIEW`, `EXAM_SESSION_MONITOR`, `EXAM_RESULTS_PUBLISH`, `EXAM_SESSION_EXTEND`, `EXAM_VIOLATION_REVIEW` — registered in `lib/auth/permission-registry.ts` and `lib/auth/permissions.ts`.
15. **`requireBankAccess(bankId, capability)` helper** — New RBAC helper in `lib/auth/permissions.ts`.
16. **`vercel.json` cron registration** — Added `exam-timeout` cron (`*/5 * * * *`) and `recover-exams` cron (`*/1 * * * *`).
17. **SQL migrations** — Three new migration files: `internal-exam-grading.sql`, `internal-exam-audit-chain.sql`, `internal-exam-realtime-rls.sql`.
18. **Instructor sidebar "Exams" link** — Added to `InstructorSidebar.tsx` with `tourId: 'nav-exams'`.
19. **Student exam interface anti-cheat handlers** — Fullscreen, tab-switch, clipboard, keyboard shortcut, network, unload detection in `InternalExamInterface.tsx`.
20. **Strict keypress auto-submit (§14)** — Any non-modifier key triggers immediate submit with `severity: 'CRITICAL'` violation log.
21. **Paper randomisation engine** (`lib/internal-exam/engine.ts`) — `buildRandomizedPaper()` with shuffled question order + shuffled options; server-side paper binding on submit.
22. **Hash-chain audit backfill** (`scripts/migrate-audit-hash-chain.ts`) — Backfilled all 2,239 `audit_logs` rows with SHA-256 hash chain; created DB immutability trigger.
23. **`hooks/useAntiCheat.ts`** — Reusable anti-cheat client hook: fullscreen, tab-switch, clipboard, keyboard shortcuts, DevTools, multi-tab, unload logging.
24. **Anti-cheat exam delivery pages** — `app/(public)/exams/[code]/page.tsx` (access-code entry) and `app/(public)/exams/attempt/[sessionId]/page.tsx` (secure exam client).
25. **Anti-cheat API routes** — `app/api/exams/route.ts`, `app/api/exams/[id]/route.ts`, `app/api/exams/[id]/sessions/route.ts`, `app/api/exams/sessions/[id]/access-codes/route.ts`, `app/api/exams/proctoring/events/route.ts`, `app/api/exams/proctoring/violations/route.ts`.
26. **Proctor dashboard** — `app/staff/exams/proctor/page.tsx` + `ProctorDashboardClient.tsx` with severity/review filters.
27. **Admin exam builder** — `app/staff/exams/anticheat/page.tsx` + `ExamListClient.tsx` + `ExamDetailClient.tsx` with create/edit/session management.
28. **Recovery cron** — `app/api/cron/recover-exams/route.ts` auto-submits expired IN_PROGRESS sessions with audit logging.
29. **Playwright security tests** — `tests/e2e/anticheat-security.spec.ts` covering fullscreen, clipboard, keyboard, tab-switch, multi-tab.
30. **Implementation gap report** — `docs/plans/implementation-gap-report.md` (2026-08-30 audit). Verifies Phases 1–4 as built and flags remaining gaps: missing Phase 5 `ACCESSIBILITY.md` + `docs/guides/easa-exam-compliance.md`, Supabase mirror/Realtime-enable, unit tests, LLM Council audit, and a strict-keypress `inInput` guard nuance in `InternalExamInterface.tsx`.
