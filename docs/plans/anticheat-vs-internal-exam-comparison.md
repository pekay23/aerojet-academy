# Anti-Cheat Exam System vs Internal Exam System — Comparison & Integration Report

**Date:** 2026-08-30
**Audience:** Backend agents, frontend agents, implementers
**Status:** Comparative analysis — not yet implemented

---

## 1. Executive Summary

Two exam-system plans exist for Aerojet Academy:

| Plan | File | Scope | Primary Users |
|------|------|-------|---------------|
| **Internal Exam System** | `docs/plans/internal-exam-system-ui-plan.md` | Academy-internal MCQ exams for courses, classes, and instructors | Staff, Instructors, Students |
| **Anti-Cheat Exam System** | `.kilo/plans/1788099263147-anticheat-exam-system-plan.md` | EASA Part-66/Part-147 aviation certification exams with strict anti-cheat controls | Staff, Instructors, Students, Examiners, Applicants |

**Key finding:** These plans are **complementary, not competing**. The Internal Exam System handles day-to-day class assessment; the Anti-Cheat Exam System handles high-stakes external certification. They share the same Aerojet codebase, auth layer, and Prisma pattern but differ in regulatory requirements, threat model, and exam lifecycle.

**Recommendation:** Build the Internal Exam System first (Phases 1-5, ~5 weeks), then layer the Anti-Cheat Exam System as an extended module on top. The Anti-Cheat system reuses Internal Exam concepts (question banks, sessions, autosave) but adds mandatory anti-cheat controls, access-code gating, and EASA-specific compliance features.

---

## 2. Scope & Use-Case Comparison

### 2.1 Internal Exam System
- **Purpose:** Internal course assessment for Aerojet Academy students.
- **Context:** Academy-managed classes, instructors, and cohorts.
- **Stakes:** Medium — academic progress, not aviation licences.
- **Delivery:** Browser-based, desktop + tablet responsive.
- **Regulatory:** No external certification body oversight.
- **Current state:** Partially implemented schema (`InternalExamBank`, `InternalExamQuestion`, `InternalExamSession`). Staff UI exists. Instructor UI does not exist yet.

### 2.2 Anti-Cheat Exam System
- **Purpose:** High-stakes EASA Part-66/Part-147 certification exams.
- **Context:** Approved Maintenance Training Organisation (MTO) examinations; candidates may be external to the academy.
- **Stakes:** High — determines EASA Aircraft Maintenance Licence (AML) eligibility.
- **Delivery:** Browser-based with optional Safe Exam Browser (SEB) lockdown; desktop-only by design.
- **Regulatory:** Must comply with EASA ED Decision 2023/019/R, NPA 2023-10, H.C.A.A. March 2025 requirements, FAA Part-147 §147.23.
- **Current state:** Planning only — no schema, no routes, no UI.

### 2.3 Feature Matrix

| Feature | Internal Exam | Anti-Cheat Exam | Notes |
|---------|--------------|-----------------|-------|
| MCQ delivery | ✅ Planned | ✅ Planned | Shared core |
| Essay / subjective questions | ❌ Not planned | ✅ Planned | Anti-Cheat only |
| Question bank with versions | ✅ Existing | ✅ Planned | Anti-Cheat adds approval workflow |
| Question randomisation | ❌ Not planned | ✅ Planned | Anti-Cheat: per-candidate random paper |
| Option randomisation | ❌ Not planned | ✅ Planned | Anti-Cheat: per-question option shuffle |
| Server-authoritative timer | ✅ Partial (`expiresAt` + cron) | ✅ Planned (SSE/polling + DB deadline) | Anti-Cheat stricter |
| Auto-submit on expiry | ✅ Planned (cron) | ✅ Planned | Same mechanism |
| Auto-submit on key press | ❌ Not planned | ✅ Planned | **User clarified: any key = auto-submit, NO confirmation** |
| Fullscreen enforcement | ❌ Cosmetic only | ✅ Planned | Anti-Cheat: real Fullscreen API + overlay |
| Tab-switch detection | ❌ Not tracked server-side | ✅ Planned | Anti-Cheat: `visibilitychange` → violation table |
| Clipboard block (copy/paste) | ❌ Not planned | ✅ Planned | Anti-Cheat: client-side `preventDefault` |
| DevTools / PrintScreen block | ❌ Not planned | ✅ Planned | Anti-Cheat: keyboard hook + detection |
| Webcam proctoring | ❌ Not planned | ❌ Excluded by user | **User confirmed: no webcam needed** |
| SEB (Safe Exam Browser) | ❌ Not planned | ✅ Planned | Anti-Cheat: optional but recommended |
| Live instructor monitoring | ✅ Planned (Realtime) | ✅ Planned | Shared concept, different UI |
| Proctor review queue | ❌ Not planned | ✅ Planned | Anti-Cheat: violation review workflow |
| Realtime monitoring | ✅ Planned (Supabase Realtime) | ✅ Planned | Same infra, different event types |
| Class scheduling | ✅ Planned | ❌ Not planned | Internal only; Anti-Cheat uses session windows |
| Instructor analytics | ✅ Planned | ✅ Planned | Shared |
| Question import pipeline | ✅ Planned | ✅ Planned | Shared (PDF/DOCX/JSON) |
| RBAC / permissions | ✅ Existing + planned | ✅ Planned | Anti-Cheat maps to EASA roles |
| Audit log | ✅ Existing (`createAuditLog`) | ✅ Planned (hash-chain) | Anti-Cheat adds cryptographic chain |
| Violation tracking | ✅ Planned (`InternalExamViolation`) | ✅ Planned (`ExamViolation`) | Same concept, different schema |
| Recovery / resume | ✅ Planned | ✅ Planned | Anti-Cheat: same pattern but stricter |
| GDPR compliance | Partial | Full (DPIA, retention tiers) | Anti-Cheat: behavioural data implications |
| EASA compliance | ❌ Not applicable | ✅ Full | Anti-Cheat: Part-66/Part-147 specific |

---

## 3. Data Model Comparison

### 3.1 Internal Exam Schema (Existing + Planned)

| Model | Purpose | Key Fields |
|-------|---------|-----------|
| `InternalExamBank` | Question bank | `id`, `courseId`, `moduleCode`, `title`, `reviewState` |
| `InternalExamQuestion` | Question | `id`, `bankId`, `questionText`, `options`, `correctAnswer`, `explanation`, `knowledgeLevel` |
| `InternalExamQuestionVersion` | Version history | `id`, `questionId`, `changeType`, `changedById`, `changedAt` |
| `InternalExamBankInstructor` | Instructor assignment | `id`, `bankId`, `instructorId`, `canEdit`, `canReview`, `canMonitor`, `canPublish` |
| `InternalExamClassSchedule` | Class scheduling | `id`, `bankId`, `classId`, `scheduledStart`, `scheduledEnd`, `isActive` |
| `InternalExamSession` | Exam session | `id`, `studentId`, `bankId`, `classId`, `status`, `score`, `percentage`, `passed`, `expiresAt`, `lastActivityAt`, `timeExtensionSec` |
| `InternalExamAnswer` | Student answer | `id`, `sessionId`, `questionId`, `selectedAnswer`, `isCorrect` |
| `InternalExamViolation` | Violation event | `id`, `sessionId`, `studentId`, `type`, `severity`, `detail`, `reviewedAt`, `reviewOutcome` |
| `InternalExamReport` | Post-exam report | `id`, `sessionId`, `generatedAt` |

### 3.2 Anti-Cheat Exam Schema (Planned)

| Model | Purpose | Key Fields |
|-------|---------|-----------|
| `Exam` | Exam definition | `id`, `title`, `moduleCode`, `licenceCategory`, `durationMinutes`, `passMark`, `config` (JSON), `status` |
| `ExamSession` | Scheduled exam window | `id`, `examId`, `startTime`, `endTime`, `location`, `invigilatorId` |
| `ExamAccessCode` | One-time access code | `id`, `sessionId`, `code`, `candidateId`, `used`, `usedAt`, `expiresAt` |
| `ExamRegistration` | Pre-exam student form | `id`, `sessionId`, `userId`, `fullName`, `email`, `dob`, `nationality`, `licenceCategory`, `moduleCode`, `examDate`, `examLocation`, `idDocumentType`, `idDocumentNumber`, `photoUrl`, `consentGiven`, `signatureData`, `retentionCategory` |
| `ExamAttempt` | Candidate attempt | `id`, `registrationId`, `examId`, `status`, `startedAt`, `submittedAt`, `score`, `passed`, `autoSubmitted`, `violationCount`, `certificateUrl`, `answers`, `violations` |
| `ExamAnswer` | Answer per question | `id`, `attemptId`, `questionId`, `selectedOption`, `textAnswer`, `isCorrect` |
| `ExamViolation` | Violation event | `id`, `attemptId`, `type`, `severity`, `detail`, `timestamp` |
| `ExamQuestion` | Question | `id`, `examId`, `questionText`, `questionType`, `options`, `correctAnswer`, `explanation`, `moduleSubsection`, `knowledgeLevel`, `sortOrder` |

### 3.3 Schema Gaps & Overlaps

**Overlap (can be unified):**
- `InternalExamQuestion` vs `ExamQuestion` — same purpose, different naming. Anti-Cheat adds `moduleSubsection`, `sortOrder` (EASA-specific). Internal Exam already has `knowledgeLevel`. **Recommendation:** Merge into a single `Question` model with an `examType` discriminator (`INTERNAL` vs `CERTIFICATION`).
- `InternalExamViolation` vs `ExamViolation` — same concept. Anti-Cheat adds `severity`, `detail`. **Recommendation:** Merge into `ExamViolation` with polymorphic `sessionId`/`attemptId` and a `source` enum.
- `InternalExamSession` vs `ExamAttempt` — Anti-Cheat's `ExamAttempt` is more granular (bound to `ExamRegistration`). Internal Exam's `InternalExamSession` is simpler. **Recommendation:** Keep `InternalExamSession` for internal flow; use `ExamAttempt` for certification flow.

**Gap (Anti-Cheat adds):**
- `ExamAccessCode` — no equivalent in Internal Exam. Needed for external candidate gating.
- `ExamRegistration` — no equivalent. Pre-exam form captures EASA-required fields.
- `ExamSession` (scheduling window) — differs from `InternalExamClassSchedule`. Anti-Cheat uses time-bound access codes rather than class-linked windows.
- `Exam` (top-level exam definition) — no equivalent. Internal Exam uses `InternalExamBank` + `InternalExamClassSchedule` for the same purpose but with different semantics.

**Gap (Internal Exam adds):**
- `InternalExamBankInstructor` — instructor-to-bank assignment with capability flags. Anti-Cheat does not model instructor permissions (relies on role-based guards).
- `InternalExamClassSchedule` — class-to-bank scheduling. Anti-Cheat uses session-level access codes instead.
- `InternalExamQuestionVersion` — version history per question. Anti-Cheat does not plan version history (relies on approval workflow).

---

## 4. Architecture & Control Comparison

### 4.1 Anti-Cheat Controls

| Control | Internal Exam | Anti-Cheat Exam | Source |
|---------|--------------|-----------------|--------|
| Fullscreen lock | ❌ None | ✅ Fullscreen API + overlay | Anti-Cheat §3.3 |
| Tab-switch detection | ❌ Client-only state | ✅ Server-side `visibilitychange` → `ExamViolation` | Anti-Cheat §3.3, §5.1 |
| Clipboard block | ❌ Not planned | ✅ `preventDefault` on copy/paste/cut | Anti-Cheat §3.3 |
| DevTools detection | ❌ Not planned | ✅ `debugger` timing + `outerWidth` check | Anti-Cheat §3.3 |
| PrintScreen block | ❌ Not planned | ✅ `keydown` interception | Anti-Cheat §3.3 |
| Keyboard shortcut block | ❌ Not planned | ✅ Ctrl+C/V/P, F12, Alt+Tab | Anti-Cheat §3.3 |
| Multi-tab prevention | ❌ Not planned | ✅ `BroadcastChannel` + `localStorage` | Anti-Cheat §3.3 |
| Webcam capture | ❌ Not planned | ❌ Excluded by user | User directive |
| SEB enforcement | ❌ Not planned | ✅ `.seb` config + BEK verification | Anti-Cheat §3.3 |
| Server-authoritative timer | ✅ Partial (`expiresAt` + cron) | ✅ Planned (SSE/polling + DB deadline) | Anti-Cheat §3.4 |
| Auto-submit on key press | ❌ Not planned | ✅ **Any key triggers submit, NO confirmation** | Anti-Cheat §3.5, User directive |
| Access-code gating | ❌ Not planned | ✅ One-time, time-bound, candidate-bound | Anti-Cheat §3.1, §3.2 |
| Pre-exam identity form | ❌ Not planned | ✅ Personal details, photo ID, consent | Anti-Cheat §3.2 |
| Blind grading | ❌ Not planned | ✅ `SECURITY DEFINER` function | Anti-Cheat §3.6 |
| Hash-chain audit log | ❌ Not planned | ✅ Append-only with `previous_hash` | Anti-Cheat §3.8 |

### 4.2 Recovery & Time Preservation

| Feature | Internal Exam | Anti-Cheat Exam |
|---------|--------------|-----------------|
| Heartbeat endpoint | ✅ Planned (`POST /heartbeat`) | ❌ Not planned |
| Server-side auto-submit cron | ✅ Planned (`/api/cron/exam-timeout`) | ✅ Planned |
| Time extension | ✅ Planned (`timeExtensionSec`) | ❌ Not planned |
| Resume after disconnect | ✅ Planned | ❌ Not planned |
| Force-submit by instructor | ✅ Planned | ❌ Not planned |
| Void + retake | ✅ Planned | ❌ Not planned |

**Finding:** The Internal Exam System has a **more mature recovery model** (heartbeat, resume, time extension, force-submit). The Anti-Cheat Exam System's stricter posture (no resume, no extension) aligns with EASA "controlled environment" requirements but lacks the operational resilience the Internal Exam System plans.

**Recommendation:** Adopt the Internal Exam System's recovery primitives (heartbeat, auto-submit cron, force-submit) into the Anti-Cheat Exam System. For EASA compliance, restrict time extensions to invigilator-only actions with audit logging. Do not allow candidate-initiated resume without invigilator approval.

---

## 5. Realtime & Monitoring Comparison

### 5.1 Internal Exam Realtime
- **Events:** `exam_started`, `exam_submitted`, `exam_voided`, `exam_published`
- **Subscription model:** GET-first initial fetch + Realtime deltas
- **Throttling:** Per-student 5s throttle, debounced batch refresh
- **Instructor monitor:** Live session table with progress, score, status
- **Student side:** No live monitoring needed

### 5.2 Anti-Cheat Exam Realtime
- **Events:** Not explicitly defined, but violation events stream to server
- **Subscription model:** Not planned for live monitoring (relies on post-exam review)
- **Throttling:** Not addressed
- **Instructor/proctor monitor:** Not planned in Phase 1
- **Student side:** Anti-cheat events POSTed to server

**Finding:** The Internal Exam System has a **complete realtime monitoring architecture** with throttling, fallback, and RLS. The Anti-Cheat Exam System has no realtime monitoring plan — violations are logged but not streamed to a live proctor dashboard.

**Recommendation:** Adopt the Internal Exam System's realtime monitoring pattern for the Anti-Cheat Exam System's proctor dashboard. Stream `ExamViolation` INSERT events to the proctor view using the same GET-first + Realtime delta pattern. Apply the same throttling, debouncing, and RLS rules.

---

## 6. API Route Comparison

### 6.1 Internal Exam API Routes

| Route | Purpose |
|-------|---------|
| `GET /api/staff/exams/internal/operations/sessions` | Admin session list |
| `POST /api/student/exams/internal/start` | Student starts exam |
| `GET /api/student/exams/internal/session` | Student session detail |
| `POST /api/student/exams/internal/heartbeat` | Student heartbeat |
| `POST /api/student/exams/internal/violation` | Student violation report |
| `POST /api/staff/exams/internal/sessions/[id]/extend` | Instructor extends time |
| `POST /api/staff/exams/internal/sessions/[id]/force-submit` | Instructor force-submits |
| `POST /api/staff/exams/internal/sessions/[id]/void` | Instructor voids session |
| `GET /api/instructor/exams/banks` | Instructor bank list |
| `GET /api/instructor/exams/classes` | Instructor class list |
| `POST /api/instructor/exams/classes/[classId]/start` | Instructor starts class exam |

### 6.2 Anti-Cheat Exam API Routes

| Route | Purpose |
|-------|---------|
| `GET /api/exams` | Exam CRUD |
| `GET /api/exams/[id]/access-codes` | Generate/validate access codes |
| `GET /api/exams/[id]/attempts` | Create attempt, submit, grade |
| `POST /api/exams/proctoring/events` | Receive client-side violation events |
| `POST /api/exams/proctoring/webcam` | Upload webcam snapshots (excluded by user) |
| `GET /api/exams/certificate/[attemptId]` | Generate signed PDF (excluded by user) |
| `GET /api/exams/audit` | Query audit log |

**Finding:** The Internal Exam System has a **richer instructor action set** (extend, force-submit, void). The Anti-Cheat Exam System has a **richer candidate-facing set** (access codes, pre-exam form, certificate).

**Recommendation:** Merge the action sets. The Anti-Cheat Exam System needs instructor recovery actions (extend, force-submit, void) from the Internal Exam System. The Internal Exam System needs access-code gating and pre-exam forms from the Anti-Cheat Exam System if it ever handles external candidates.

---

## 7. LLM Council Remediation Integration

The Anti-Cheat Exam System plan was audited by three LLM Council personas. The following sections integrate those findings into this comparison, with specific implementation guidance.

**Excluded per user directive:**
- ❌ Webcam proctoring (not needed)
- ❌ Certificate generation (not needed yet)
- ❌ Auto-submit confirmation dialog (strict keypress = immediate auto-submit)

### 7.1 MUST-FIX Items (Blocking)

| # | Issue | Source | Resolution | Implementation Guidance |
|---|-------|--------|------------|------------------------|
| 1 | `SECURITY DEFINER` grading function lacks `search_path` hardening | Security Auditor | Add `SET search_path = pg_catalog, public` | Add Prisma migration with explicit `search_path`. Add lint script scanning migrations for `SECURITY DEFINER`. |
| 2 | Server-side paper binding & answer validation missing | Security Auditor | Re-derive randomised paper server-side; reject answers not in paper | Store `ExamAttempt.questionOrder` JSONB. In `submit_attempt`, JOIN with question order and reject unknown `questionId`s. Never trust client `isCorrect`. |
| 3 | Audit immutability claimed but not enforced | Security Auditor + EASA Compliance | Add `BEFORE UPDATE/DELETE` trigger on `audit_logs`; add `CHECK (previous_hash IS NOT NULL)` | Prisma migration with `CREATE TRIGGER audit_logs_no_modify BEFORE UPDATE OR DELETE ON audit_logs FOR EACH ROW EXECUTE FUNCTION deny_audit_modification()`. |
| 4 | EASA "controlled environment" gap unresolved | EASA Compliance | Restrict to SEB + managed hardware + live invigilation, or scope to on-site only | Add `ExamSession.invigilatorId` (required). Add `Exam.config.sebRequired` boolean. Document in `docs/guides/easa-exam-compliance.md`. |
| 5 | No DPIA + lawful-basis analysis for biometric data | Privacy Advocate | Complete DPIA (Article 35) before behavioural logging | Even without webcam, keystroke/mouse patterns are behavioural biometrics under GDPR Article 9. Draft DPIA before Phase 1. Add granular consent toggles. |
| 6 | Auto-submit on violations must be flag-and-review, not silent termination | EASA Compliance + Security | Violations flag for human review; exam finalises only after review | Change `ExamAttempt.autoSubmitted` to `ExamViolation.reviewOutcome`. Strict keypress auto-submit (user directive) routes to `CRITICAL` violation → invigilator review. |
| 7 | EU AI Act scoping absent | Privacy Advocate | Classify AI proctoring as high-risk or document legal sign-off for out-of-scope | If AI proctoring deferred, document legal basis for exclusion. If added later, define human oversight and accuracy controls now. |
| 8 | Access-code candidate-binding after form entry | Security Auditor | Bind/validate candidate identity at code-entry time | `/exams/[code]` route resolves candidate via `ExamAccessCode.candidateId` or email match before rendering pre-exam form. |
| 9 | No `ExamAttempt.status` state machine | Systems Architect | Add `status` enum + atomic transitions | Prisma `@default('pending')`. Single `transitionAttempt(attemptId, newStatus)` function with `SELECT ... FOR UPDATE`. |
| 10 | SSE-per-second timer is a Vercel deployment blocker | Performance Engineer + SRE | Replace with 30s polling + cron auto-submit | `GET /api/exams/attempts/[id]/timer` returns `{ remainingMs, expiresAt }`. Client polls every 30s. Server enforces deadline at submission. |
| 11 | Auto-submit on any key press violates WCAG | Accessibility Advocate | Document accessibility exception for regulated exams | User confirmed strict keypress. Document exception under EASA controlled-environment rules. Provide supervised alternative for disabled candidates. |
| 12 | GDPR/EASA retention conflict | SRE + Tech Lead | Add `retentionCategory` enum (`INTEGRITY`, `PII`, `BOTH`) | GDPR sweep redacts `PII` columns but preserves `INTEGRITY` rows. Applied to `ExamAttempt`, `ExamAnswer`, `ExamViolation`, `ExamRegistration`. |
| 13 | Server crash recovery not specified | SRE + QA | Add recovery cron | `POST /api/cron/recover-exams` (gated by `CRON_SECRET`) runs every 60s, auto-submitting expired attempts via grading function. |
| 14 | Exam config JSON lacks TypeScript schema | Tech Lead | Define `ExamConfig` Zod schema | `lib/validation/exam-schema.ts` with `ExamConfigSchema` (fullscreen, sebRequired, violationThreshold, strictMode). Use in Prisma defaults and route validators. |
| 15 | Security test harness missing | QA Strategist | Add Playwright security config | `playwright.security.config.ts` with `--headed` mode. `npm run test:security` script. Test fullscreen block, clipboard block, DevTools detection, keypress auto-submit. |
| 16 | Key-press auto-submit semantics undefined | Tech Lead | User clarified: any key = auto-submit, NO confirmation | Implement `document.keydown` listener with 100ms debounce. Exclude modifier-only keys (Shift, Ctrl, Alt, Meta). Log every keypress-triggered submit as `CRITICAL` violation. |
| 17 | Proctor review queue not modeled | Tech Lead | Extend `ExamViolation` with review fields | Add `reviewedAt`, `reviewedBy`, `reviewOutcome` to `ExamViolation`. Add `POST /api/exams/proctoring/violations/[id]/review` endpoint. |
| 18 | SEB integration deferred to Phase 4 | Tech Lead | Move to Phase 2 | Move SEB `.seb` config download + BEK verification to Phase 2 (with `sebRequired: false` default). |

### 7.2 RECOMMENDED Improvements (Address During Implementation)

| # | Issue | Source | Resolution | Implementation Guidance |
|---|-------|--------|------------|------------------------|
| 19 | N+1 question delivery risk | Performance Engineer | Batch-fetch randomised question order on `ExamAttempt` creation | Compute randomised order server-side, store as `ExamAttempt.questionOrder` JSONB, deliver full array to client in one response. |
| 20 | Violation event flood | Performance Engineer | Queue violations client-side, batch-upload every 10s | Client-side queue array. Flush on `beforeunload` and every 10s via `POST /api/exams/proctoring/events/batch`. |
| 21 | Anti-cheat SDK bundle size / jank | Performance Engineer + Accessibility | Lazy-load SDK; show loading state | `next/dynamic` with `ssr: false` for anti-cheat SDK. Non-animated "Securing exam environment..." loading state. |
| 22 | Polymorphic answer/grading model gap | Systems Architect | Add `gradingType` / `gradingStatus` | `ExamQuestion.gradingType` enum (`MCQ`, `ESSAY`, `MSQ`). `ExamAnswer.gradingStatus` (`auto` | `pending_instructor` | `graded`). |
| 23 | Circular dependency risk in anti-cheat SDK | Systems Architect | Adopt barrel-file pattern | `lib/exam/index.ts` barrel. SDK imports from `lib/exam/types.ts` only. Audit logger imports from `lib/exam/types.ts` for exam types. |
| 24 | No ARIA live regions for fullscreen entry | Accessibility Advocate | Add ARIA live region announcements | Announce "Entering fullscreen exam mode" before fullscreen entry. Focus first question after entry. |
| 25 | Accessibility exception documentation | Accessibility Advocate | Add `ACCESSIBILITY.md` | Document WCAG criteria met, waived with regulatory justification (strict keypress, fullscreen lock), and alternative supervised delivery pathway. |
| 26 | Question bank size for high-stakes modules | EASA Compliance | Larger banks (>5x) for high-stakes modules | Minimum 10x questions for EASA Part-66 modules. Wire post-exam analytics to auto-flag questions for review. |
| 27 | No `ExamAttempt.status` state machine | Systems Architect | Add status enum + atomic transitions | See MUST-FIX #9. Also add `autoSubmitted` boolean and `submittedAt` timestamp. |
| 28 | No recovery cron for expired attempts | SRE + QA | Add `/api/cron/recover-exams` | See MUST-FIX #13. Also add `lastActivityAt` to `ExamAttempt` for stale detection. |

### 7.3 ACCEPTABLE Trade-Offs

| Trade-Off | Justification | Condition |
|-----------|---------------|-----------|
| **Client-side anti-cheat is knowingly bypassable.** No client-side control can be fully tamper-proof. Server-side controls (timer, blind grading, access codes, hash chain) are the real trust boundary. | Client-side violations are signals, not enforcement. | Client-side violations must be logged and reviewed; they are never sole basis for adverse action. |
| **Fullscreen lock cannot be made fully accessible.** Fullscreen is a browser API with no screen-reader-friendly alternative. EASA requires controlled environments. | Document as regulated exception; offer supervised in-person alternative. | Formal accessibility exception documented with legal/compliance sign-off. |
| **500 concurrent candidates on Vercel is unrealistic without architecture changes.** Vercel serverless is not designed for 500 persistent connections. | Acceptable if deployment target is documented. For >200, recommend containerised runtime or separate exam service. | Document realistic concurrency ceiling for chosen deployment target. |
| **Webcam excluded per user directive.** No webcam proctoring in Phase 1. | User confirmed no webcam needed. | Revisit in Phase 4 if EASA compliance or fraud prevention requires it. |
| **Certificate generation excluded per user directive.** | User confirmed not needed yet. | Revisit in Phase 4 when EASA compliance requires Certificates of Recognition. |
| **Strict keypress auto-submit without confirmation.** | User confirmed: any key = auto-submit, NO confirmation. | Document as regulated exception. Implement with modifier-key exclusion (Shift, Ctrl, Alt, Meta) to prevent accessibility-tool false positives. |

---

## 8. Unified Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2) — Build Internal Exam System first

1. **Schema:** `InternalExamBankInstructor`, `InternalExamClassSchedule`, `InternalExamViolation`, bank `reviewState`.
   - Run `bun run db:push` and `bun run db:push:supabase`.
   - Enable Realtime on `internal_exam_sessions` in Supabase Console.
2. **RBAC:** `requireBankAccess(bankId, capability)` helper.
3. **Staff UI:** Instructor assignment, class scheduling.
4. **Backend:** Staff assignment/schedule API routes with `createAuditLog`.
5. **Tests:** Generated route tests, unit test for `requireBankAccess`.

### Phase 2: Instructor Experience (Weeks 3-4)

1. **Nav:** Add "Exams" link to `InstructorSidebar`.
2. **Dashboard:** `/instructor/exams` with tabs (My Questions, My Banks, Module Bank, My Classes, Live Monitor).
3. **Question editor:** Read/write per `canEdit`/`canReview`.
4. **Class monitor:** GET-first population + Realtime deltas.
5. **Analytics:** SQL `groupBy` aggregations, CSV export.
6. **Anti-Cheat additions:** Access-code generation API, pre-exam student form, `Exam`/`ExamSession`/`ExamAccessCode`/`ExamRegistration` models.

### Phase 3: Live Monitoring & Anti-Cheat (Weeks 5-8)

1. **Realtime:** Supabase Realtime with RLS, throttling, debounced refresh, polling fallback.
2. **Instructor recovery:** Extend, force-submit, void (reuse Internal Exam operations).
3. **Anti-cheat client SDK:** Fullscreen lock, tab-switch detection, clipboard block, DevTools block, PrintScreen block, keyboard shortcut block, multi-tab prevention.
4. **Violation logging:** `POST /api/exams/proctoring/events` (batch), server-side severity classification.
5. **Proctor dashboard:** Live violation feed, session detail with violation timeline.
6. **Server-authoritative timer:** Replace SSE with 30s polling + cron auto-submit.

### Phase 4: Grading & Hardening (Weeks 9-12)

1. **Server-side blind grading:** `SECURITY DEFINER` function with `search_path` hardening.
2. **Answer validation:** Server-side paper binding; reject answers not in candidate's randomised paper.
3. **Essay grading UI:** Instructor rubric for `ESSAY` questions.
4. **Audit log:** Hash-chain implementation with DB-level immutability trigger.
5. **SEB integration:** `.seb` config download + BEK verification (moved from Phase 4 to Phase 2).
6. **Security test harness:** Playwright headed tests for anti-cheat bypass scenarios.

### Phase 5: Compliance & Polish (Weeks 13-16)

1. **DPIA:** Complete GDPR Article 35 assessment for behavioural biometrics.
2. **Accessibility exception:** Document WCAG waivers with regulatory justification.
3. **EASA compliance:** Invigilator workflow, session log format, question bank metadata validation.
4. **Crash recovery:** Startup recovery cron for expired attempts.
5. **Load testing:** k6 script with 100-concurrent target.
6. **Retention tiers:** Implement `retentionCategory` + GDPR sweep integration.

---

## 9. Key Differences Summary

| Dimension | Internal Exam | Anti-Cheat Exam | Winner / Merge Strategy |
|-----------|--------------|-----------------|------------------------|
| **Question banks** | Per-course, per-instructor | Per-module, EASA-taxonomy | Merge: `Exam` with `type` discriminator |
| **Scheduling** | Class-linked windows | Access-code windows | Keep both: class windows for internal, access codes for certification |
| **Candidate identity** | Logged-in student | Access-code + pre-exam form | Merge: pre-exam form for both, access-code only for external candidates |
| **Anti-cheat** | None (cosmetic) | Full lockdown suite | Adopt Anti-Cheat controls for both (raise internal exam integrity) |
| **Violation tracking** | Planned table | Planned table | Merge into unified `ExamViolation` |
| **Recovery** | Heartbeat, resume, extend | None planned | Adopt Internal Exam recovery for both |
| **Realtime** | GET-first + deltas + throttling | Not planned | Adopt Internal Exam pattern for both |
| **Grading** | Auto-grade MCQ | Blind grading via `SECURITY DEFINER` | Adopt blind grading for both |
| **Audit** | `createAuditLog` rows | Hash-chain table | Merge: hash-chain `audit_logs` table with `Exam` as entity |
| **Compliance** | None | EASA, GDPR, EU AI Act | Anti-Cheat compliance layer only |

---

## 10. Final Recommendations

1. **Build Internal Exam System first** (5 weeks). It has clearer scope, existing schema, and immediate user value.
2. **Unify the data model** around a single `Exam` table with `ExamType` discriminator. Avoid maintaining two parallel exam schemas.
3. **Adopt Internal Exam's recovery model** (heartbeat, resume, extend, force-submit) for Anti-Cheat exams, gated by invigilator permissions.
4. **Adopt Internal Exam's realtime pattern** (GET-first + deltas, throttling, RLS, polling fallback) for Anti-Cheat proctor dashboard.
5. **Implement Anti-Cheat's anti-cheat controls** (fullscreen, tab-switch, clipboard, DevTools, PrintScreen, keyboard block, multi-tab prevention) for both exam types.
6. **Resolve all MUST-FIX items** from the LLM Council audits before Phase 1 coding begins. The 18 MUST-FIX items are listed in Section 7.1 with specific implementation guidance.
7. **Address RECOMMENDED improvements** during implementation. The 10 recommended items in Section 7.2 improve scalability, accessibility, and testability.
8. **Document trade-offs** formally. The 6 acceptable trade-offs in Section 7.3 should be recorded in the project's ADR (Architecture Decision Record) for future reference.

---

*End of Comparison Report*
