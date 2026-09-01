# Internal Exam System — Implementation Gap Report

> **Audit date:** 2026-08-30
> **Plan audited:** `docs/plans/internal-exam-system-ui-plan.md` (2123 lines)
> **Method:** Walked the actual codebase (schema, API routes, pages, hooks, SQL migrations, tests) and verified each §23 tracker claim against real files/line numbers. Verified files were opened and read, not assumed.

## Verdict

The implementation is **substantially complete** — Phases 1–4 are functionally built out with real schema, routes, UI, hooks, and SQL migrations. The plan's §23 tracker is **mostly accurate but contains two incorrect PENDING marks and two over-claimed "documented" items that are not real deliverable files**. Remaining gaps are concentrated in **Phase 5 documentation** plus a few honest PENDING infra items (Supabase mirror / Realtime enable / unit tests) and one client-side nuance in the strict-keypress handler.

---

## Section-by-Section Status

### Phase 0: Compliance Foundation
| Item | Status | Evidence |
|------|--------|----------|
| DPIA / Accessibility / EASA / Retention sign-off | ⚠️ Partial | These are described in-plan (§14.2, §15) but **no standalone compliance artifacts were produced**. The only related file is an *audit*, not a sign-off: `docs/audits/portal-audits/staff/staff-easa.md` (dated 2026-08-27, a portal audit, not the Phase 0 deliverable). |

### Phase 1: Foundation & Compliance (Schema + RBAC + Staff UI + Anti-cheat foundation)
| Item | Status | Evidence |
|------|--------|----------|
| Schema: `InternalExamBankInstructor` | ✅ Complete | `prisma/schema.prisma:1999` |
| Schema: `InternalExamClassSchedule` (+`sebRequired`) | ✅ Complete | `prisma/schema.prisma:2020`, `:2028` |
| Schema: `InternalExamViolation` (+ `ExamViolationType` enum) | ✅ Complete | `prisma/schema.prisma:2193`, `:2850` |
| Schema: `InternalExamAccessCode` | ✅ Complete | `prisma/schema.prisma:2219` |
| Schema: bank `reviewState` (`InternalExamBankReviewState`) | ✅ Complete | `prisma/schema.prisma:1983`, `:2843` |
| Schema: session recovery fields (`lastActivityAt`, `timeExtensionSec`, `recoveredAt`, `supervised`, `questionOrder`) | ✅ Complete | `prisma/schema.prisma:2136-2158`, `:2152` |
| Schema: `flaggedForReview` on answer | ✅ Complete | `prisma/schema.prisma:1963` |
| `bun run db:push` (Neon) | ✅ Complete | Per session digest; schema reflects models |
| `bun run db:push:supabase` (mirror) | ❌ Pending | Tracker correctly marks PENDING (network/Supabase reachability). Schema not mirrored to replica. |
| Enable Realtime on `internal_exam_sessions` in Supabase Console | ❌ Pending | Tracker correctly marks PENDING. The RLS migration SQL exists (see below) but the table is not enabled in the console/publication in the live project. |
| RBAC: `requireBankAccess(bankId, capability)` | ✅ Complete | `lib/auth/permissions.ts:138` |
| 6 permission keys (`EXAM_BANK_EDIT`, `EXAM_SESSION_MONITOR`, `EXAM_VIOLATION_REVIEW`, etc.) | ✅ Complete | `lib/auth/permission-registry.ts:29,31,34,57,59,62` |
| 20 exam `AuditAction` values | ✅ Complete | `lib/audit/logger.ts:23-26` (+ more) |
| Staff UI: instructor assignment | ✅ Complete | `app/staff/exams/internal/banks/[bankId]/instructors/_components/InstructorAssignmentPage.tsx` |
| Staff UI: class scheduling | ✅ Complete | `app/staff/exams/internal/banks/[bankId]/schedule/_components/ClassSchedulePage.tsx` |
| Staff API: instructors + schedule CRUD | ✅ Complete | `app/api/staff/exams/internal/banks/[bankId]/instructors/*/route.ts`, `.../schedule/*/route.ts` |
| Anti-cheat foundation: violation table + enums | ✅ Complete | schema above |
| `POST /api/student/exams/internal/violation` endpoint | ✅ Complete | `app/api/student/exams/internal/violation/route.ts` |
| Unit test for `requireBankAccess` + bulk-start idempotency | ❌ Pending | No matching test files under `tests/` (e.g. `grep` for `requireBankAccess`/`bulk-start` unit tests returns nothing). Tracker correctly marks PENDING. |

### Phase 2a: Instructor Experience
| Item | Status | Evidence |
|------|--------|----------|
| Nav: "Exams" link in `InstructorSidebar` | ✅ Complete | `app/instructor/_components/InstructorSidebar.tsx` (tracker) + dashboard exists |
| `/instructor/exams` dashboard 5 tabs | ✅ Complete | `app/instructor/exams/_components/InstructorExamsDashboard.tsx:718-722` (`questions`, `banks`, `module`, `classes`, `monitor`) |
| Question editor (read/write per `canEdit`/`canReview`) | ✅ Complete | `app/instructor/exams/banks/[bankId]/_components/BankManager.tsx` + `app/api/instructor/exams/banks/[bankId]/questions/*` |
| Class monitor: GET-first + Realtime deltas | ✅ Complete | `app/instructor/exams/classes/[classId]/monitor/*`; hooks `useLiveExamSessions.ts`, `useRealtimeExamMonitor.ts` |
| Analytics page (groupBy + CSV) | ✅ Complete | `app/instructor/exams/classes/[classId]/analytics/_components/ClassAnalyticsPage.tsx` + `app/api/instructor/exams/classes/[classId]/analytics/route.ts` |
| `loading.tsx` for instructor routes | ✅ Complete | `app/instructor/exams/**/loading.tsx` present for dashboard, monitor, analytics, banks |

### Phase 2b: EASA Controls & Anti-Cheat Client
| Item | Status | Evidence |
|------|--------|----------|
| Strict keypress auto-submit | ⚠️ Partial | `app/student/exams/internal/_components/InternalExamInterface.tsx:393` (`handleSubmit(true)`) + `:423-424` logs `KEYBOARD_SHORTCUT` `CRITICAL` + submits. **Caveat:** at `:422` the handler does `if (inInput) return` *before* the auto-submit. §14.1 specifies a hidden `<input>` is always focused to capture key events — when that input is focused, `inInput` is true and auto-submit will NOT fire, contradicting "any key submits." Needs verification/fix. |
| Fullscreen enforcement | ✅ Complete | `InternalExamInterface.tsx:178-188` |
| Tab-switch detection | ✅ Complete | `InternalExamInterface.tsx:194-207` |
| Clipboard / DevTools / PrintScreen / shortcut block | ✅ Complete | copy/paste `:225-234`; F12 + DevTools inspect `:407-416` |
| Network disconnect + beforeunload/pagehide violation logging | ✅ Complete | `:243-254` (online/offline → `NETWORK_DISCONNECT`), `:270-284` (`EXAM_INTERFACE_UNLOAD`) |
| Access-code gating | ✅ Complete | `app/student/exams/internal/access-code/page.tsx` + `AccessCodeEntry.tsx` + `app/api/student/exams/internal/access-code/validate` |
| Supervised alternative pathway | ✅ Complete | `app/api/staff/exams/internal/sessions/[id]/supervise/route.ts` + `register/[sessionId]/page.tsx` |
| Security test harness | ✅ Complete | `tests/e2e/anticheat-security.spec.ts` (real Playwright tests for fullscreen, DevTools, clipboard, keypress). **Tracker incorrectly marks this PENDING.** |

### Phase 3: Live Monitoring & Recovery
| Item | Status | Evidence |
|------|--------|----------|
| Supabase Realtime subscriptions with RLS | ✅ Complete | `hooks/useRealtimeExamMonitor.ts` + `prisma/migrations/internal-exam-realtime-rls.sql` (RLS policies on `internal_exam_sessions`, added to publication) |
| Server-side running-correct count, instructor-scoped | ✅ Complete | `app/api/instructor/exams/classes/[classId]/monitor/route.ts:45-58` computes `correctCount` vs `correctAnswer`; `:23` enforces `classItem.instructorId !== instructorProfile.id → forbidden`. (No persisted `runningCorrect` column — correctly computed on read per §3.3 performance caution.) |
| `lastActivityAt` heartbeat | ✅ Complete | `app/api/student/exams/internal/heartbeat/route.ts` |
| Recovery actions: extend / force-submit / resume | ✅ Complete | `app/api/staff/exams/internal/sessions/[id]/{extend,force-submit,resume}/route.ts` |
| `exam-timeout` cron (every 5 min) | ✅ Complete | `app/api/cron/exam-timeout/route.ts` + `vercel.json` `*/5 * * * *` |
| Violation review UI | ✅ Complete | `app/staff/exams/internal/_components/ViolationReviewPanel.tsx` + `app/api/staff/exams/internal/sessions/[id]/violations/[violationId]/review/route.ts` |

### Phase 4: Grading & Compliance Hardening
| Item | Status | Evidence |
|------|--------|----------|
| Server-authoritative timer (30s polling + cron) | ✅ Complete | `heartbeat/route.ts` + `exam-timeout` cron |
| Blind grading (`SECURITY DEFINER`, search_path hardened) | ✅ Complete | `prisma/migrations/internal-exam-grading.sql` (`submit_internal_exam_attempt`, `SECURITY DEFINER`, `SET search_path = pg_catalog, public`) |
| Paper randomisation (server-side shuffle + validate) | ✅ Complete | `lib/internal-exam/engine.ts:87-114` `buildRandomizedPaper`; wired in `app/api/student/exams/internal/start/route.ts:317,333`; validated in `app/api/student/exams/internal/submit/route.ts:55-56`. **Tracker incorrectly marks this PENDING.** |
| Hash-chain audit (immutability triggers) | ✅ Complete | `prisma/migrations/internal-exam-audit-chain.sql` (`deny_audit_modification` trigger + `compute_audit_chain_hash`) |
| SEB integration | ✅ Complete | `lib/middleware/seb-detection.ts`, `app/api/staff/exams/internal/sessions/[id]/seb-config/route.ts`, `sebRequired` schema `:2028`, `SEB_BROWSER_EXAM_KEY`/`SEB_ALLOWED_ORIGINS` in `lib/constants/business-rules.ts` |

### Phase 5: Polish & EASA Sign-Off
| Item | Status | Evidence |
|------|--------|----------|
| Accessibility exception documentation | ❌ Missing | No `ACCESSIBILITY.md` exists anywhere in the repo. Tracker claims "DOCUMENTED (§14.2, §15)" but those are plan sections, not a deliverable file. |
| EASA compliance documentation | ❌ Missing | No `docs/guides/easa-exam-compliance.md` exists. Only an unrelated audit `docs/audits/portal-audits/staff/staff-easa.md` is present. |
| Load test thresholds | ✅ Defined (not executed) | Thresholds defined in plan §12.6 / Phase 5. No executed load-test artifact found; "DEFINED" is accurate. |
| Final LLM Council audit | ❌ Pending | No LLM Council output doc produced for this build. Tracker correctly marks PENDING. |

---

## Remaining Gaps to Close for 100%

1. **Phase 5 — EASA compliance guide doc** (`docs/guides/easa-exam-compliance.md`): create the deliverable referenced by Phase 5. Currently missing.
2. **Phase 5 — Accessibility exception doc** (`ACCESSIBILITY.md`): create WCAG-waiver documentation for strict keypress + fullscreen lock + supervised pathway. Currently missing.
3. **`bun run db:push:supabase`**: mirror schema to Supabase replica (blocked on network/Supabase reachability).
4. **Enable Realtime on `internal_exam_sessions`** in Supabase Console + add to publication so the live monitor actually streams (the RLS migration SQL exists but the table is not enabled live).
5. **Unit tests** for `requireBankAccess` and class-start idempotency (tracker PENDING).
6. **Final LLM Council audit** against the MUST-FIX checklist (tracker PENDING).
7. **Strict-keypress `inInput` guard** (`InternalExamInterface.tsx:422`): when the always-focused hidden input is active, `inInput` is true and auto-submit is skipped — contradicts §14 "any key submits." Either remove the `inInput` early-return for the auto-submit path or focus a non-input element.
8. **Realtime RLS correctness**: `internal-exam-realtime-rls.sql` keys the instructor policy off `classes.instructorId = auth.uid()::text`, but `classes.instructorId` is a profile id (`ClassSession.instructorId → User` per plan §3.1). Confirm `auth.uid()` resolves to the profile id, not `User.id`, or the policy will silently match nothing (same camelCase/identity trap as the messages filter).
9. **Execute the load test** against the defined thresholds (currently only defined, not run).

---

## Tracker Corrections Applied (§23)

- **Phase 2b — Security test harness:** changed `PENDING` → `[x] COMPLETED` (evidence: `tests/e2e/anticheat-security.spec.ts`).
- **Phase 4 — Paper randomisation:** changed `PENDING` → `[x] COMPLETED` (evidence: `lib/internal-exam/engine.ts:110`, start `:317/333`, submit `:55-56`).
- **Phase 5 — Accessibility / EASA docs:** changed the `[x] DOCUMENTED` claims to reflect that no standalone deliverable files exist (marked as gaps to produce).
- All other PENDING items (db:push:supabase, Realtime enable, unit tests, LLM Council) remain PENDING and are accurate.
