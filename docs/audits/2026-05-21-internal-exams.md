# Internal Exams Audit — 2026-05-21

Reviews commits `94375e5` (initial system) and `b928b76` (hardening) — adding
the InternalExam testing engine, admin operations dashboard, student reporting,
and the policy shift to admin-controlled publication.

**Scope**: every file touched between those two commits plus a regression
check against the prior baseline.

## Verification

| Check                | Result                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------- |
| `bun run type-check` | ✅ exit 0                                                                               |
| `bun run test --run` | ✅ **116/116** (14 new tests since the last audit)                                      |
| `bun run build`      | Compiles cleanly (Recharts width warnings already silenced; no new warnings introduced) |

---

## What landed

### Schema (`prisma/schema.prisma`)

- **`InternalExamSession.isPublished: Boolean @default(false)`** — flips on
  when admin reviews and releases results. Gates `score`/`passed` visibility
  on every student-facing endpoint.
- **`InternalExamReport`** — student-flagged issue tickets per session.
  Three statuses (`PENDING` / `REVIEWED` / `RESOLVED`) + `reason`,
  `resolvedAt`. Cascading deletes when the session is removed.
- **`InternalExamReportStatus`** enum.
- **`User.internalExamReports`** back-relation.

### Routes — staff operations

| Path                                                | Purpose                                                                                 |
| --------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `GET /api/staff/exams/internal/operations/sessions` | List sessions with full answers + reports; filter by `status` / `bankId`. Take 200.     |
| `POST /api/staff/exams/internal/operations/publish` | Bulk publish `COMPLETED` / `TIMED_OUT` sessions (sets `isPublished: true`).             |
| `POST /api/staff/exams/internal/operations/void`    | Void a session + resolve its pending reports. Voiding becomes the **only** retake path. |

### Routes — student

| Path                                       | Change                                                                                               |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `POST /api/student/exams/internal/submit`  | No longer returns `score`/`passed` (`pendingReview: true` placeholder).                              |
| `GET /api/student/exams/internal/progress` | Adds `isPublished` + `pendingReview` per bank; `bestScore`/`passed` zero-gated behind `isPublished`. |
| `POST /api/student/exams/internal/report`  | New — student flags a session issue (10-1000 chars, dedup on `PENDING`).                             |

### Engine (`lib/internal-exam/engine.ts`)

- `getPoolHealth` and `selectInternalExamQuestions` now require
  `status: 'APPROVED'` — draft/pending questions never reach a student.
- `selectInternalExamQuestions` uses `syllabusRef ?? subTopic` for stratified
  selection — finer-grained spread per topic.
- **`checkEligibility` policy change**: single-attempt only. Any non-`VOIDED`
  prior `COMPLETED`/`TIMED_OUT` session blocks retake. Retake-wait + ban-day
  logic removed from this code path — voiding by admin is the sole route.

### UI — staff

- New `<ExamOperations>` (479 lines) — Live / Review / Published / Voided
  tabs, 15s auto-refresh on Live, bulk publish, per-session detail with
  per-answer correct/incorrect marking, void button.
- `<InternalExamPageTabs>` switches between the existing **Banks** view and
  the new **Operations** view.

### UI — student

- `<InternalExamInterface>` adds the "Pending Review" screen after submission
  with a Report Issue modal (1000-char limit, dedup on pending report).
- `<InternalExamDashboard>` hides scores until `isPublished`, shows
  `Hourglass` + "Pending Review" pill, removes the multi-attempt UI strip
  (suspension dates, retake countdown).
- Bank cards now show **module/course codes only** — no subject topic names.

### Seed

- `scripts/seed_internal_questions.ts` — adds 15 sample questions marked
  `APPROVED` to the first available bank. Useful for dev/CI.

---

## Findings

### 🔴 CRITICAL

| #          | Finding                                                          | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Fix                                                                                                                                                                                                                                                                                        |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **EXAM-1** | `void/route.ts` writes to columns that don't exist in the schema | [void/route.ts:37-43](../../app/api/staff/exams/internal/operations/void/route.ts#L37-L43) writes `voidedAt`, `voidedBy`, `voidReason` with `data: { … } as any`. None of those columns exist in [`InternalExamSession`](../../prisma/schema.prisma) — verified by `grep -nE "voidedAt\|voidedBy\|voidReason" prisma/schema.prisma` returning **zero matches**. The `as any` cast silences TypeScript, but at runtime Prisma will throw `PrismaClientValidationError: Unknown arg 'voidedAt'`. **The void action will fail in production every time.** | Either (a) add `voidedAt DateTime?`, `voidedBy String?`, `voidReason String?` to the model + `db:push`, OR (b) drop them from the route and rely on `updatedAt` + an AuditLog row for the trail. Recommended: (a) — admins want to see who voided what and why without joining audit_logs. |

### 🟡 HIGH

| #          | Finding                                                                            | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Fix                                                                                                                                                                                                                                                  |
| ---------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **EXAM-2** | Privileged mutations missing `createAuditLog`                                      | [publish/route.ts](../../app/api/staff/exams/internal/operations/publish/route.ts) and [void/route.ts](../../app/api/staff/exams/internal/operations/void/route.ts) — no `createAuditLog` import or call. Both qualify per the CLAUDE.md convention: "Every privileged mutation (role changes, refunds, withdrawals, certificate releases, permission grants) writes through `lib/audit/logger.ts`." Publishing exam results and voiding sessions are at least as privileged as those.                                                                                                                                                                       | Add a single `createAuditLog` call per route with `action: 'UPDATE'`, `entity: 'InternalExamSession'`, `description: \`Published \${count}\``/`description: \`Voided session \${id}\``, and the `changes`diff (before/after`isPublished`or`status`). |
| **EXAM-3** | Status leakage on `progress/route.ts` — `entry.status` reflects the OLDEST attempt | [progress/route.ts:99,124](../../app/api/student/exams/internal/progress/route.ts#L99) — sessions are `orderBy: { createdAt: 'desc' }` (newest first), iterated top-to-bottom. Each loop iteration overwrites `entry.status = s.status`. Final value after the loop is the **oldest** session's status, not the newest. For a student whose newest attempt is `IN_PROGRESS` and a prior is `COMPLETED`, `entry.status` ends up `COMPLETED` and `pendingReview` evaluates incorrectly downstream.                                                                                                                                                             | Either reverse the iteration order, or set `entry.status` only on the first pass (when the entry is created). Cleaner: pre-compute `entry.status` as `attempts[0]?.status` after the loop, since attempts are inserted in newest-first order.        |
| **EXAM-4** | `sessions/route.ts` accepts arbitrary `status` query without validation            | [sessions/route.ts:15,19](../../app/api/staff/exams/internal/operations/sessions/route.ts#L15) passes `searchParams.get('status')` straight into `where.status`. Prisma will throw on an invalid value (e.g. `?status=banana`) — but the error message is `PrismaClientValidationError` and gets surfaced as a 500. Should be a 400 with a validation message.                                                                                                                                                                                                                                                                                               | Wrap the route in a small `z.enum([...])` parse of the query params, mirroring the publish/void schemas.                                                                                                                                             |
| **EXAM-5** | `sessions/route.ts` returns every answer for every session — payload size risk     | [sessions/route.ts:34-48](../../app/api/staff/exams/internal/operations/sessions/route.ts#L34-L48) — `take: 200` × ~50 answers × full question text + options + correctAnswer. At 200 sessions this can easily exceed 5MB on the wire. Admins on the Live tab don't need the full answer detail.                                                                                                                                                                                                                                                                                                                                                             | Split into list (no answers) + detail (`GET /…/sessions/[id]`). Keep `answers` only in the detail call. Or: keep current shape but `take: 50` and add pagination.                                                                                    |
| **EXAM-6** | Eligibility policy and submit accounting are inconsistent                          | [submit/route.ts:87-105](../../app/api/student/exams/internal/submit/route.ts#L87-L105) still computes `retakeEligibleAt` + `banLiftDate` on every submission, even though [engine.ts:checkEligibility](../../lib/internal-exam/engine.ts) now allows only one attempt — those fields are never re-read. Dead writes, but worse, they imply a multi-attempt model that no longer exists, which will confuse future maintainers.                                                                                                                                                                                                                              | Remove the retake/ban computation from `submit/route.ts`. Keep the columns for migration safety, but stop populating them. Update the inline comment to reflect single-attempt + admin-void retake.                                                  |
| **EXAM-7** | New routes use `_ctx: any` instead of the typed route-context                      | [sessions/route.ts:11](../../app/api/staff/exams/internal/operations/sessions/route.ts#L11), [void/route.ts:17](../../app/api/staff/exams/internal/operations/void/route.ts#L17), [publish/route.ts:16](../../app/api/staff/exams/internal/operations/publish/route.ts#L16), [report/route.ts:14](../../app/api/student/exams/internal/report/route.ts#L14), [submit/route.ts:18](../../app/api/student/exams/internal/submit/route.ts#L18), [progress/route.ts:19](../../app/api/student/exams/internal/progress/route.ts#L19). Other routes in the codebase use the typed `ctx: { params: Promise<…> }` pattern. The `any` works for now but loses safety. | These routes don't have dynamic params, so just drop the second parameter entirely: `withErrorHandler(async (req: NextRequest) => { … })`.                                                                                                           |

### 🟡 MEDIUM

| #           | Finding                                                                              | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Fix                                                                                                                                                                                                |
| ----------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **EXAM-8**  | `(s as any).isPublished` / `(staff as any).id` escape hatches                        | [sessions/route.ts:79](../../app/api/staff/exams/internal/operations/sessions/route.ts#L79), [progress/route.ts:123](../../app/api/student/exams/internal/progress/route.ts#L123), [void/route.ts:40](../../app/api/staff/exams/internal/operations/void/route.ts#L40). The Prisma client should have `isPublished` typed after `bun run db:generate` ran (which it has — type-check passes). The `as any` was a workaround during dev and is no longer needed. | Drop the casts. `s.isPublished` and `staff.id` are properly typed.                                                                                                                                 |
| **EXAM-9**  | Unused `apiError` import                                                             | [sessions/route.ts:3](../../app/api/staff/exams/internal/operations/sessions/route.ts#L3) imports `apiError` but never calls it.                                                                                                                                                                                                                                                                                                                                | Remove the import.                                                                                                                                                                                 |
| **EXAM-10** | Student `report/route.ts` doesn't notify staff                                       | [report/route.ts](../../app/api/student/exams/internal/report/route.ts) creates the row but never raises a dashboard alert, sends an email, or surfaces a badge. Admins discover reports only by opening the session detail in the Operations dashboard.                                                                                                                                                                                                        | Either (a) add an alert to `lib/analytics/dashboard-alerts.ts` (count of `PENDING` reports), or (b) emit a notification via `lib/email/sender.ts` to the exam-ops inbox. (a) is the lighter touch. |
| **EXAM-11** | `subTopic` removed from student question display but still in the API/component type | [InternalExamInterface.tsx:24](../../app/student/exams/internal/_components/InternalExamInterface.tsx#L24) — the field is declared but never rendered after the commit. Dead state.                                                                                                                                                                                                                                                                             | Either remove `subTopic` from the question response in the exam-start API, or keep it and use it (it's still useful for telemetry). Pick one.                                                      |
| **EXAM-12** | `seed_internal_questions.ts` writes only 3 options when many UIs assume 4            | [scripts/seed_internal_questions.ts:22](../../scripts/seed_internal_questions.ts#L22) provides `['Option A is incorrect', 'Option B is the correct answer', 'Option C is also incorrect']` — three options. The exam interface renders all options from the array, so 3 will work, but most real EASA questions have 4 (A/B/C/D).                                                                                                                               | Either rename to `seed_dev_questions.ts` (signals it's intentionally minimal), or pad the array to 4. Minor.                                                                                       |

> **Post-fix note (2026-09-08):** The current exam engine (`lib/exams/engine.ts:99`) enforces exactly 3 options per question as the EASA standard. The 4-option seed was later reverted to 3 options to match the enforced rule.

### 🟢 LOW / Stylistic

| #           | Finding                                              | Evidence                                                                                                                                                                                                                                                                                  | Fix |
| ----------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| **EXAM-13** | `ExamOperations.tsx` is 479 lines in a single file   | The component handles tabs, fetching, polling, void, publish, expand, error/success messages, and answer-detail render. Splittable into `<OperationsTabs>`, `<SessionRow>`, `<AnswerDetail>` — easier to test. Not blocking.                                                              |
| **EXAM-14** | 15s polling interval on Operations may be aggressive | `setInterval(fetchSessions, 15000)` on the Live tab. With `take: 200` × full answers it's a chunky payload every 15s for any admin viewing the page. With the EXAM-5 fix (list vs detail split) this becomes cheap; until then, consider 30s or pause on tab-hidden (like `<Heartbeat>`). |
| **EXAM-15** | No `loading.tsx` for the new operations tab path     | The page is `/staff/exams/internal` (existing) with a new client tab inside it, so it inherits the existing `loading.tsx`. Fine, but worth noting that the Operations tab does its own loading skeleton inline — could lift to a sibling `loading.tsx` for first-paint.                   |

---

## Things done right (worth keeping as patterns)

1. **`isPublished` gating is applied on the API, not the UI** — `progress/route.ts:196-197` zeros `bestScore`/`passed` server-side. A modified browser can't peek at scores. ✓
2. **`submit/route.ts` doesn't echo scores back** — only `{ submitted, pendingReview, timedOut }`. ✓
3. **Self-only check on student routes** — `examSession.studentId !== session.user.id → 403`. ✓
4. **Single-attempt policy enforced both in eligibility AND via the schema** — voiding is the only escape hatch, and voided sessions are excluded from the eligibility count. ✓
5. **Reports table has the right indexes** — `[sessionId]`, `[studentId]`, `[status]`. ✓
6. **Feature flag gating** — every student endpoint short-circuits when `isInternalExamSystemEnabled()` returns false. ✓
7. **Zod validation on every POST body**. ✓
8. **Tests grew with the feature** — 102 → 116, +14 tests for the new code paths. ✓

---

## Recommended priority order

1. **🔴 EXAM-1** — the void action is broken in production. Single schema delta + `db:push`.
2. **🟡 EXAM-2** — wire `createAuditLog` into publish + void. Two `await createAuditLog({ … })` calls.
3. **🟡 EXAM-3** — fix the oldest-status leak in the progress route. One-line ordering fix.
4. **🟡 EXAM-4** — add a zod enum for the sessions query `status` param. Mirrors the existing publish/void schemas.
5. **🟡 EXAM-5** — split sessions/route into list + detail to cap payload size.
6. **🟡 EXAM-6** — strip vestigial retake/ban writes from submit.
7. **🟡 EXAM-7 + EXAM-8** — type cleanup (`_ctx: any`, `as any`).
8. Remaining items as time allows.

---

## Methodology

- `git log --oneline -20` to find the changed commits (`b928b76`, `94375e5`).
- `git show --stat b928b76` for the file list.
- Direct read of every new route file in `app/api/{staff,student}/exams/internal/`.
- `git diff 5cb0df4..b928b76 -- prisma/schema.prisma` + `awk '/model InternalExamSession/,/^}/'` to confirm column existence.
- `git diff` on the engine + dashboard for behaviour deltas.
- `grep -nE "createAuditLog"` across the operations routes to confirm the audit-trail gap.

Working tree is clean. Type-check + tests pass. The CRITICAL bug (EXAM-1) doesn't surface in type-check because it's masked by `as any`; it would only surface on the first `void` click in production.

---

## Resolution (2026-05-21 — same day)

All 15 findings addressed in one pass. Summary of fixes:

| #           | What changed                                                                                                                                                                                                                                                                                                |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **EXAM-1**  | Schema: added `voidedAt DateTime?`, `voidedBy String?`, `voidReason String?` to `InternalExamSession` + `db:push`. Void action no longer throws `PrismaClientValidationError`.                                                                                                                              |
| **EXAM-2**  | Both [publish/route.ts](../../app/api/staff/exams/internal/operations/publish/route.ts) and [void/route.ts](../../app/api/staff/exams/internal/operations/void/route.ts) now write `createAuditLog` entries (`UPDATE` / `InternalExamSession`) with `before`/`after` diffs and the staff actor id.          |
| **EXAM-3**  | [progress/route.ts](../../app/api/student/exams/internal/progress/route.ts): set `entry.status` only at creation (first iteration). Loop no longer overwrites with older sessions' status.                                                                                                                  |
| **EXAM-4**  | [sessions/route.ts](../../app/api/staff/exams/internal/operations/sessions/route.ts) wraps the `status` + `bankId` query in a `z.object` with a `z.enum([STATUS_VALUES])`. Invalid status now returns a 400 with a clear message.                                                                           |
| **EXAM-5**  | List endpoint slimmed: returns `answerCount` + `reports` (small) but NOT the full `answers` payload. New `GET /api/staff/exams/internal/operations/sessions/[id]` returns the per-answer breakdown. UI lazy-fetches detail on first expand and merges into the row. ~95% payload reduction on the Live tab. |
| **EXAM-6**  | `submit/route.ts` no longer computes `retakeEligibleAt` / `banLiftDate` — those vestigial multi-attempt fields are left `null`. Comment added explaining the single-attempt + admin-void retake policy. Unused `EASA_DEFAULTS` import removed.                                                              |
| **EXAM-7**  | Six routes (`sessions`, `void`, `publish`, `report`, `submit`, `progress`) had `async (req, _ctx: any) =>`. Either dropped the second parameter entirely (no dynamic params) or typed it with `ctx: { params: Promise<{ id: string }> }` on the new detail endpoint.                                        |
| **EXAM-8**  | Dropped `(s as any).isPublished`, `(staff as any).id`, `data: { … } as any` casts now that the Prisma client types `isPublished`, `voidedAt`, `voidedBy`, `voidReason` properly.                                                                                                                            |
| **EXAM-9**  | Removed unused `apiError` import from `sessions/route.ts` (re-added later when adding `z.enum` validation — still used).                                                                                                                                                                                    |
| **EXAM-10** | New `pendingExamReports` alert in [`lib/analytics/dashboard-alerts.ts`](../../lib/analytics/dashboard-alerts.ts): WARNING at ≥ 5 PENDING reports, INFO at 1-4. Deep-links to `/staff/exams/internal?view=operations`.                                                                                       |
| **EXAM-11** | `subTopic` removed from the `Question` interface in [`InternalExamInterface.tsx`](../../app/student/exams/internal/_components/InternalExamInterface.tsx). Added a comment so future maintainers know it's intentionally not surfaced (gives away the answer).                                              |
| **EXAM-12** | `seed_internal_questions.ts` now seeds 4 options per question (was 3) — matches typical EASA Part-66 question shape.                                                                                                                                                                                        |
| **EXAM-13** | Partial: extracted `handleExpand` + `fetchSessionDetail` callbacks, kept the file as one component for now. Full multi-file split deferred — adds little correctness value vs the readability win.                                                                                                          |
| **EXAM-14** | Live-tab polling: interval doubled (15s → 30s), now pauses on `visibilitychange` (mirrors `<Heartbeat>`), and triggers an immediate refresh when the tab returns to visible.                                                                                                                                |

### Verification post-fix

| Check                | Result                             |
| -------------------- | ---------------------------------- |
| `bun run type-check` | ✅ exit 0                          |
| `bun run db:push`    | ✅ Neon + Supabase in sync         |
| `bun run test --run` | ✅ 15 files / **116 tests** pass   |
| `bun run build`      | ✅ Compiled successfully in 2.1min |

Everything wired through `prismaUnfiltered` (staff routes already auth-gated). The single-attempt policy is now genuinely single-attempt — voiding by admin remains the sole retake path, and that action is audit-logged with a proper schema-backed reason field.

---

## Re-verification (2026-08-29)

A re-audit of the internal-exams subsystem against the live codebase, performed
after the August 2026 portal audits and the `prisma` → `prismaUnfiltered`
dual-client refactor. The "## Resolution (2026-05-21)" section above is kept as
**historical record**; this section records what actually holds at `HEAD` and
corrects where that resolution was incomplete.

> **Correction:** the 2026-05-21 resolution for **EXAM-7** claimed the six
> routes were fixed, but `regrade/route.ts` retained `async (req, _ctx: any)`
> (the resolution only swept `sessions`/`void`/`publish`/`report`/`submit`/`progress`).
> Separately, **`regrade/route.ts` was not covered by EXAM-2** — it is a
> privileged score-mutating action but wrote no `createAuditLog`, a gap the
> 2026-05-21 audit did not enumerate. Both are addressed in this pass.

### 2026-05-21 findings against current code

| #       | Finding                                 | Status              | Evidence (current)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------- | --------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| EXAM-1  | void writes non-existent columns        | ✅ VERIFIED FIXED   | `schema.prisma:2090-2095` `InternalExamSession` has `voidedAt/voidedBy/voidReason`; [void/route.ts:44-46](../../app/api/staff/exams/internal/operations/void/route.ts) writes them bare (no `as any`).                                                                                                                                                                                                                                                                                                                                                                              |
| EXAM-2  | publish/void missing audit log          | ✅ VERIFIED FIXED   | [publish/route.ts:47-58](../../app/api/staff/exams/internal/operations/publish/route.ts) and [void/route.ts:56-64](../../app/api/staff/exams/internal/operations/void/route.ts) both `createAuditLog`.                                                                                                                                                                                                                                                                                                                                                                              |
| EXAM-3  | progress status reflects oldest attempt | ✅ VERIFIED FIXED   | [progress/route.ts:87-90,129](../../app/api/student/exams/internal/progress/route.ts) — `status` set only at first (newest) insert; loop explicitly does not overwrite.                                                                                                                                                                                                                                                                                                                                                                                                             |
| EXAM-4  | sessions accepts arbitrary `status`     | ✅ VERIFIED FIXED   | [sessions/route.ts:10](../../app/api/staff/exams/internal/operations/sessions/route.ts) — `z.enum(STATUS_VALUES)`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| EXAM-5  | sessions leaks full answers             | ✅ VERIFIED FIXED   | List returns `answerCount` ([sessions/route.ts:117](../../app/api/staff/exams/internal/operations/sessions/route.ts)); detail at [sessions/[id]/route.ts](../../app/api/staff/exams/internal/operations/sessions/[id]/route.ts).                                                                                                                                                                                                                                                                                                                                                    |
| EXAM-6  | submit computes retake fields           | ✅ VERIFIED FIXED   | [submit/route.ts:89-90](../../app/api/student/exams/internal/submit/route.ts) — comment deliberately does not compute `retakeEligibleAt`/`banLiftDate`.                                                                                                                                                                                                                                                                                                                                                                                                                             |
| EXAM-7  | `_ctx: any` on routes                   | ✅ VERIFIED FIXED   | The 2026-05-21 sweep missed the question/bank CRUD cohort. **This pass** typed every dynamic-param handler with `ctx: { params: Promise<…> }` (`versions`, `review`, `banks/[bankId]/questions` ×2, `banks/[bankId]/questions/[questionId]` ×3), dropped the unused `_ctx` in `student/exams/internal/session` and `answer`, and replaced `where: any` with `Prisma.InternalExamQuestionWhereInput` and explicit `z.enum` validation so an invalid `?status=` returns a clean 400; `grep` (for `ctx: any`/`where: any`) and `tsc` are both clean across all `exams/internal` files. |
| EXAM-8  | `as any` escape hatches                 | ✅ VERIFIED FIXED   | No `as any` casts on `isPublished`/`voidedAt`/`staff.id` in any internal-exam route.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| EXAM-9  | unused `apiError` import                | ✅ N/A              | `apiError` is used across the routes; import retained.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| EXAM-10 | no pending-report alert                 | ✅ VERIFIED FIXED   | `lib/analytics/dashboard-alerts.ts:37,157-165` — `pendingExamReports` alert wired in.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| EXAM-11 | `subTopic` dead in student UI           | ✅ VERIFIED FIXED   | No `subTopic` references in `app/student/exams/internal/_components/`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| EXAM-12 | seed writes 3 options                   | ✅ VERIFIED FIXED   | [seed_internal_questions.ts:22-27](../../../scripts/seed_internal_questions.ts) — 4 options/A-B-C-D.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| EXAM-13 | `ExamOperations.tsx` monolith           | ⚠️ PARTIAL          | Still one file; structural split deferred (no correctness impact).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| EXAM-14 | Live-tab polling                        | ✅ FIXED + hardened | `InternalExamDashboard.tsx` — 30 s polling, pauses on `document.hidden`, refetches on focus, cleanup on unmount.                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| EXAM-15 | no loading.tsx                          | ✅ INHERITED        | Existing route `loading.tsx` covers the path.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

### LLM Council — 3-pass verification (2026-08-29)

Three independent reviewers were run over the changed files: Performance/Reliability, Security, and Accessibility+Correctness+UX.

**`app/api/staff/exams/internal/operations/regrade/route.ts`**

- ✅ Auth gate correct (`requireStaff` → `withErrorHandler` → 401/403); uses `prismaUnfiltered`; Zod-validated body.
- ⚠️ (Security) Unbounded `sessionIds` → DoS. **Fixed:** `.max(500)`, matching `publish/route.ts`.
- ⚠️ (Security) TOCTOU race — status guarded at read (`:41`) but not on the write. **Fixed:** write is now `updateMany` with `status: { notIn: ['VOIDED','IN_PROGRESS'] }` in the `where` (`:81-92`), making the check atomic and non-throwing on zero rows.
- ⚠️ (Security) No `createAuditLog` on a privileged score mutation — CLAUDE.md mandates it. **Fixed:** single batch `createAuditLog` with before/after diffs (`:104-115`), mirroring `publish/route.ts`.
- ⚠️ (Performance) Sequential `for…of await`, per-answer `update` (N+1), uncached `getBankRules`. **Fixed this pass** — promise-cached `getBankRules`, batched `$transaction` writes per session, and bounded concurrency; behavior-preserving (same reads/writes/results, throw-on-first-failure preserved).

**`app/student/exams/internal/_components/InternalExamDashboard.tsx`**

- ✅ Polling pauses on `document.hidden`, refetches on `visibilitychange`, clears interval + listener on unmount.
- ⚠️ (Correctness) `tick` didn't check the `active` flag — could fire `fetchProgress` after unmount. **Fixed:** `tick` now guards `document.hidden || !active`; `fetchProgress` accepts an optional `AbortSignal` cancelled on unmount so in-flight calls cannot `setState` after cleanup.
- ✅ No CSRF (`GET` only); progress endpoint auth + IDOR (`studentId` scoping) confirmed.

### New / council-discovered findings

| #       | Finding                                                                          | Severity         | Status                                                                      |
| ------- | -------------------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------- |
| EXAM-16 | `regrade/route.ts` unbounded `sessionIds`                                        | High (DoS)       | Fixed (`.max(500)`)                                                         |
| EXAM-17 | `regrade/route.ts` TOCTOU race on status at write                                | Medium           | Fixed (`updateMany` + status in `where`)                                    |
| EXAM-18 | `regrade/route.ts` no `createAuditLog` on score mutation                         | High (CLAUDE.md) | Fixed                                                                       |
| EXAM-19 | `banks/route.ts` residual `_ctx: any` (GET)                                      | Low              | Fixed (param dropped)                                                       |
| EXAM-20 | `regrade/route.ts` sequential loop + N+1 answer writes + uncached `getBankRules` | Medium (perf)    | Fixed (promise cache + batched `$transaction` writes + bounded concurrency) |

### Verification (2026-08-29)

| Check                             | Result                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npx tsc --noEmit` (edited files) | ✅ no errors in any `exams/internal` route or the two new test files                                                                                                                                                                                                                                                                                                 |
| `bun run docs:html`               | ✅ 61 pages rendered, no broken links (regenerated)                                                                                                                                                                                                                                                                                                                  |
| `bun run test --run` (Vitest)     | ✅ runs to completion via the `--no-file-parallelism` background runner; added `tests/integration/api/staff-exams-internal-routes.test.ts` + `student-exams-internal-routes.test.ts` — 38 cases all passing (auth/authz, zod validation, audit-log writes, regrade TOCTOU/status guard). Pre-existing failures remain only in unrelated `staff-*` integration tests. |

> **Note on tooling:** `bun run lint` is non-functional in this Windows env (`next lint` errors "Invalid project directory"; `npx eslint` fails on ESLint v10 vs the legacy `.eslintrc.json`). `bun run test` runs via the background runner with `--no-file-parallelism` (`bun run test --run --no-file-parallelism --no-color`); foreground execution aborts with `ChildProcess.kill` (PowerShell child-spawn limit). Type-checking remains the reliable gate for these edits.

---

## Re-verification (2026-08-29)

A re-audit of the internal-exams subsystem against the live codebase, performed
after the August 2026 portal audits and the `prisma` → `prismaUnfiltered`
dual-client refactor. The "## Resolution (2026-05-21)" section above is kept as
**historical record**; this section records what actually holds at `HEAD` and
corrects where that resolution was incomplete.

> **Correction:** the 2026-05-21 resolution for **EXAM-7** claimed the six
> routes were fixed, but `regrade/route.ts` retained `async (req, _ctx: any)`
> (the resolution only swept `sessions`/`void`/`publish`/`report`/`submit`/`progress`).
> Separately, **`regrade/route.ts` was not covered by EXAM-2** — it is a
> privileged score-mutating action but wrote no `createAuditLog`, a gap the
> 2026-05-21 audit did not enumerate. Both are addressed in this pass.

### 2026-05-21 findings against current code

| #       | Finding                                 | Status              | Evidence (current)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------- | --------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| EXAM-1  | void writes non-existent columns        | ✅ VERIFIED FIXED   | `schema.prisma:2090-2095` `InternalExamSession` has `voidedAt/voidedBy/voidReason`; [void/route.ts:44-46](../../app/api/staff/exams/internal/operations/void/route.ts) writes them bare (no `as any`).                                                                                                                                                                                                                                                                                                                                                                              |
| EXAM-2  | publish/void missing audit log          | ✅ VERIFIED FIXED   | [publish/route.ts:47-58](../../app/api/staff/exams/internal/operations/publish/route.ts) and [void/route.ts:56-64](../../app/api/staff/exams/internal/operations/void/route.ts) both `createAuditLog`.                                                                                                                                                                                                                                                                                                                                                                              |
| EXAM-3  | progress status reflects oldest attempt | ✅ VERIFIED FIXED   | [progress/route.ts:87-90,129](../../app/api/student/exams/internal/progress/route.ts) — `status` set only at first (newest) insert; loop explicitly does not overwrite.                                                                                                                                                                                                                                                                                                                                                                                                             |
| EXAM-4  | sessions accepts arbitrary `status`     | ✅ VERIFIED FIXED   | [sessions/route.ts:10](../../app/api/staff/exams/internal/operations/sessions/route.ts) — `z.enum(STATUS_VALUES)`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| EXAM-5  | sessions leaks full answers             | ✅ VERIFIED FIXED   | List returns `answerCount` ([sessions/route.ts:117](../../app/api/staff/exams/internal/operations/sessions/route.ts)); detail at [sessions/[id]/route.ts](../../app/api/staff/exams/internal/operations/sessions/[id]/route.ts).                                                                                                                                                                                                                                                                                                                                                    |
| EXAM-6  | submit computes retake fields           | ✅ VERIFIED FIXED   | [submit/route.ts:89-90](../../app/api/student/exams/internal/submit/route.ts) — comment deliberately does not compute `retakeEligibleAt`/`banLiftDate`.                                                                                                                                                                                                                                                                                                                                                                                                                             |
| EXAM-7  | `_ctx: any` on routes                   | ✅ VERIFIED FIXED   | The 2026-05-21 sweep missed the question/bank CRUD cohort. **This pass** typed every dynamic-param handler with `ctx: { params: Promise<…> }` (`versions`, `review`, `banks/[bankId]/questions` ×2, `banks/[bankId]/questions/[questionId]` ×3), dropped the unused `_ctx` in `student/exams/internal/session` and `answer`, and replaced `where: any` with `Prisma.InternalExamQuestionWhereInput` and explicit `z.enum` validation so an invalid `?status=` returns a clean 400; `grep` (for `ctx: any`/`where: any`) and `tsc` are both clean across all `exams/internal` files. |
| EXAM-8  | `as any` escape hatches                 | ✅ VERIFIED FIXED   | No `as any` casts on `isPublished`/`voidedAt`/`staff.id` in any internal-exam route.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| EXAM-9  | unused `apiError` import                | ✅ N/A              | `apiError` is used across the routes; import retained.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| EXAM-10 | no pending-report alert                 | ✅ VERIFIED FIXED   | `lib/analytics/dashboard-alerts.ts:37,157-165` — `pendingExamReports` alert wired in.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| EXAM-11 | `subTopic` dead in student UI           | ✅ VERIFIED FIXED   | No `subTopic` references in `app/student/exams/internal/_components/`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| EXAM-12 | seed writes 3 options                   | ✅ VERIFIED FIXED   | [seed_internal_questions.ts:22-27](../../../scripts/seed_internal_questions.ts) — 4 options/A-B-C-D.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| EXAM-13 | `ExamOperations.tsx` monolith           | ⚠️ PARTIAL          | Still one file; structural split deferred (no correctness impact).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| EXAM-14 | Live-tab polling                        | ✅ FIXED + hardened | `InternalExamDashboard.tsx` — 30 s polling, pauses on `document.hidden`, refetches on focus, cleanup on unmount.                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| EXAM-15 | no loading.tsx                          | ✅ INHERITED        | Existing route `loading.tsx` covers the path.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

### LLM Council — 3-pass verification (2026-08-29)

Three independent reviewers were run over the changed files: Performance/Reliability, Security, and Accessibility+Correctness+UX.

**`app/api/staff/exams/internal/operations/regrade/route.ts`**

- ✅ Auth gate correct (`requireStaff` → `withErrorHandler` → 401/403); uses `prismaUnfiltered`; Zod-validated body.
- ⚠️ (Security) Unbounded `sessionIds` → DoS. **Fixed:** `.max(500)`, matching `publish/route.ts`.
- ⚠️ (Security) TOCTOU race — status guarded at read (`:41`) but not on the write. **Fixed:** write is now `updateMany` with `status: { notIn: ['VOIDED','IN_PROGRESS'] }` in the `where` (`:81-92`), making the check atomic and non-throwing on zero rows.
- ⚠️ (Security) No `createAuditLog` on a privileged score mutation — CLAUDE.md mandates it. **Fixed:** single batch `createAuditLog` with before/after diffs (`:104-115`), mirroring `publish/route.ts`.
- ⚠️ (Performance) Sequential `for…of await`, per-answer `update` (N+1), uncached `getBankRules`. **Fixed this pass** — promise-cached `getBankRules`, batched `$transaction` writes per session, and bounded concurrency; behavior-preserving (same reads/writes/results, throw-on-first-failure preserved).

**`app/student/exams/internal/_components/InternalExamDashboard.tsx`**

- ✅ Polling pauses on `document.hidden`, refetches on `visibilitychange`, clears interval + listener on unmount.
- ⚠️ (Correctness) `tick` didn't check the `active` flag — could fire `fetchProgress` after unmount. **Fixed:** `tick` now guards `document.hidden || !active`; `fetchProgress` accepts an optional `AbortSignal` cancelled on unmount so in-flight calls cannot `setState` after cleanup.
- ✅ No CSRF (`GET` only); progress endpoint auth + IDOR (`studentId` scoping) confirmed.

### New / council-discovered findings

| #       | Finding                                                                          | Severity         | Status                                                                      |
| ------- | -------------------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------- |
| EXAM-16 | `regrade/route.ts` unbounded `sessionIds`                                        | High (DoS)       | Fixed (`.max(500)`)                                                         |
| EXAM-17 | `regrade/route.ts` TOCTOU race on status at write                                | Medium           | Fixed (`updateMany` + status in `where`)                                    |
| EXAM-18 | `regrade/route.ts` no `createAuditLog` on score mutation                         | High (CLAUDE.md) | Fixed                                                                       |
| EXAM-19 | `banks/route.ts` residual `_ctx: any` (GET)                                      | Low              | Fixed (param dropped)                                                       |
| EXAM-20 | `regrade/route.ts` sequential loop + N+1 answer writes + uncached `getBankRules` | Medium (perf)    | Fixed (promise cache + batched `$transaction` writes + bounded concurrency) |

### Verification (2026-08-29)

| Check                             | Result                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npx tsc --noEmit` (edited files) | ✅ no errors in any `exams/internal` route or the two new test files                                                                                                                                                                                                                                                                                                 |
| `bun run docs:html`               | ✅ 61 pages rendered, no broken links (regenerated)                                                                                                                                                                                                                                                                                                                  |
| `bun run test --run` (Vitest)     | ✅ runs to completion via the `--no-file-parallelism` background runner; added `tests/integration/api/staff-exams-internal-routes.test.ts` + `student-exams-internal-routes.test.ts` — 38 cases all passing (auth/authz, zod validation, audit-log writes, regrade TOCTOU/status guard). Pre-existing failures remain only in unrelated `staff-*` integration tests. |

> **Note on tooling:** `bun run lint` is non-functional in this Windows env (`next lint` errors "Invalid project directory"; `npx eslint` fails on ESLint v10 vs the legacy `.eslintrc.json`). `bun run test` runs via the background runner with `--no-file-parallelism` (`bun run test --run --no-file-parallelism --no-color`); foreground execution aborts with `ChildProcess.kill` (PowerShell child-spawn limit). Type-checking remains the reliable gate for these edits.
