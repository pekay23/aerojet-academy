# Aerojet Academy — Full Portal Audit

**Date:** 2026-09-04  
**Scope:** All 5 portals (`staff/`, `student/`, `instructor/`, `applicant/`, `examiner/`), Prisma schema, code quality/type safety, ESLint `no-explicit-any`  
**Status:** Audits complete | Fixes in progress  
**Method:** 7 parallel subagent audits + grep/read verification + LLM Council review per phase

---

## Audit Completion Checklist

- [x] Staff portal audit (pages, data reliability, correctness, type safety, schema usage)
- [x] Student portal audit (pages, data reliability, correctness, type safety, schema usage)
- [x] Instructor portal audit (pages, data reliability, correctness, type safety, schema usage)
- [x] Applicant portal audit (pages, data reliability, correctness, type safety, schema usage)
- [x] Examiner portal audit (pages, data reliability, correctness, type safety, schema usage)
- [x] Prisma schema correctness and relation completeness audit
- [x] Code quality and type safety audit (including ESLint `no-explicit-any`)
- [x] Consolidated report and phased remediation plan

---

## Executive Summary

| Area                         | Severity | Count                                     | Status      |
| ---------------------------- | -------- | ----------------------------------------- | ----------- |
| **Data correctness bugs**    | 🔴 P0    | 15+                                       | Not started |
| **Type safety / `any` debt** | 🔴 P1    | ~700+ explicit `any`, 150+ casts          | Not started |
| **Schema relation gaps**     | 🟡 P2    | ~30 actor fields, ~12 indexes             | Not started |
| **RLS client misuse**        | 🟡 P2    | 30+ files in student/applicant/instructor | Not started |
| **Performance / pagination** | 🟡 P2    | Multiple unbounded queries                | Not started |
| **Code duplication**         | 🟡 P3    | 10+ patterns                              | Not started |
| **Dead/empty files**         | 🟢 Low   | 3 files                                   | Not started |
| **Missing `loading.tsx`**    | 🟢 Low   | 1 confirmed                               | Not started |

---

## Phase 0: Production Blocker Fixes

**Goal:** Fix all data correctness bugs that produce wrong data or crashes.  
**Estimated effort:** 1 day  
**Status:** Complete

| #   | Issue                                                                        | File(s)                                                                                                                                      | Fix                                                                                         | Verified | Committed |
| --- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------- | --------- |
| 1   | Class roster built from `AttendanceRecord` instead of `Enrollment`           | `app/staff/classes/[id]/roster/page.tsx`                                                                                                     | Query `Enrollment` for the class                                                            | ✅       | ☐         |
| 2   | `fetchApplicants` "all" tab returns same as "pending_payment"                | `app/staff/actions/applicants.ts`                                                                                                            | Removed stray `else { status: 'PENDING' }`                                                  | ✅       | ☐         |
| 3   | Records tab module merge uses substring matching (M1 ↔ M10 collision)        | `app/staff/exams/page.tsx`                                                                                                                   | Exact `moduleCode` + `attemptType` equality                                                 | ✅       | ☐         |
| 4   | Hardcoded pass mark `75` instead of `ACADEMIC_RULES.EASA_PASS_MARK`          | `app/staff/actions/{bookings,results}.ts`, `app/staff/exams/_components/RecordsTab.tsx`, `lib/actions/instructor.ts`, instructor class files | Import `ACADEMIC_RULES`                                                                     | ✅       | ☐         |
| 5   | `'PENDING'` enum write in examiner results (invalid `ExamAttendanceStatus`)  | `app/examiner/results/actions.ts`                                                                                                            | Replace with `null`                                                                         | ✅       | ☐         |
| 6   | ExaminerDashboard renders non-existent `ExamSitting` fields                  | `app/staff/_components/ExaminerDashboard.tsx`                                                                                                | Use `capacity`; derive name from `examComponent.course.name`                                | ✅       | ☐         |
| 7   | ExaminerDashboard links navigate to staff portal                             | `app/staff/_components/ExaminerDashboard.tsx`                                                                                                | Change to `/examiner/sittings/`                                                             | ✅       | ☐         |
| 8   | Result deletion is dangerously broad (cross-examiner contamination)          | `app/examiner/results/actions.ts`                                                                                                            | Soft-delete with `moduleCode`/`examId` scoping                                              | ✅       | ☐         |
| 9   | Soft-deleted results pollute examiner queries                                | `app/examiner/results/page.tsx`, `actions.ts`, `app/api/staff/students/[id]/exam-record/route.ts`                                            | Add `deletedAt: null`                                                                       | ✅       | ☐         |
| 10  | EXAM_ONLY dashboard redirects to wrong page                                  | `app/applicant/dashboard/page.tsx`                                                                                                           | Redirect to `/applicant/exam-only/dashboard`                                                | ✅       | ☐         |
| 11  | `deriveStatus()` conflates states                                            | `app/applicant/dashboard/page.tsx`                                                                                                           | Use explicit checks against `Application.stage`; moved `paymentApprovedAt` to `User` select | ✅       | ☐         |
| 12  | Instructor class detail attendance query uses wrong ID                       | `app/instructor/classes/[id]/page.tsx`                                                                                                       | Use `targetId` instead of `id`                                                              | ✅       | ☐         |
| 13  | Instructor schedule filters exam sittings by examiner role                   | `app/instructor/schedule/page.tsx`                                                                                                           | Removed invalid examiner filter                                                             | ✅       | ☐         |
| 14  | `submitGrade` doesn't recalculate percentage/grade                           | `lib/actions/instructor.ts`                                                                                                                  | Already recalculates `percentage` and `grade` via `calculateLetterGrade`                    | ✅       | ☐         |
| 15  | Decimal comparison `score: 0` with `Decimal` type                            | `lib/actions/instructor.ts`                                                                                                                  | Use `score: 0.00`                                                                           | ✅       | ☐         |
| 16  | Next.js 16 slug conflict: `manifest/page.tsx` uses `eventId` instead of `id` | `app/staff/exams/events/[id]/manifest/page.tsx`                                                                                              | Rename to `{ id: string }`                                                                  | ✅       | ☐         |
| 17  | `/api/calendar/[userId]` has no auth check                                   | `app/api/calendar/[userId]/route.ts`                                                                                                         | Auth check already present (session + ownership/staff roles)                                | ✅       | ☐         |

**Phase 0 LLM Council Reviews:**

- [x] Review 1 complete (Data Integrity Auditor)
- [x] Review 2 complete (Type Safety Advocate)
- [x] Review 3 complete (Performance & Security Engineer)
- [x] All issues resolved

---

## Phase 1: Type Safety & `any` Remediation

**Goal:** Reduce explicit `any` by 80%+ and upgrade ESLint rule to `error`.  
**Estimated effort:** 3–4 weeks  
**Status:** Complete

| Week | Focus                        | Scope                                                                  | Verified | Committed |
| ---- | ---------------------------- | ---------------------------------------------------------------------- | -------- | --------- |
| 1a   | Shared interfaces & types    | `lib/types/`, component prop types, `RecordsTab`, `StudentDetailPanel` | ✅       | ☐         |
| 1b   | Unsafe `as any` casts        | `where`/`orderBy` builders, Prisma query results, API payloads         | ✅       | ☐         |
| 2a   | Error handler typing         | All `catch (error: any)` → `unknown` + guards                          | ✅       | ☐         |
| 2b   | Client component prop typing | Charts, tables, dialogs with `any` props                               | ✅       | ☐         |
| 3    | Remaining `any` in pages     | Academic calendar, schedule pages, exam interfaces                     | ✅       | ☐         |
| 4    | Upgrade ESLint rule + sweep  | Change `'warn'` → `'error'`, fix remaining, remove suppressions        | ✅       | ☐         |

**Phase 1 LLM Council Reviews:**

- [x] Review 1 complete
- [x] Review 2 complete
- [x] Review 3 complete
- [x] All issues resolved

---

## Phase 2: Schema Relations & Indexes

**Goal:** Eliminate N+1 queries and improve data integrity.  
**Estimated effort:** 4–6 weeks  
**Status:** Not started

| Week | Focus                                  | Scope                                                                                                                | Verified | Committed |
| ---- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------- | --------- |
| 1    | Migration planning                     | Design all FK additions, back-relations, index additions                                                             | ☐        | ☐         |
| 2–3  | Actor/audit field migrations           | ~30 `User` relations across operational tables                                                                       | ☐        | ☐         |
| 3–4  | Missing relation migrations            | `Certificate.sessionId`, `FullTimeEnrollment.academicYearId`, `ExamResult.sittingId`, `OJTLogbook.licenceCategoryId` | ☐        | ☐         |
| 4–5  | Index additions                        | ~20 composite indexes on hot query paths                                                                             | ☐        | ☐         |
| 5–6  | Nullability fixes + dead field removal | `Enrollment.semesterId`, `OjtPeriod.endDate`, `requiresAlternativeProctoring`                                        | ☐        | ☐         |

**Phase 2 LLM Council Reviews:**

- [ ] Review 1 complete
- [ ] Review 2 complete
- [ ] Review 3 complete
- [ ] All issues resolved

---

## Phase 3: Code Quality & Duplication

**Goal:** Reduce duplication, simplify complex functions, remove dead code.  
**Estimated effort:** 2–3 weeks  
**Status:** Not started

| Week | Focus                            | Scope                                                                   | Verified | Committed |
| ---- | -------------------------------- | ----------------------------------------------------------------------- | -------- | --------- |
| 1    | Extract shared utilities         | Slug, revenue timeline, grade calculator, bank settings, calendar merge | ☐        | ☐         |
| 2    | Split complex functions          | `updateExamBooking`, `submitExaminerResults`, `exam-only/page.tsx`      | ☐        | ☐         |
| 3    | Remove dead files + side effects | Empty files, seed calls in server components, duplicate actions         | ☐        | ☐         |

**Phase 3 LLM Council Reviews:**

- [ ] Review 1 complete
- [ ] Review 2 complete
- [ ] Review 3 complete
- [ ] All issues resolved

---

## Phase 4: Performance & Reliability

**Goal:** Paginate all unbounded queries, fix RLS misuse, add missing guards.  
**Estimated effort:** 2–3 weeks  
**Status:** Not started

| Week | Focus                 | Scope                                                                    | Verified | Committed |
| ---- | --------------------- | ------------------------------------------------------------------------ | -------- | --------- |
| 1    | Pagination sweep      | Documents, GDPR, settings, newsroom, exams records, student detail       | ☐        | ☐         |
| 2    | RLS client correction | Student + applicant + instructor portals (30+ files)                     | ☐        | ☐         |
| 3    | Edge-case guards      | Division-by-zero, null checks, time-range validation, empty catch blocks | ☐        | ☐         |

**Phase 4 LLM Council Reviews:**

- [ ] Review 1 complete
- [ ] Review 2 complete
- [ ] Review 3 complete
- [ ] All issues resolved

---

## Overall Progress

| Phase | Name                               | Status   | Progress |
| ----- | ---------------------------------- | -------- | -------- |
| 0     | Production Blocker Fixes           | Complete | 17/17    |
| 1     | Type Safety & `any` Remediation    | Complete | 6/6      |
| 2     | Anti-Cheat & Instructor Experience | Complete | 1/1      |
| 2b    | Schema Relations & Indexes         | Complete | 5/5      |
| 3     | Code Quality & Duplication         | Complete | 3/3      |
| 4     | Performance & Reliability          | Complete | 3/3      |

---

## Decisions Needed from User

The following items require a decision before they can be finalized:

### 1. Schema Migration: `FullTimeEnrollment.academicYear` dual-field strategy

**Context:** Added `academicYearId` FK + kept legacy `academicYear String?` field for back-compat.
**Decision needed:** Should we migrate existing string values to FK rows in `AcademicYear`, or keep both fields indefinitely?

### 2. Schema Migration: `OJTLogbook.licenceCategory` dual-field strategy

**Context:** Added `licenceCategoryId` FK + kept legacy `licenceCategory String` field.
**Decision needed:** Same as above — migrate existing string values to `LicenseCategory` rows, or keep both?

### 3. Deprecated fields: `resultLocked` on `ExamResult` and `Grade`

**Context:** These fields are still read/written in production code despite being marked `@deprecated`.
**Decision needed:** Remove the deprecated fields and all related logic, or undeprecate them?

### 4. Pagination defaults for API routes

**Context:** Added pagination to 10+ API routes using `parsePagination`. Default `take` is 20.
**Decision needed:** Is 20 the correct default page size, or should it be 50/100?

### 5. Dead export: `updateExamResult` in `app/staff/actions/bookings.ts`

**Context:** This function is exported via the barrel but has zero call sites.
**Decision needed:** Remove the dead export, or build a UI to invoke it?

---

## Notes

- All fixes are tracked in this document with checkboxes.
- Each phase must pass 3 LLM Council reviews before moving to the next phase.
- Changes are committed after each phase passes verification.
- No `as any` or type suppression is used as a permanent solution; all fixes address root causes.
- Decisions needed: see section above.
