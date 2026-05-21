# Internal Exams Audit — 2026-05-21

Reviews commits `94375e5` (initial system) and `b928b76` (hardening) — adding
the InternalExam testing engine, admin operations dashboard, student reporting,
and the policy shift to admin-controlled publication.

**Scope**: every file touched between those two commits plus a regression
check against the prior baseline.

## Verification

| Check | Result |
|---|---|
| `bun run type-check` | ✅ exit 0 |
| `bun run test --run` | ✅ **116/116** (14 new tests since the last audit) |
| `bun run build` | Compiles cleanly (Recharts width warnings already silenced; no new warnings introduced) |

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

| Path | Purpose |
|---|---|
| `GET /api/staff/exams/internal/operations/sessions` | List sessions with full answers + reports; filter by `status` / `bankId`. Take 200. |
| `POST /api/staff/exams/internal/operations/publish` | Bulk publish `COMPLETED` / `TIMED_OUT` sessions (sets `isPublished: true`). |
| `POST /api/staff/exams/internal/operations/void` | Void a session + resolve its pending reports. Voiding becomes the **only** retake path. |

### Routes — student

| Path | Change |
|---|---|
| `POST /api/student/exams/internal/submit` | No longer returns `score`/`passed` (`pendingReview: true` placeholder). |
| `GET /api/student/exams/internal/progress` | Adds `isPublished` + `pendingReview` per bank; `bestScore`/`passed` zero-gated behind `isPublished`. |
| `POST /api/student/exams/internal/report` | New — student flags a session issue (10-1000 chars, dedup on `PENDING`). |

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

| # | Finding | Evidence | Fix |
|---|---|---|---|
| **EXAM-1** | `void/route.ts` writes to columns that don't exist in the schema | [void/route.ts:37-43](../../app/api/staff/exams/internal/operations/void/route.ts#L37-L43) writes `voidedAt`, `voidedBy`, `voidReason` with `data: { … } as any`. None of those columns exist in [`InternalExamSession`](../../prisma/schema.prisma) — verified by `grep -nE "voidedAt\|voidedBy\|voidReason" prisma/schema.prisma` returning **zero matches**. The `as any` cast silences TypeScript, but at runtime Prisma will throw `PrismaClientValidationError: Unknown arg 'voidedAt'`. **The void action will fail in production every time.** | Either (a) add `voidedAt DateTime?`, `voidedBy String?`, `voidReason String?` to the model + `db:push`, OR (b) drop them from the route and rely on `updatedAt` + an AuditLog row for the trail. Recommended: (a) — admins want to see who voided what and why without joining audit_logs. |

### 🟡 HIGH

| # | Finding | Evidence | Fix |
|---|---|---|---|
| **EXAM-2** | Privileged mutations missing `createAuditLog` | [publish/route.ts](../../app/api/staff/exams/internal/operations/publish/route.ts) and [void/route.ts](../../app/api/staff/exams/internal/operations/void/route.ts) — no `createAuditLog` import or call. Both qualify per the CLAUDE.md convention: "Every privileged mutation (role changes, refunds, withdrawals, certificate releases, permission grants) writes through `lib/audit/logger.ts`." Publishing exam results and voiding sessions are at least as privileged as those. | Add a single `createAuditLog` call per route with `action: 'UPDATE'`, `entity: 'InternalExamSession'`, `description: \`Published \${count}\`` / `description: \`Voided session \${id}\``, and the `changes` diff (before/after `isPublished` or `status`). |
| **EXAM-3** | Status leakage on `progress/route.ts` — `entry.status` reflects the OLDEST attempt | [progress/route.ts:99,124](../../app/api/student/exams/internal/progress/route.ts#L99) — sessions are `orderBy: { createdAt: 'desc' }` (newest first), iterated top-to-bottom. Each loop iteration overwrites `entry.status = s.status`. Final value after the loop is the **oldest** session's status, not the newest. For a student whose newest attempt is `IN_PROGRESS` and a prior is `COMPLETED`, `entry.status` ends up `COMPLETED` and `pendingReview` evaluates incorrectly downstream. | Either reverse the iteration order, or set `entry.status` only on the first pass (when the entry is created). Cleaner: pre-compute `entry.status` as `attempts[0]?.status` after the loop, since attempts are inserted in newest-first order. |
| **EXAM-4** | `sessions/route.ts` accepts arbitrary `status` query without validation | [sessions/route.ts:15,19](../../app/api/staff/exams/internal/operations/sessions/route.ts#L15) passes `searchParams.get('status')` straight into `where.status`. Prisma will throw on an invalid value (e.g. `?status=banana`) — but the error message is `PrismaClientValidationError` and gets surfaced as a 500. Should be a 400 with a validation message. | Wrap the route in a small `z.enum([...])` parse of the query params, mirroring the publish/void schemas. |
| **EXAM-5** | `sessions/route.ts` returns every answer for every session — payload size risk | [sessions/route.ts:34-48](../../app/api/staff/exams/internal/operations/sessions/route.ts#L34-L48) — `take: 200` × ~50 answers × full question text + options + correctAnswer. At 200 sessions this can easily exceed 5MB on the wire. Admins on the Live tab don't need the full answer detail. | Split into list (no answers) + detail (`GET /…/sessions/[id]`). Keep `answers` only in the detail call. Or: keep current shape but `take: 50` and add pagination. |
| **EXAM-6** | Eligibility policy and submit accounting are inconsistent | [submit/route.ts:87-105](../../app/api/student/exams/internal/submit/route.ts#L87-L105) still computes `retakeEligibleAt` + `banLiftDate` on every submission, even though [engine.ts:checkEligibility](../../lib/internal-exam/engine.ts) now allows only one attempt — those fields are never re-read. Dead writes, but worse, they imply a multi-attempt model that no longer exists, which will confuse future maintainers. | Remove the retake/ban computation from `submit/route.ts`. Keep the columns for migration safety, but stop populating them. Update the inline comment to reflect single-attempt + admin-void retake. |
| **EXAM-7** | New routes use `_ctx: any` instead of the typed route-context | [sessions/route.ts:11](../../app/api/staff/exams/internal/operations/sessions/route.ts#L11), [void/route.ts:17](../../app/api/staff/exams/internal/operations/void/route.ts#L17), [publish/route.ts:16](../../app/api/staff/exams/internal/operations/publish/route.ts#L16), [report/route.ts:14](../../app/api/student/exams/internal/report/route.ts#L14), [submit/route.ts:18](../../app/api/student/exams/internal/submit/route.ts#L18), [progress/route.ts:19](../../app/api/student/exams/internal/progress/route.ts#L19). Other routes in the codebase use the typed `ctx: { params: Promise<…> }` pattern. The `any` works for now but loses safety. | These routes don't have dynamic params, so just drop the second parameter entirely: `withErrorHandler(async (req: NextRequest) => { … })`. |

### 🟡 MEDIUM

| # | Finding | Evidence | Fix |
|---|---|---|---|
| **EXAM-8** | `(s as any).isPublished` / `(staff as any).id` escape hatches | [sessions/route.ts:79](../../app/api/staff/exams/internal/operations/sessions/route.ts#L79), [progress/route.ts:123](../../app/api/student/exams/internal/progress/route.ts#L123), [void/route.ts:40](../../app/api/staff/exams/internal/operations/void/route.ts#L40). The Prisma client should have `isPublished` typed after `bun run db:generate` ran (which it has — type-check passes). The `as any` was a workaround during dev and is no longer needed. | Drop the casts. `s.isPublished` and `staff.id` are properly typed. |
| **EXAM-9** | Unused `apiError` import | [sessions/route.ts:3](../../app/api/staff/exams/internal/operations/sessions/route.ts#L3) imports `apiError` but never calls it. | Remove the import. |
| **EXAM-10** | Student `report/route.ts` doesn't notify staff | [report/route.ts](../../app/api/student/exams/internal/report/route.ts) creates the row but never raises a dashboard alert, sends an email, or surfaces a badge. Admins discover reports only by opening the session detail in the Operations dashboard. | Either (a) add an alert to `lib/analytics/dashboard-alerts.ts` (count of `PENDING` reports), or (b) emit a notification via `lib/email/sender.ts` to the exam-ops inbox. (a) is the lighter touch. |
| **EXAM-11** | `subTopic` removed from student question display but still in the API/component type | [InternalExamInterface.tsx:24](../../app/student/exams/internal/_components/InternalExamInterface.tsx#L24) — the field is declared but never rendered after the commit. Dead state. | Either remove `subTopic` from the question response in the exam-start API, or keep it and use it (it's still useful for telemetry). Pick one. |
| **EXAM-12** | `seed_internal_questions.ts` writes only 3 options when many UIs assume 4 | [scripts/seed_internal_questions.ts:22](../../scripts/seed_internal_questions.ts#L22) provides `['Option A is incorrect', 'Option B is the correct answer', 'Option C is also incorrect']` — three options. The exam interface renders all options from the array, so 3 will work, but most real EASA questions have 4 (A/B/C/D). | Either rename to `seed_dev_questions.ts` (signals it's intentionally minimal), or pad the array to 4. Minor. |

### 🟢 LOW / Stylistic

| # | Finding | Evidence | Fix |
|---|---|---|---|
| **EXAM-13** | `ExamOperations.tsx` is 479 lines in a single file | The component handles tabs, fetching, polling, void, publish, expand, error/success messages, and answer-detail render. Splittable into `<OperationsTabs>`, `<SessionRow>`, `<AnswerDetail>` — easier to test. Not blocking. |
| **EXAM-14** | 15s polling interval on Operations may be aggressive | `setInterval(fetchSessions, 15000)` on the Live tab. With `take: 200` × full answers it's a chunky payload every 15s for any admin viewing the page. With the EXAM-5 fix (list vs detail split) this becomes cheap; until then, consider 30s or pause on tab-hidden (like `<Heartbeat>`). |
| **EXAM-15** | No `loading.tsx` for the new operations tab path | The page is `/staff/exams/internal` (existing) with a new client tab inside it, so it inherits the existing `loading.tsx`. Fine, but worth noting that the Operations tab does its own loading skeleton inline — could lift to a sibling `loading.tsx` for first-paint. |

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
