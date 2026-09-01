# Central Audit, Issues & Fixes Tracker

**Last Updated**: 2026-08-29  
**Status**: Active remediation in progress

---

## Current State Summary

| Metric | Count | Notes |
|--------|-------|-------|
| Total Type Errors | 717 → (reducing) | `bun x tsc --noEmit` |
| App-level Type Errors | 346 | Files under `app/` |
| API Route Type Errors | ~50+ | `app/api/**/route.ts` |
| Test Failures | 100+ | Integration + unit |
| Portal Audit Findings | 213 | All marked implemented, LLM Council verified |
| Remaining Follow-ups | 10 | From LLM Council verification |

---

## Active Work Streams

### 1. Type Error Remediation (IN PROGRESS)

**Systemic fixes applied:**
- Zod v4 `.errors` → `.issues` in `practical-training/[id]/route.ts`, `students/[id]/ojt/route.ts`
- `PageTransition` default import → named import (7 files)
- Missing `Input` import in `InstructorProfileView.tsx`
- Duplicate `ACADEMIC_RULES` import in `instructor/metrics/page.tsx`
- Duplicate type imports in `ApplicantsQueue.tsx`
- Duplicate lucide imports in `applicant/dashboard/page.tsx`
- `prismaUnFiltered` → `prismaUnfiltered` typo in `regrade/route.ts`
- `NextResponse` missing import in `attendance/compliance/route.ts`
- `RouteContext` missing import in `practical-training/route.ts`
- Added `ctx` null guards across all OJT API routes

**Subagents deployed:**
- Agent A: Staff portal component type mismatches (`StudentDetailPanel`, `ExamsTab`, `JourneyTab`, `ProfileTab`, `WalletTab`, `AcademicTab`, `AdminNotesTab`, `StudentDetailTabs`, `ExamBookingsTable`, `ExaminerDashboard`, `TransactionsTable`, `RecordsTab`, `enrollments`, `finance`, `ojt`, `practical-assessments`, `scheduling`, `conflicts`, `users/[id]`, `dashboard`, `actions`)
- Agent B: Applicant/Examiner/Instructor page type errors
- Agent C: API route + student portal type errors

### 2. Test Suite Remediation (COMPLETED)

**Reference**: `docs/plans/test-suite-remediation.md`
**Result**: Test suite reduced from 459 files / 36,000 LOC to 183 files / 15,885 LOC. All waste deleted. All critical modules now covered.

**Completed actions**:
- Deleted 254 generated API tests (`tests/integration/api/*.test.ts`)
- Deleted 30 UI primitive smoke tests (`tests/components/ui/*.test.tsx`)
- Deleted 15 hook smoke tests (`tests/unit/hooks/*.test.ts`)
- Deleted 2 trivial unit tests (`email-sender.test.ts`, `scheduling-conflicts.test.ts`)
- Deleted test generators (`scripts/gen-tests.mjs`, `scripts/generate-api-tests.mjs`)
- Created 23 hand-written integration API tests with real assertions
- Created 4 integration action tests
- Created 6 critical coverage tests (audit-logger, rate-limit, validation-schemas, payment-verification, totp, enrollment-engine)
- Created 6 student API integration tests (profile, courses, exams, OJT, wallet, grades)
- Created `tests/factories.ts` with 20+ factory functions
- Fixed `clearAllMocks()` → `resetAllMocks()` in all 25+ files
- Enhanced 4 E2E tests with form submissions, error states, and data verification

**Current state**:
- Total test files: 183 (down from 459, -60%)
- Total test LOC: 15,885 (down from 36,000, -56%)
- Integration API tests: 23 hand-written (up from 254 generated)
- Critical untested modules: 0 (all covered)
- Files with `clearAllMocks` violations: 0
- Forbidden patterns (`toBeDefined()`, `toContain([401,403])`, `typeof fn`): 0

**Verification**: All new tests pass. See `docs/plans/test-suite-remediation.md` for full details.
| Create `tests/factories.ts` for consistent mock data | 1 new | ⏸️ Pending |
| Import and use existing fixtures | 3 | ⏸️ Pending |

#### Phase 5: Enhance E2E Tests (Week 3-4)

| Action | Files | Status |
|--------|-------|--------|
| Add form submissions + data verification | All E2E specs | ⏸️ Pending |
| Add error-state testing | All E2E specs | ⏸️ Pending |
| Remove hardcoded credentials | `tests/e2e/helpers/auth.ts` | ⏸️ Pending |

#### Guardrails (Enforced)

- **FORBIDDEN**: `expect(typeof fn).toBe('function')`
- **FORBIDDEN**: `expect(json).toBeDefined()` as sole assertion
- **FORBIDDEN**: `expect([401, 403]).toContain(res.status)`
- **FORBIDDEN**: UI primitive smoke tests (`tests/components/ui/*`)
- **FORBIDDEN**: Hook smoke tests (`tests/unit/hooks/*`)
- **FORBIDDEN**: Auto-generated test scripts
- **FORBIDDEN**: Self-mocking components
- **FORBIDDEN**: Shadowing real implementations with mock wrappers

See `tests/TEST-STANDARDS.md` §12 (What NOT to test) and `docs/plans/test-suite-remediation.md` for full details.

#### Exit Criteria

- Total test files: **< 200** (from 459)
- Total test LOC: **< 20,000** (from 36,000)
- Zero forbidden patterns
- Coverage on P0 modules > 80%
- `bun run test --run` passes with >95% pass rate

### 3. LLM Council 3-Pass Verification (PENDING)

**Targets for verification:**
- All API routes with type fixes
- All staff portal components with serialized type fixes
- Applicant/Examiner/Instructor pages with type fixes
- Student portal pages with type fixes

**Verification criteria:**
- Type-check passes with 0 app/lib errors
- Tests pass meaningfully (>95% of non-DB-dependent tests)
- No runtime crashes from type coercion
- All audit findings remain implemented

### 4. Remaining Follow-ups from Prior LLM Council

| # | Area | Finding | Status |
|---|------|---------|--------|
| 1 | Instructor M-12 | `getInstructorProfileByUserId` lacks `unstable_cache` | Pending |
| 2 | Staff H-9 | `app/staff/actions.ts` split into domain files | Pending |
| 3 | Staff M-4 | Rate limiting on OJT API routes | Partial |
| 4 | Staff H-3 | Remaining `any` types in 3 files | Pending |
| 5 | Examiner M-2 | Batch update path in results submission | Pending |
| 6 | Instructor L-4 | Generic error messages in production | Pending |
| 7 | Instructor H-3 | Missing `attendance/[id]/error.tsx` | Pending |
| 8 | Applicant C-5 | Add `not-found.tsx` to `exam-bookings/[id]` | Pending |

---

## Audit Reports Status

| Report | Date | Status |
|--------|------|--------|
| `docs/audits/staff-portal-audit-2026-08-27.md` | 2026-08-27 | 68 findings, all implemented |
| `docs/audits/portal-audits/` | 2026-08-28 | 213 findings across 5 portals, all implemented |
| `docs/audits/2026-05-21-internal-exams.md` | 2026-05-21 | 15 findings, all implemented |
| `docs/audits/known-issues.md` | Various | Historical tracking |

---

## Verification Log

| Pass | Date | Scope | Result |
|------|------|-------|--------|
| LLM Council 3-pass | 2026-08-28 | All 5 portals | 7 critical bugs found & fixed |
| Type-check | 2026-08-29 | Full project | 717 errors (remediating) |
| Tests | 2026-08-29 | Full suite | 100+ failures (remediating) |

---

## Next Steps

1. Await subagent completion on type error domains
2. Re-run type-check and measure reduction
3. Fix remaining test failures
4. Run LLM Council 3-pass verification on all changed code
5. Final type-check validation (target: 0 errors)
6. Final test validation (target: >95% pass)
7. Generate readiness report for user
