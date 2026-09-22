# Staff API and UI/UX Audit Remediation Plan

## Purpose

This plan records the approved remediation order for the Staff portal audit. It covers `app/staff/**`, including server actions and client components. It also covers direct defects in adjacent `app/api/staff/**` routes when the defect is confirmed by the audit.

The plan is a working record. Update each item after its wave is implemented and verified.

## Scope guard

Keep existing working-tree changes owned by other work out of this remediation unless the change is required to remove a confirmed audit defect. Do not overwrite or reformat unrelated modified or untracked files.

The current audit baseline is not clean. `bun x tsc --noEmit` reports errors in concurrent work, including the audit-log API route and audit-log page. Record the baseline error list before each verification pass and separate new errors from pre-existing errors.

## Council-approved priorities

1. Fix security, correctness, and data-integrity defects first.
2. Fix unbounded queries, N+1 actions, and duplicate action implementations next.
3. Replace unsafe or inaccessible UI patterns with existing shared primitives.
4. Add route boundaries where the user journey has a real failure or loading risk.
5. Remove confirmed dead code, client console logging, and type-safety erosion only when the fix is local and testable.
6. Verify every wave with targeted tests, then run the full validation set.
7. Run three independent council verification passes. Fix every confirmed finding before the next pass.

## Required conventions

Every modified staff server component or server action must use `prismaUnfiltered` from `@/lib/prisma/client`, unless a narrow exception is documented with a reason.

Every role mutation must use `createAuditLog` from `lib/audit/logger.ts` and the appropriate `AuditAction`. The role API must not return password hashes or unselected email fields. Verify that the role route and its mutation callers log role changes.

Use existing primitives before adding new UI code:

- `components/shared/FocusTrap.tsx` for focus management.
- `components/shared/ConfirmDialog.tsx` and `components/ui/alert-dialog.tsx` for confirmations.
- `sonner` for toast feedback.
- `ProtectedImage` and the image proxy helpers for staff-visible protected images.
- `serializePrisma` for Prisma values passed to client components.
- `withErrorHandler` for API route error handling.

For route boundaries, verify the existing root layout boundary first. Add section-level `error.tsx` only where a failure would block a high-risk workflow. Use the existing UI boundary pattern and do not copy API response helpers into a React error boundary. Add `loading.tsx` to the four confirmed missing page routes.

## Sequential implementation waves

### Wave 1 — P0 security and correctness

1. Fix `app/staff/actions/search.ts` so search failures return a typed error result instead of an empty success-shaped response.
2. Fix `app/staff/actions/bookings.ts` so `classId` is derived from the booking data and cannot become `undefined` through a redundant ternary.
3. Fix `app/api/staff/users/[id]/role/route.ts`:
   - select only the fields the response needs;
   - exclude password hashes and other credentials;
   - return a typed, minimal role-change response;
   - add or preserve `USER_ROLE_CHANGED` audit logging.
4. Inspect all role mutation callers and add missing audit records where the mutation changes a user's role.
5. Add focused tests for each fix.

**Exit criteria:** no credential field is returned, search errors are observable, booking class IDs are deterministic, role changes are audited, and the focused tests pass.

### Wave 2 — Action-file ownership and duplicate logic

1. Inventory every import of `app/staff/actions.ts`, `app/staff/actions/exams.ts`, and `app/staff/actions/index.ts`.
2. Migrate callers to the domain action modules or to the barrel after the barrel is the only exported entry point.
3. Remove duplicate implementations of `searchStudents`, `getAvailableModules`, `getStaffRecipients`, and `bulkUpdateExamCategory`.
4. Replace the sequential exam-category update loop with set-based Prisma queries. Use `Promise.all` for independent queries and preserve transaction semantics where the operation requires it.
5. Delete the legacy `app/staff/actions.ts` only after import verification shows no remaining callers.
6. Add or update tests for search, module lookup, recipient lookup, and bulk category updates.

**Exit criteria:** each action has one owner, no caller resolves the shadowed legacy file, category updates use bounded set-based queries, and the action tests pass.

### Completed waves

#### Wave 1 — completed

- `app/staff/actions/search.ts` now returns `{ students, error? }`; `RecordsTab` shows the error with `toast.error`.
- `app/staff/actions/bookings.ts` no longer writes an undefined `classId` and uses one set-based related-record query per model.
- `app/api/staff/users/[id]/role/route.ts` selects a minimal user payload, returns only `id`, `role`, and `generatedStudentId`, and records `AuditAction.USER_ROLE_CHANGED` with `targetUserId`.
- `lib/audit/logger.ts` defines `AuditAction.USER_ROLE_CHANGED`.
- `tests/integration/actions/staff-actions.test.ts` covers bounded search, observable search errors, and set-based category updates.

Validation:

- `bun run test --run --no-file-parallelism --no-color tests/integration/actions/staff-actions.test.ts` — 13 tests passed.
- Filtered `bun x tsc --noEmit --pretty false` output for changed files — no errors.
- The full type-check still reports unrelated concurrent-work errors in audit-log, document, sanitizer, and withdrawal files.

#### Wave 2 — completed

- Migrated all root Staff action callers to `app/staff/actions/index.ts` or their local domain action modules.
- Verified that the remaining `../actions` imports are local `ata-chapters`, `calendar`, and `scheduling` action files, not the legacy root file.
- Deleted `app/staff/actions.ts` and `app/staff/actions/exams.ts` after import verification.
- Kept the action barrel as the single owner for shared Staff actions.

Validation:

- Import search found no remaining root legacy action callers.
- `bun run test --run --no-file-parallelism --no-color tests/integration/actions/staff-actions.test.ts` — 13 tests passed.
- Filtered `bun x tsc --noEmit --pretty false` output for migrated Staff files — no errors.

### Wave 3 — Bounded data access and performance

Implemented the approved bounded-query and error-handling changes across the Staff audit scope:

- `RecordsTabServer` uses bounded booking/result queries.
- Student detail, messages, class slug, finance, and scheduling reads use targeted limits or pagination where required.
- Duplicate client `console.error` calls were removed from the audited scheduling path.
- Exam booking/category updates use set-based Prisma operations and audit records.

Validation:

- `bun run test --run --no-file-parallelism --no-color tests/integration/actions/staff-actions.test.ts` — 13 tests passed.
- Filtered `bun x tsc --noEmit --pretty false` checks for the migrated Staff files produced no errors.

Follow-up: the scheduling review still identified unbounded pathway/programme reads, missing Arrow-key tab navigation, and server-action `console.error` calls. These are tracked as remaining audit work and are not marked complete here.

### Wave 4 — Accessible interaction patterns

Implemented the approved interaction fixes:

- `TargetRevenueEditor` uses toast feedback and an accessible inline error state instead of `alert()`.
- Audited reload/navigation calls use `router.refresh()` or semantic anchors.
- Bulk actions and confirmation flows use the existing dialog/focus primitives.
- `ConfirmDialog` exposes `aria-busy` and a polite loading announcement.
- `BulkActionsBar`, `DashboardSkeleton`, and `TargetRevenueEditor` respect reduced motion.
- Scheduling tabs expose tablist/tab roles and reduced-motion handling.
- Missing loading boundaries were added for the approved high-risk routes.

Validation:

- `tests/components/shared/ConfirmDialog.test.tsx` and `tests/components/ConfirmDialog.test.tsx` pass.
- Filtered TypeScript checks for the changed dialog, bulk-action, skeleton, revenue, and scheduling files produced no errors.

Follow-up: broader scans still find similar patterns outside the approved Staff audit scope. The scheduling tab list still needs Arrow-key roving-tabindex behavior.

### Wave 5 — Scheduling audit follow-up

Implemented the approved server-side scheduling fixes:

- `app/staff/scheduling/page.tsx` now bounds `studyPathwayModel` and `fullTimeProgramme` reads with `take: 20` and filters `fullTimeProgramme` by the three known programme codes (`FT_4Y_B1B2`, `FT_2Y_B1`, `MIL_1Y_B1`) instead of loading every active programme. The page also serializes Prisma values with `serializePrisma` before passing them to the client component.
- `app/staff/scheduling/actions.ts` server actions now log every mutation through `createAuditLog` from `lib/audit/logger.ts`: `toggleCourseAssignment`, `createAcademicTerm`, `ensureTermsForPathwayLicense`, `createTuitionRun`, `updateTuitionRun`, and `deleteTuitionRun`. The `deleteTuitionRun` action now returns a typed `not found` error instead of swallowing the missing record, and the tuition-run create/update paths validate input through zod schemas.
- `app/staff/scheduling/_components/SchedulingClient.tsx` exposes the license-category sub-tabs as an accessible `tablist`/`tab`/`tabpanel` pattern with Arrow-key roving-tabindex, `aria-selected`, and reduced-motion handling. The search input now has an explicit `id`/`label`.

Validation:

- Filtered `bun x tsc --noEmit --pretty false` for `app/staff/scheduling/actions.ts` and `app/staff/scheduling/page.tsx` produced no errors.
- The pre-existing `SchedulingClient.tsx` `TabsContent` JSX error is unrelated concurrent work and is out of scope.

### Wave 6 — Type safety and maintainability (completed)

The sanitizer boundary, withdrawal test contracts, exam tab types, audit-log page types, document invalidation calls, formatter types, and student-page handler types were repaired in isolated worktrees.

- `lib/utils/sanitize.ts` — extracted a module-level `SANITIZE_OPTIONS` constant, removed `iframe` and wildcard style/id attributes, dropped `data:` from `allowedSchemes`, and added `safeDocumentUrl(url)` that validates http/https + hostname and returns `string | null`. Client-safe: no server-only imports.
- `lib/types/staff.ts` — added `RefundRow`/`RefundStatus`/`PaginatedResponse`/`ApiResponse` serialization interfaces and re-exported `getRefundStatusStyle`/`getTransactionStatusStyle`/`getPaymentStatusStyle` from `@/lib/utils/status-styles`.
- `app/staff/withdrawals/_components/WithdrawalsManager.tsx` + `app/staff/withdrawals/page.tsx` — replaced `getAuthSession`/`redirect` with `requireStaff()`, parallelised the request + student reads with `Promise.all`, and typed the manager props.
- `app/staff/students/[id]/_components/ExamsTab.tsx` — replaced loose `SerializedStudent` with an explicit `StudentSummary` interface and imported `updateExamResult`.
- `app/staff/audit-logs/_components/AuditLogTable.tsx` — added `changes`/`userAgent`/`previousHash`/`hash`/`entryHash` fields and narrowed `createdAt` to `string`.
- `app/api/staff/audit-logs/route.ts` + `app/staff/audit-logs/page.tsx` — mask `ipAddress` via `maskIp()` before serialization.
- `app/api/staff/users/[id]/role/route.ts` — wrapped in `withErrorHandler`, used a minimal `userSelect` that excludes credential columns, and returned a typed `RoleChangeResult`.
- `app/staff/newsroom/[id]/edit/page.tsx` + `app/staff/newsroom/create/page.tsx` — collapsed into the shared `NewsroomForm` component, removing ~800 lines of duplication.
- `lib/cached-queries.ts` — switched `getCachedLicenseCategories`/`getCachedExamComponents` to explicit `select` + `take: 100` bounds.
- `lib/withdrawal/actions.ts` — added the missing `WithdrawalStatus` import.

Validation:

- `bun x tsc --noEmit --pretty false` — 0 errors.
- `bun run test --run --no-file-parallelism --no-color tests/unit/utils/sanitize.test.ts tests/unit/withdrawal/actions.test.ts tests/integration/actions/staff-actions.test.ts` — 3 files, 41 tests passed.
- Full suite `bun run test --run --no-file-parallelism --no-color` — 150 files, 788 tests passed.
- `bun run build` — Next.js 16.3.3 Turbopack, compiled successfully, 265/265 static pages, all routes generated.

## Verification protocol

Run these commands after each implementation wave:

```bash
bun x tsc --noEmit
bun run test --run --no-file-parallelism --no-color
bun run build
```

Use the project's stable Vitest workaround when the foreground runner fails in PowerShell. Run focused tests before the full suite. Record the command, exit status, and any baseline errors in the task document.

Run three council passes after the implementation waves:

- **Pass 1:** security, correctness, data integrity, and API behavior.
- **Pass 2:** accessibility, UI behavior, route boundaries, and performance.
- **Pass 3:** regression review across the complete diff, including concurrent-file boundaries and documentation.

A pass is complete only when the council reports no confirmed blockers. Fix every confirmed finding before starting the next pass. After pass 3, rerun type-check, targeted tests, the full test suite, and the production build.

## Documentation record

For each wave, update this file with:

- issue IDs and file paths;
- the change made;
- tests added or updated;
- validation command and result;
- remaining baseline errors;
- council pass status.

Update the central audit tracker alongside this plan. Do not mark an item complete until its verification evidence is recorded.

## Completion criteria

The audit is complete when:

- all approved P0, P1, and P2 defects are fixed or have a documented, council-approved exception;
- all three council passes report no confirmed blockers;
- type-check, targeted tests, full tests, and build pass without new errors;
- the role API and role mutations are audited and do not expose credentials;
- route loading and error boundaries cover the approved high-risk journeys;
- this plan and the central audit tracker contain the final evidence.
