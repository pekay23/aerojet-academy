# Internal Exam System UI Plan — Assessment & Suggestions

> Scope: review of `docs/plans/internal-exam-system-ui-plan.md` (the "plan"). This document lists **only improvements and suggestions**. Nothing here has been built.
> Reviewer lens: architecture fit with the existing Aerojet codebase, security, performance, UX, and delivery risk. Every suggestion is grounded in a real file/line so it can be actioned directly.
>
> 📎 **Status:** The plan has been **updated in place** with the fixes below (inline `⚠️ Correction:` / `💡 Suggestion:` blocks, §9 resolved decisions, §11 reconciled status tags, §12 hardening, §8 phase corrections). This file remains the **prioritized companion** — use the §-cross-reference tags in the plan (e.g. `[RESOLVED §X]`, `[OPEN]`) to confirm each item's disposition.

This consolidates the prior `internal-exam-system-ui-plan-REVIEW.md` into a single de-duplicated source of truth, and adds ground-truth-checked gaps not covered there.

---

## A. Security & RBAC (blockers)

### A1. The new per-bank matrix is a second, divergent permission system
The plan invents `InternalExamBankInstructor` bitflags (`canEdit`/`canReview`/`canMonitor`/`canPublish`) but never says how they compose with the project's existing DB-backed RBAC (`requirePermission(key)`, `Permission`/`RoleGrant` in `lib/auth/permissions.ts` + `lib/auth/permission-registry.ts` + `lib/auth/permission-routes.ts`).

**Suggestion:**
- Staff/Examiner continue to be gated by `requirePermission(PERMISSIONS.MANAGE_EXAMS)` (already seeded).
- Instructors are gated **only** by the join row. Introduce a single helper `requireBankAccess(bankId, capability)` that resolves "RBAC global grant OR join-table flag", mirroring `requirePermission`'s ADMIN/SUPER_ADMIN bypass.
- Register the four exam capabilities as seeded `Permission` keys and bind `/api/instructor/exams/*` in `permission-routes.ts` so the audit/permission surface stays one source of truth.

### A2. Examiner vs Instructor scope is undefined
§2 gives Examiner global create/edit/approve; Instructor per-bank/per-class via the join table. The plan never says whether an Examiner also needs a join row.

**Suggestion:** Add a short note to §2: Examiner = staff-side global exam role (handled by RBAC); Instructor = per-class, per-bank scoped via the join table. No Examiner→join-table row needed.

### A3. Supabase Realtime streams ignore Prisma RLS
§5 subscribes to `internal_exam_sessions`, but Supabase Realtime respects **Postgres RLS policies**, and the active Prisma RLS client does **not** protect Supabase WebSocket streams. Without RLS on the streamed table, any authenticated user who guesses a `sessionId`/`classId` can subscribe to another class's live monitor.

**Suggestion:** Define Postgres RLS policies on `internal_exam_sessions` so students see only their own rows and instructors only rows for classes/banks they're assigned. Channel-name scoping is UX only, never the security boundary.

### A4. Channel names are conflated with filters (§5.3)
The plan writes channel names like `exam_sessions:classId={classId}` and `exam_sessions:id={sessionId}`. In this project's pattern (`hooks/useRealtimeMessages.ts:36-43`) the channel name is an arbitrary namespace and **scoping lives in the `postgres_changes` `filter` field** (`recipientId=eq.${...}`). The plan's notation implies channel names enforce scope, which they don't.

**Suggestion:** State explicitly that every subscription pairs a channel namespace with a `filter: 'classId=eq.{...}'` (camelCase — see the Prisma field-name lesson), and that the subscribe callback must re-validate instructor scope server-side on any mutation it triggers.

### A5. New routes/pages must be auth-gated in-handler
CLAUDE.md is explicit: the active edge proxy is **images-only** and does **not** gate `/api/instructor/*` or `/api/staff/*` siblings. Every route in §6 must call `requireInstructor`/`requireStaff`/`requirePermission`; every page must gate in its portal `layout.tsx` (the three-layer pattern).

**Suggestion:** Add a security precondition line to §6: "All routes MUST call the appropriate guard + the join-table capability check; all pages MUST be gated in their portal `layout.tsx`."

### A6. Audit logging is missing for privileged exam mutations
CLAUDE.md mandates `createAuditLog` for every privileged mutation. The plan mentions an "audit log of assignments" UI but does **not** require audit writes for: class-start (bulk session creation), Void, Publish, Regrade, or permission/schedule changes.

**Suggestion:** Extend §6/§8 to require `createAuditLog({ action, description, changes })` for every privileged mutation, reusing `AuditAction` enums and the `description:`/`changes:` field convention (not `metadata:`).

---

## B. Correctness & consistency

### B1. §10's "hardcoded 75%" target is wrong
`app/student/exams/internal/results/[sessionId]/page.tsx:160` already reads `data.passMarkPct ?? 75` (resolved dynamically from the engine). The plan's §10 "immediate fix" is mis-targeted. The genuine hardcoded literal is `app/examiner/results/actions.ts:11` (`const PASS_MARK = 75`), and there's a parallel constant split: `lib/utils/grading.ts:1` (`EASA_PASSING_GRADE = 75`) vs `lib/constants/business-rules.ts:15` (`GRADE_THRESHOLD_PASS: 75`).

**Suggestion:** Retarget §10 at `app/examiner/results/actions.ts`; add a consolidation task to route all pass-mark reads through `InternalExamRuleOverride.passMarkPct` (the per-bank source of truth, schema line 2050) with `ACADEMIC_RULES.EASA_PASS_MARK` as fallback.

### B2. Instructor "Publish results" contradiction
§2 matrix: Instructor publish = ❌. §3.1: `canPublish` exists. §4.1: Staff toggles `canPublish` on instructors. §9.4 discusses publishing. Three of these contradict the matrix.

**Suggestion:** Resolve in §9 — either instructors can never publish (drop `canPublish`) or the matrix row becomes ✅ conditional. Make §2, §3.1, and §4.1 agree.

### B3. `instructorId` reference is ambiguous
§3.1 comment: "references `InstructorProfile.id` or `User.id`". The codebase is unambiguous: `Class.instructorId → InstructorProfile.id` (schema line 478), and instructors are a profile, not the bare `User`.

**Suggestion:** Pin `InternalExamBankInstructor.instructorId` → `InstructorProfile.id` with an explicit `@relation`.

### B4. `answer_saved` event is both specified and ruled out
§5.2 lists `answer_saved` as a streamed event; §5.3 says "No per-answer streaming during the exam (too noisy)."

**Suggestion:** Delete `answer_saved` from §5.2 (or footnoted as future/s optional). Monitor per-answer freshness comes from `lastActivityAt` polling only.

### B5. `liveScore` semantics are inconsistent
§3.3: `liveScore` "updated on submit." §5.3/Phase 3: "Live score approximation (running correct count)" during the exam. `InternalExamSession` already stores `score`/`totalPoints`/`percentage`/`passed` (schema lines 2077-2080).

**Suggestion:** Clarify `liveScore` is **on submit only**; the in-exam running count is computed server-side from answers vs correct answers and never persisted. Name it distinctly to avoid colliding with the authoritative graded fields.

### B6. `lastActivityAt` may be redundant with `updatedAt`
If autosave issues a session `update`, `updatedAt` already moves on every save — `lastActivityAt` adds a column only if autosave avoids bumping `updatedAt` (to cut audit/replication churn).

**Suggestion:** Decide explicitly: reuse `updatedAt` for the live pulse, **or** use a dedicated `lastActivityAt` via a touch that does **not** bump `updatedAt`. Recommend the dedicated column + a single aggregated touch (see C1), not a per-answer update.

### B7. Single schedule per (bank, class) is too rigid
`@@unique([bankId, classId])` allows exactly one window per class. Instructors commonly run multiple sittings (resits, practice vs graded).

**Suggestion:** Either document this as intentional (one active graded window, others separate banks) or allow multiple schedules with an `isActive` selector. Resolve in §9.

### B8. Class-start conflicts with the single-attempt block
Class-start pre-creates one `InternalExamSession` per enrolled student. The existing student `start` route (`app/api/student/exams/internal/start/route.ts:88-124`) creates the session on student action and calls `selectInternalExamQuestions` (`:135`) + `checkEligibility`. Two session-creation paths must agree, or a student gets a duplicate / the single-attempt rule breaks.

**Suggestion:** Class-start must create `NOT_STARTED` placeholder sessions that the student `start` route **reuses** (status guard + eligibility re-check), so `selectInternalExamQuestions` still runs exactly once per attempt and retake/void logic holds.

### B9. "Send Reminder" is underspecified — a Notification path already exists
§4.2 lists "Send Reminder (toast notification if messaging exists)." The project has a `Notification` model (`schema.prisma:1053`) with `sentBy`, `linkUrl`, `type`, and Realtime streaming to the student portal.

**Suggestion:** Specify the exact behavior: write a `Notification` row (instructor-scoped, audit-logged) rather than a toast. This survives tab closure and surfaces in the student's inbox + bell. Avoid a dead button in v1.

---

## C. Performance & scale

### C1. Autosave write volume under class-start
"Autosave every 15s per student" across a full class (28–50 students) is a write storm to `internal_exam_answers` + `lastActivityAt`.

**Suggestion:** Debounce/batch autosave client-side (flush on change + idle, cap frequency); use a single aggregated `lastActivityAt` touch rather than a row per answer. Note the expected peak write rate in §5 so the DB adapter choice (Neon WS vs pg pool, `lib/prisma/db-base.ts`) is reviewed.

### C2. Bulk start needs idempotency + per-student status
Creating N sessions simultaneously must handle: students already holding an active/in-progress session, dropped enrollments, and partial failure mid-batch.

**Suggestion:** Transactional bulk insert + a pre-check that skips/warns for students with an existing session; return a per-student status report. Tie to audit logging (A6).

### C3. New list endpoints must paginate + parallelize
CLAUDE.md mandates pagination on every list API and `Promise.all` for independent queries. The new `GET` endpoints (questions, sessions, analytics, assignments, schedules) are list endpoints.

**Suggestion:** Every list route uses `apiPaginated` (`lib/api/response.ts`) with `take`/`skip`. The existing `take: 200` truncation (see project memory `pagination.take_200_truncation`) causes silent truncation in student exams/instructor grades — don't repeat it. Analytics must `Promise.all` independent aggregations and cache read-heavy aggregates with `unstable_cache` (`lib/cached-queries.ts`).

### C4. CSV export bounds
§4.2 analytics offers "Export CSV" with a 30-day range — unbounded ranges could stream large payloads.

**Suggestion:** Cap export window + max rows server-side, generating from authorized data only (mirror the existing export routes' auth pattern).

### C5. Class-start is N+1 by default
Selecting all enrolled students for a class then creating a session each is N sequential writes.

**Suggestion:** Use a single transactional bulk insert (`createMany` from an enrollment subquery), not a per-student loop.

---

## D. Architecture fit & reuse (avoids rework)

### D1. Instructor class listing already exists
§6.1 proposes `GET /api/instructor/exams/classes`, but `lib/actions/instructor.ts:43` (`classes: { some: { instructorId } }`) and `:707` (`classesInstructed: { include: { course: true } }`) already provide exactly this.

**Suggestion:** Don't add a parallel endpoint. Reuse the existing server action/relation for the "My Classes" tab.

### D2. Reuse the established polling pattern
`ExamOperations.tsx:122-149` and `InternalExamDashboard.tsx:94-119` both implement visibility-aware 30s polling with tab-pause + immediate refresh on refocus. The instructor monitor should reuse this exact pattern (not invent a new poll).

**Suggestion:** Extract the visibility-aware poll into a shared hook (`usePollVisibility`/`useLiveRefresh`) and reuse across staff operations, student dashboard, and instructor monitor.

### D3. Reuse shared components
§4 should call out reuse of `components/shared` primitives (`DashboardSkeleton`, `TableSkeleton`, `Logo`, `FileField`, `ConfirmModal`) and the established dashboard card pattern. Every new data-fetching route must ship a `loading.tsx` (CLAUDE.md §3).

### D4. Realtime fallback parity
The messages hook falls back to 20–60s polling when Supabase is unconfigured (`useRealtimeMessages.ts:33-34`). The instructor monitor must do the same: Realtime primary, 30s polling fallback, so dev/CI works without Supabase.

---

## E. Data model suggestions (§3)

### E1. Consider extending `InternalExamRuleOverride` for windows
§3.2 introduces `InternalExamClassSchedule`. Scheduled start/end are exam *rules*; `InternalExamRuleOverride` is already per-bank and already feeds `lib/internal-exam/engine.ts` (`getBankRules`).

**Suggestion:** Prefer extending `InternalExamRuleOverride` with `scheduledStart`/`scheduledEnd`/`allowLateStart` (reuses the override-resolution + `ruleSet`/`categoryConfig` path). Keep the class-schedule table only if per-class windows must differ from bank-level.

### E2. Question selection timing for class-start
`selectInternalExamQuestions` runs server-side at student start (`:135`). Class-start pre-creating sessions needs a decision on **when** the 40-question pool is selected and attached.

**Suggestion:** If class-start pre-creates sessions, call `selectInternalExamQuestions` at class-start time and persist the selected question IDs (so all students in the sitting get a consistent pool), or defer selection to per-student start and document which. §4.2's "Start Exam for Class" should state this explicitly.

### E3. Migration + mirror + Realtime-enablement steps
Project uses `db:push` (no migration history) and Supabase logical-replication mirroring.

**Suggestion:** Add explicit Phase-1 steps: (a) `bun run db:push`; (b) `bun run db:push:supabase` to re-mirror schema; (c) enable Realtime on `internal_exam_sessions` in the Supabase Console (mirror the `messages` table setup) and add it to the replication publication. (See CLAUDE.md storage/sync runbook.)

---

## F. Question import pipeline (§7)

### F1. Use UploadThing, not a custom multipart route
The plan implies a custom file endpoint. The project standard is UploadThing (`lib/uploads/uploadthing.ts`, `UploadDropzone`/`UploadButton`).

**Suggestion:** File lands in UploadThing → server action fetches + extracts. Don't introduce a raw multipart API route.

### F2. Extraction deps are heavy / unmaintained
`pdf-parse`/`docx`/`mammoth`/`pdfjs-dist` are heavyweight for serverless. `pdf-parse` is effectively unmaintained.

**Suggestion:** Lazy-import (`await import(...)`) extraction in the API route; mark `server-only`. Prefer `unpdf` or `pdfjs-dist` v4 over `pdf-parse`. Keep extraction out of the client bundle (risk: `output: 'standalone'` build).

### F3. Route low-confidence questions into the existing review workflow
`InternalExamQuestion` already has `status` (`DRAFT`/`PENDING_APPROVAL`/`APPROVED`/`REJECTED`), `reviewNote`, `reviewedById`, and an approval queue (`app/api/staff/exams/internal/questions/[questionId]/review/route.ts`).

**Suggestion:** Low-confidence parsed questions land as `QuestionStatus.DRAFT` and flow into the existing approval queue, not a bespoke preview page.

### F4. EASA-standard format
§9 #5 recommends EASA-format support. The plan should add a JSON schema keyed to EASA question-bank shape and validate it in the extraction service.

---

## G. UX, accessibility & navigation

### G1. Color-only signals need non-color fallbacks
§4.2 uses green/amber/red progress bars and status pills. Colorblind users can't distinguish them.

**Suggestion:** Add text/icon labels alongside color (e.g. "Low 32%", a glyph). Bake in at build, not Phase 5 — per project `fixing-accessibility` standards.

### G2. Reuse business-rule constants for thresholds
§4.2 hardcodes "green (>75%), amber (50–75%), red (<50%)". `lib/constants/business-rules.ts:15-16` already defines `GRADE_THRESHOLD_PASS: 75` and `GRADE_THRESHOLD_WARNING: 50`.

**Suggestion:** Use those constants so coloring stays in lock-step with business rules.

### G3. Mobile/responsive for monitor & analytics
§4.2 ASCII layouts are wide desktop tables. Instructors monitor from tablets.

**Suggestion:** Card stack on tablet; status filter as a bottom sheet; summary cards wrap. Matches CLAUDE mobile guidance.

### G4. New pages need nav + tour links (convention)
Per project convention, every new page needs a discoverable nav entry. §4.2 adds `/instructor/exams/*` routes but doesn't wire the instructor sidebar.

**Suggestion:** Add an "Exams" entry to `InstructorSidebar` (`app/instructor/_components/InstructorSidebar.tsx`) and ensure the new instructor layout follows the `data-tour-id='topbar-tour-trigger'` topbar-tour convention (CLAUDE.md `tour.trigger_convention`). Staff bank detail gains the "Instructor Access" / "Class Scheduling" tabs.

### G5. "Review Later" bookmark needs storage
§4.3's flag should survive the publish boundary.

**Suggestion:** A `flaggedForReview` column on `InternalExamAnswer` (or session-scoped JSON), not client-only state.

---

## H. Delivery & test risk

### H1. Phase 1 should ship a testable permission gate
Phase 1 builds schema + staff UI + backend, but instructors can't act until Phase 2. The permission model is the riskiest piece.

**Suggestion:** In Phase 1, also ship `requireBankAccess` + one guarded read endpoint so the RBAC/join-table composition (A1) is proven before the full UI lands.

### H2. Generated test coverage for new API routes
The project auto-generates API route tests (254 files, per project memory `api-audit-type-check-status-2026-08-29`; pipeline via `scripts/list-routes-to-test.mjs`). New §6 routes need test coverage to satisfy the pre-push Vitest gate.

**Suggestion:** Run the test generator after each new route; add unit/integration coverage for the extraction confidence scoring, `requireBankAccess`, and the start/void/publish handlers. Note the Windows runner caveat (project memory `windows_test_timeout`): foreground `bun run test` aborts with a `ChildProcess.kill` error here — verify with `bun run test --run --no-file-parallelism --no-color` in the background runner.

### H3. Instructor void must reuse existing void logic
§4.2 "Void (allow retake)" must clear the single-attempt block the same way the existing `app/api/staff/exams/internal/operations/void/route.ts` does (sets `voidedAt`/`voidedBy`, clears attempt gating) — not fork a divergent copy.

**Suggestion:** Have the instructor monitor call the existing `operations/void` route (guarded by the join-table `canMonitor` capability) rather than reimplementing session voiding. Note the Windows runner caveat (project memory `windows_test_timeout`): foreground `bun run test` aborts with a `ChildProcess.kill` error here — verify with `bun run test --run --no-file-parallelism --no-color` in the background runner.

### H3. Instructor void must reuse existing void logic
§4.2 "Void (allow retake)" must clear the single-attempt block the same way the existing `app/api/staff/exams/internal/operations/void/route.ts` does (sets `voidedAt`/`voidedBy`, clears attempt gating) — not fork a divergent copy.

**Suggestion:** Have the instructor monitor call the existing `operations/void` route (guarded by the join-table `canMonitor` capability) rather than reimplementing session voiding.

### H4. Realtime latency needs a verification spike
§5 assumes exam monitoring can piggyback on Neon→Supabase logical replication. Logical replication has non-zero lag; a live monitor has stricter freshness needs than the messages feature.

**Suggestion:** Add a Phase-3 spike to measure Realtime latency from a Neon-origin write and confirm it meets the "live" bar; keep 30s polling as the documented fallback if it doesn't.

### H5. Resolve §9 open decisions before schema work
§9 has five open decisions, several changing the schema (`canPublish`, schedule rigidity, instructor bank creation). Building schema in Phase 1 while these are open risks rework.

**Suggestion:** Resolve §9 (or adopt the stated recommendations as defaults) and fold outcomes back into §2/§3 before Phase 1 starts.

### H6. Staff monitoring capability narrowing
§2 sets Staff "Monitor live exams (all)" = ❌, but current `ExamOperations` gives staff monitoring, and §6.3 adds an `instructorId` filter (implying scoped staff queries).

**Suggestion:** Call out this deliberate capability narrowing in §2 and document the migration/communication path.

---

## Priority order (if reviewing before build)

**Correctness blockers:** B1 (wrong §10 target), B8 (single-attempt conflict), C3 (pagination/truncation), E2 (question-selection timing), A3+A4 (Realtime security + scoping).
**Architecture debt:** A1 (parallel RBAC), E1 (rule-override reuse), A6 (audit logging), D1 (reuse existing class listing).
**Convention compliance:** D2/D3/D4 (polling/Realtime fallback/shared components/loading.tsx/tour), F1 (UploadThing), H2 (tests), E3 (db:push + mirror + Realtime enable).
**Polish:** G1/G2/G3 (accessibility/thresholds/mobile), B2/B3/B4/B5/B6/B7 (consistency), F2/F3/F4, G4/G5, H3/H4/H5.

---

No code was changed. This document is review-only.
