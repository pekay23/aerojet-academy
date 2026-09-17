# Exam Notification & Audit-Trail Audit — 2026-09-11

**Scope**: Exam event lifecycle — Go/No-Go/Postponement decisions, pool confirmation, internal exam result publication, and the pre-push test pipeline on Windows.

**Objective**: Close audit and student-notification gaps across the exam-events domain. Every privileged mutation now writes an `AuditLog` row; every lifecycle transition that affects a student now creates an in-app `Notification` and (where an email helper exists) sends a transactional email.

---

## Verification

| Check                | Result                                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `bun run type-check` | ✅ 0 errors (`bun x tsc --noEmit`)                                                                                |
| `bun run test --run` | ✅ 142 files / **683 tests** pass (`--no-file-parallelism --no-color`)                                            |
| Lint                 | N/A locally (ESLint v10/mjs-config mismatch). ESLint is non-functional in this Windows env — see known-issues.md. |

---

## Changes

### Phase 1 — Audit Logging (`lib/events/go-no-go.ts`, `lib/pools/confirm.ts`)

| Function / Endpoint   | Action         | Entity                | Notes                                                                                                                                                     |
| --------------------- | -------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `executeGo`           | `UPDATE`       | `ExamEvent`           | Logs the Go decision with pool-confirmation count. Previously had zero audit trail.                                                                       |
| `executeNoGo`         | `UPDATE`       | `ExamEvent`           | Logs cancellation with pools-affected + roll-forward/deferred counts.                                                                                     |
| `executePostponement` | `UPDATE`       | `ExamEvent`           | Logs new/old date window. Destructured `event.startDate`/`event.endDate` to satisfy TS strict-null narrowing across the `$transaction` callback boundary. |
| `confirmPoolInternal` | `POOL_CONFIRM` | `ExamPool`            | Already had `logAuditEvent`; confirmed it flows through the transaction.                                                                                  |
| `publish` route       | `UPDATE`       | `InternalExamSession` | Already had `createAuditLog`; confirmed unchanged.                                                                                                        |

### Phase 2 — Student Notifications

| Trigger                                 | Notification type | Link                      | Method                                                        |
| --------------------------------------- | ----------------- | ------------------------- | ------------------------------------------------------------- |
| Event confirmed (`executeGo`)           | `POOL_UPDATE`     | `/student/exams`          | `createNotification` (parallelised with `Promise.allSettled`) |
| Event cancelled (`executeNoGo`)         | `POOL_UPDATE`     | `/student/exams`          | in-app (email already sent)                                   |
| Event postponed (`executePostponement`) | `POOL_UPDATE`     | `/student/exams`          | in-app (email already sent)                                   |
| Pool confirmed (`confirmPoolInternal`)  | `POOL_UPDATE`     | `/student/exams`          | `createNotification` inside tx; email already sent            |
| Results published (`publish` route)     | `SUCCESS`         | `/student/exams/internal` | `createNotification` (parallelised)                           |

Notification UX was pre-existing: `<StudentTopbarActions>` (bell dropdown) reads from `/api/student/topbar-items`; `/student/notifications` page lists all. `MyBookingsTab` already renders visual status badges (CONFIRMED / ROLLING-FORWARD / POSTPONED / CANCELLED). No new UI components required.

### Phase 4 — Maintainability / Performance

- **Parallelised dispatch**: All `createNotification` + email calls inside loops in `executeGo`, `executeNoGo`, `executePostponement`, `confirmPoolInternal`, and the publish route now fire via `Promise.allSettled` instead of sequential `await` — per the project's "never write sequential await calls for independent queries" convention.
- **`executePostponement` user fetch**: Replaced N+1 `prisma.user.findUnique` calls with a single `prisma.user.findMany` batch fetch.
- **Pre-push hook**: `.husky/pre-push` now passes `--no-file-parallelism --no-color` to `bun run test --run`, resolving the Vitest worker-pool crashes on Windows (47 unhandled `ChildProcess.kill` errors). Verified: pre-push hook runs clean locally.

---

## LLM Council Review (Pass 2)

| Persona                | Finding                                                                                                          | Action taken                           |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| Performance Guru       | Sequential `await` on independent notification/email sends inside loops                                          | Parallelised with `Promise.allSettled` |
| Security Auditor       | `requireStaff` gate present on publish route; no auth bypass                                                     | No action needed                       |
| Accessibility Advocate | No UI changes — backend only                                                                                     | N/A                                    |
| UX/UI Designer         | Notification messages clear; link targets valid; existing toast/badge UI consumed them                           | No action needed                       |
| Architecture Lead      | `createAuditLog`/`createNotification` imports consistent; `logAuditEvent` already wired in `confirmPoolInternal` | No action needed                       |

**Council Pass 2 result: 0 issues.**

---

## Files changed (this session)

| File                                                       | Change                                                                                                                                                                                                 |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `lib/events/go-no-go.ts`                                   | Audit logs in `executeGo`/`executeNoGo`/`executePostponement`; in-app notifications in all three; `eventStartDate`/`eventEndDate` destructure; parallelised dispatch; batch user fetch in postponement |
| `lib/pools/confirm.ts`                                     | In-app notification for confirmed memberships (parallelised)                                                                                                                                           |
| `app/api/staff/exams/internal/operations/publish/route.ts` | In-app notification for published results (parallelised)                                                                                                                                               |
| `tests/integration/workflows/pool-confirmation.test.ts`    | Added `createNotification` to the `@/lib/email/service` mock                                                                                                                                           |
| `.husky/pre-push`                                          | Added `--no-file-parallelism --no-color` flags                                                                                                                                                         |
