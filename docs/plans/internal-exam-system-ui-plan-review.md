# Internal Exam System UI Plan — Review & Suggestions

> Companion to `docs/plans/internal-exam-system-ui-plan.md`.
> Status: **review only — nothing built.** Each item notes the plan section it affects and, where relevant, the actual file/line that grounds it.

---

## A. Factual corrections (plan is partly wrong)

1. **"Hardcoded 75% pass mark in results UI" (§10, fix #1) is inaccurate.**
   `app/student/exams/internal/results/[sessionId]/page.tsx:160` already reads `data.passMarkPct ?? 75` — that value is resolved dynamically from the session/engine, *not* hardcoded. The genuine hardcoded literals are:
   - `app/examiner/results/actions.ts:11` → `const PASS_MARK = 75`
   - `lib/compliance/reports.ts:95` → `EASA_PASSING_GRADE` (a *different* constant name than `ACADEMIC_RULES.EASA_PASS_MARK` in `lib/constants/business-rules.ts:12`).
   **Fix the plan:** retarget the "immediate code fix" at the examiner action, and add a consolidation task to route all pass-mark reads through `InternalExamRuleOverride.passMarkPct` (already the per-bank source of truth) with `ACADEMIC_RULES.EASA_PASS_MARK` as fallback.

2. **Instructor auth guard already exists.** `requireInstructor()` is defined at `lib/auth/helpers.ts:152` (and `requireExaminer()` at `:191`). §6.1 should reference these helpers rather than implying permission infra is built from scratch.

3. **`Class` already owns its instructor.** `Class.instructorId` is in the schema (references `InstructorProfile`) and is used elsewhere. The "My Classes" tab (§4.2) can query `Class.where({ instructorId })` directly — no need to re-derive class→instructor ownership.

4. **Module/course linkage already exists.** `InternalExamBank.courseId` + `moduleCode` already capture module/course. The instructor-assignment UI can join `bank → course → classes → instructor` through existing relations; §3.1/§4.1 should say so.

---

## B. Schema / data-model suggestions

5. **`instructorId` reference is ambiguous (§3.1).** The comment says "references `InstructorProfile.id` or `User.id`." The codebase consistently maps `instructorId` → `InstructorProfile.id` (schema lines ~1853, 1905, 1922, 2302). Pick one explicitly — recommend `InstructorProfile.id` for consistency with `Class.instructorId`.

6. **`liveScore` collides with existing `score`/`percentage` (§3.3).** `InternalExamSession` already stores `score`, `totalPoints`, `percentage`, `passed`. A pre-submit running tally is legitimately new, but name it distinctly (e.g. `runningCorrectCount` / `runningPercentage`) and document it as a monitor-only, server-computed field. `score`/`percentage` remain the authoritative graded result post-submit.

7. **`lastActivityAt` may be redundant with `updatedAt` (§3.3).** If autosave issues an `update` on `InternalExamSession`, `updatedAt` already moves on every save. Decide explicitly: either rely on `updatedAt` for the live pulse, or make autosave touch a dedicated `lastActivityAt` via a query that does **not** bump `updatedAt` (avoids replication/audit churn). Recommend the dedicated, `updatedAt`-free column.

8. **Reuse `InternalExamRuleOverride` for windows (§3.2 / §9 #2).** Scheduled start/end are exam *rules*. `InternalExamRuleOverride` is already per-bank and already feeds `lib/internal-exam/engine.ts` (passMark, time, retakes). Prefer extending it with `scheduledStart` / `scheduledEnd` / `allowLateStart` instead of a separate `InternalExamClassSchedule` table — smaller schema surface and reuses the override-resolution path. If class-level windows must differ from bank-level, keep the table but resolve it through the same engine.

9. **Migration + mirror steps missing (§8 Phase 1).** Project uses `db:push` (no migration history) and Supabase logical-replication mirroring. After adding models, Phase 1 must call out: (a) `bun run db:push`, (b) `bun run db:push:supabase` to re-mirror the schema, (c) enabling Realtime on the new tables (see #11).

---

## C. Realtime / live-monitoring gotchas

10. **Realtime throttle: `eventsPerSecond: 5` (`lib/realtime/client.ts:28`).** "Start Exam for Class" creates one `InternalExamSession` per enrolled student — a 30-student class fires 30 INSERTs at once, over the 5/sec cap; Supabase will drop/throttle them. Mitigate: GET-first population of the monitor table + Realtime only for *subsequent* deltas (start/submit/void/publish). Don't rely on per-row INSERT replay for initial fill.

11. **Realtime must be explicitly enabled on the new tables.** Per CLAUDE.md, the `messages` table had to be manually switched to Realtime, or the subscription silently matches nothing. The `internal_exam_sessions` subscription won't work until Realtime is enabled on that table **and** it's in the replication publication. Also: the channel filter must use the exact camelCase column `classId` (per the realtime filter gotcha), not `class_id`. Add as an explicit step.

12. **`answer_saved` is listed but unused (§5.2 vs §5.3).** §5.2 enumerates an `answer_saved` event; §5.3 explicitly says no per-answer streaming. Remove `answer_saved` from §5.2 (or repurpose it as a student-side autosave receipt only) to avoid the inconsistency.

13. **Live running-count must stay server-side (§5.2 / §9 #3).** Computing "Z correct" requires `InternalExamAnswer.selectedAnswer` vs `InternalExamQuestion.correctAnswer`. Ensure the running count is computed server-side and never shipped to the student client. The student interface subscribes only to void/publish exam-level changes (already noted — good); add a guard/test that the per-question stream is instructor-scoped.

---

## D. Permissions / RBAC integration (important)

14. **Second parallel permission system.** The plan invents `InternalExamBankInstructor` with `canEdit / canReview / canMonitor / canPublish` bitflags — a bespoke matrix — while the project already has a DB-backed RBAC registry (`Permission` / `RoleGrant` / `requirePermission`, `lib/auth/permission-registry.ts`). Recommend modeling the four capabilities as seeded `Permission` keys (`exam.bank.edit`, `exam.bank.review`, `exam.bank.monitor`, `exam.bank.publish`), scoping `RoleGrant`s to `USER:<instructorId>` with `bankId` in metadata — or, at minimum, document *why* the bespoke table is necessary and how it coexists with `requirePermission`. Two sources of truth for "can this user do X" is a maintainability risk.

15. **Audit logging is missing (conventions).** Every privileged mutation must write via `lib/audit/logger.ts` (`createAuditLog` + `AuditAction`). §4.1 mentions an "audit log of assignments" *UI* but doesn't require `createAuditLog` writes for: instructor assignment changes, schedule create/update/delete, void, publish, and class-start. Add explicit audit-log steps to Phases 1–3.

---

## E. API / backend conventions

16. **Use `prismaUnfiltered` + explicit `instructorId` filters.** Per performance conventions, instructor pages are auth-gated; use `prismaUnfiltered` (not the RLS client) and filter by `instructorId` / `class.instructorId`. State this in §6.1 route handlers.

17. **Paginate monitor & analytics lists (§6.1).** `GET .../sessions` and `.../analytics` can return large sets (students × attempts). Add `take`/`skip` + `apiPaginated` per API conventions. The "take: 200 truncation" memory warns of silent truncation otherwise; the Live Monitor and analytics tables both need pagination (or infinite scroll).

18. **Class-start vs single-attempt enforcement (§4.2 / §6.1).** Creating an `InternalExamSession` for every enrolled student preemptively interacts with the single-attempt block (`attemptNumber`, void-to-retake, and the existing `app/api/student/exams/internal/start` route which creates the session on student action). Clarify: class-start should create `NOT_STARTED` placeholder sessions that the student `start` route *reuses* (status guard), so a student never gets a duplicate and retake/void logic still holds.

---

## F. Question import pipeline

19. **Use UploadThing, not a custom multipart endpoint (§7).** File uploads in this project go through UploadThing (`lib/uploads/uploadthing.ts`, `UploadDropzone`/`UploadButton`). Align the import flow: file lands in UploadThing, then a server action fetches + extracts. Avoid introducing a new raw multipart API route.

20. **Dependency / serverless concerns (§7.1).** `pdf-parse` / `pdfjs-dist` / `mammoth` / `docx` are heavyweight. In the `output: 'standalone'` build, keep extraction in an API route, mark it `import 'server-only'`, and lazy-import (`await import(...)`) to protect cold-start. Note `pdf-parse` is effectively unmaintained — consider `unpdf` or `pdfjs-dist` v4.

21. **Route low-confidence questions into the existing review workflow (§7.3).** `InternalExamQuestion` already has `status`, `reviewNote`, `reviewedById`. Low-confidence parsed questions should land as `QuestionStatus.DRAFT` and flow into the existing approval queue (`/questions/[questionId]/review`) rather than a separate bespoke preview page.

---

## G. UI / UX / responsive

22. **No responsive/mobile design for monitor & analytics.** Instructors often monitor from tablets. The §4.2 ASCII layouts are wide desktop tables. Add responsive behavior: card stack on tablet, status filter as a bottom sheet, summary cards wrap. (Matches CLAUDE mobile guidance.)

23. **Progress thresholds are hardcoded literals (§4.2).** "green (>75%), amber (50–75%), red (<50%)" duplicates `ACADEMIC_RULES.GRADE_THRESHOLD_PASS` / `GRADE_THRESHOLD_WARNING` (75/50). Use those constants so coloring stays in lock-step with business rules.

24. **"Review Later" bookmark persistence (§4.3).** Flagging questions to revisit needs storage that survives the publish boundary (student sees it post-results). Recommend a `flaggedForReview` column on `InternalExamAnswer` (or session-scoped JSON), not client-only state.

25. **Instructor void must reuse existing void logic (§4.2 / §10 #2).** "Void (allow retake)" should clear the single-attempt block the same way `operations/void` does (sets `voidedAt`/`voidedBy`, clears `attemptNumber` gating). Reuse `operations/void`, don't fork a divergent copy.

---

## H. Cross-cutting / missing

26. **Role-matrix behavior change isn't flagged (§2).** §2 sets Staff "Monitor live exams (all)" = ❌, but current `ExamOperations` gives staff monitoring, and §6.3 adds an `instructorId` filter to `operations/sessions` (implying staff queries become scoped). Call out that this is a deliberate capability narrowing requiring migration/communication.

27. **`loading.tsx` required for every new page (conventions).** New `/instructor/exams/*` and `/staff/exams/internal/banks/[bankId]/*` pages must each ship a `loading.tsx` (reuse `TableSkeleton` / `DashboardSkeleton`). Add to the phases.

28. **Realtime fallback when Supabase is unconfigured (CLAUDE.md).** The messages hook falls back to 20–60s polling without env vars. The monitor must do the same: Realtime primary, polling fallback. The plan already polls every 15s — keep that as the documented fallback so dev/CI works without Supabase.

29. **AppTour convention for the new instructor topbar.** All five portal topbars use `data-tour-id='topbar-tour-trigger'`. The new instructor portal layout should follow the same tour trigger convention.

30. **Test plan gaps (§8 Phase 5).** Add unit tests for override-engine window enforcement and for the import extraction confidence scoring; E2E for instructor flows is good. Note the Windows runner caveat: run Vitest with `--no-file-parallelism --no-color` (foreground `bun run test` aborts with `ChildProcess.kill` here).

---

## Priority order if reviewing before build

- **Correctness blockers:** #1 (wrong "immediate fix"), #10 (Realtime throttle), #11 (Realtime not enabled), #18 (single-attempt conflict).
- **Architecture debt:** #14 (parallel RBAC), #8 (rule-override reuse), #15 (audit logging).
- **Convention compliance:** #16, #17, #19, #27, #28.
- **Polish:** #5–#7, #12, #13, #20–#25, #26, #29, #30.
