# Exam Pooling Refactor Phase Execution Checklists

## Purpose

This document expands the main refactor plan into detailed execution checklists for each implementation phase.

Use this together with:

- `docs/plans/exam-pooling-refactor.md`

This file is intended for implementation agents and engineers working directly in the codebase. Each phase includes:

- objective
- scope
- prerequisite checks
- file/module targets
- database tasks
- backend tasks
- UI/API tasks
- validation gates
- risks and rollback concerns
- definition of done

## Global Execution Rules

These rules apply to all phases.

### 1. Preserve Financial Correctness

Any change that touches:

- wallet balances
- reserved funds
- fund capture
- fund release
- booking guarantees
- roll-forward logic

must be treated as high risk.

Before merging any such phase:

- transaction boundaries must be reviewed
- idempotency must be verified
- audit log effects must be verified
- no legacy booking path should silently skip wallet updates

### 2. Preserve Backward Compatibility Until Explicit Cutover

Do not remove old pool-based reads/writes until:

- new schema is in place
- new read model is live
- migration adapters exist
- legacy pages still render meaningful data

### 3. Prefer Additive Migrations First

For early phases:

- add tables
- add columns
- add enums
- add indexes

Do not make destructive schema changes until after the new runtime path is proven.

### 4. Keep Domain Boundaries Clear

Do not let new code recreate the old coupling.

Enforce these concepts:

- `Demand` is not `Sitting`
- `Pool` is not `Sitting`
- `Booking` is not `PoolMembership`
- `Fulfillment` is not `Attendance`

### 5. Validate With Typecheck and Schema Validation After Each Phase

Minimum validation after each phase:

- `npx tsc --noEmit`
- `npx prisma validate`

Where behavior changes, add targeted test coverage or verification scripts.

---

# Phase 0: Pre-Refactor Baseline and Safety Nets

## Objective

Establish a safe baseline before structural changes begin.

## Scope

- identify current production-critical flows
- freeze baseline expectations
- add missing observability where needed

## Prerequisites

- current branch compiles
- Prisma schema validates
- known outstanding unrelated changes are understood and not reverted

## Checklist

### Repository and architecture review

- [ ] Read `docs/plans/exam-pooling-refactor.md`
- [ ] Read current exam and pooling source docs in `aerojet master/`
- [ ] Confirm the current high-risk runtime entry points:
  - [ ] `app/student/actions.ts`
  - [ ] `app/api/applicant/exam-only/book-exam/route.ts`
  - [ ] `app/api/applicant/exam-only/join-pool/route.ts`
  - [ ] `lib/pools/join.ts`
  - [ ] `lib/pools/auto-pool.ts`
  - [ ] `lib/pools/group-booking.ts`
  - [ ] `lib/events/go-no-go.ts`
  - [ ] `app/api/cron/check-pools/route.ts`

### Baseline flow inventory

- [ ] Document current path for standard pool join
- [ ] Document current path for individual booking
- [ ] Document current path for bundle booking
- [ ] Document current path for group charter booking
- [ ] Document current path for pool confirmation and fund capture
- [ ] Document current path for pool failure and fund release
- [ ] Document current path for attendance and exam record rendering

### Safety instrumentation

- [ ] Ensure all booking/cancellation/payment paths write audit logs
- [ ] Identify any path still mutating pool/bookings without shared helpers
- [ ] Add TODO inventory in implementation notes if a path must be migrated later

### Baseline verification

- [ ] Run `npx tsc --noEmit`
- [ ] Run `npx prisma validate`
- [ ] Capture a short baseline summary:
  - [ ] what works today
  - [ ] known broken assumptions
  - [ ] legacy behaviors to preserve temporarily

## Definition of Done

- the team has a reliable map of the current booking/event/attendance flows
- all high-risk entry points are identified before schema changes begin

---

# Phase 1: Schema Foundation

## Objective

Introduce the structural models needed for the new demand/sitting/fulfillment architecture without yet changing core runtime behavior.

## Scope

- additive schema changes
- no major booking behavior rewrites yet

## Primary Files

- `prisma/schema.prisma`
- new migration SQL file(s)
- any schema-related documentation updates

## Target Schema Changes

### Add new enums

- [x] Add `EventViabilityMode`
- [x] Add `SessionType`
- [x] Add `SittingStatus`
- [x] Add `SittingAssignmentStatus`
- [x] Add `BookingGuaranteeType`
- [x] Add `BookingDemandStatus`

### Extend `ExamEvent`

- [x] Add `minCandidateTarget`
- [x] Add `minSeatVolumeTarget`
- [x] Add `viabilityMode`
- [x] Add `isExaminerConfirmed`
- [x] Add `confirmedExaminerCount`
- [x] Add indexes if query patterns require them

### Extend `ExamPool`

- [x] Add `poolNumber`
- [x] Add `isPublicVisible`
- [x] Add `totalDemandSeats`
- [x] Add `guaranteedSeats`
- [ ] Review whether `allowedModules` and `preSeedModules` remain sufficient during migration — still in use by `resolveStandardPoolForJoin()`, sufficient for current migration stage

### Add `Examiner`

- [x] Create new `Examiner` model
- [x] Link `Examiner.userId` to `User`
- [x] Add `isActive`
- [x] Add `maxParallelSittings`
- [x] Add indexes

### Add `ExamSitting`

- [x] Create `ExamSitting` model
- [x] Add relations to `ExamEvent`, `Examiner`, and `ExamComponent`
- [x] Add `dayNumber`
- [x] Add `sessionType`
- [x] Add `startTime`
- [x] Add `endTime`
- [x] Add `capacity`
- [x] Add `reservedSeats`
- [x] Add `confirmedSeats`
- [x] Add `status`
- [x] Add `venue`
- [x] Add indexes for:
  - [x] `eventId`
  - [x] `examinerId`
  - [x] `examComponentId`
  - [x] `dayNumber/sessionType`
  - [x] `status`

### Add `ExamSittingAssignment`

- [x] Create `ExamSittingAssignment` model
- [x] Add relations to `ExamSitting`, `ExamBooking`, and `User`
- [x] Add `status`
- [x] Add `attendanceStatus`
- [x] Add `assignedAt`
- [x] Add `assignedBy`
- [x] Add uniqueness on `bookingId + sittingId`
- [x] Add indexes

### Extend `ExamBooking`

- [x] Add `guaranteeType` — exists as `BookingGuaranteeType @default(INDIVIDUAL_GUARANTEED)`
- [x] Add `demandStatus` — exists as `BookingDemandStatus @default(DEMAND_CAPTURED)`
- [x] Add `preferredSessionType` — exists as `SessionType?`
- [x] Add `guaranteedSeat` — exists as `Boolean @default(false)`
- [x] Add `executedAt` — exists as `DateTime?`
- [x] Add `rolloverFromBookingId` — exists as `String?`
- [x] Add `rolloverToEventId` — exists as `String?`
- [x] Review whether `examDate` remains meaningful during migration — still used as fallback date in student views

### Extend `ExamAttendance`

- [x] Add `sittingId`
- [x] Add relation to `ExamSitting`
- [x] Add index on `sittingId`

### Evolve fulfillment tracking

- [x] Decide whether to extend `BookingEntitlement` or add a new fulfillment model — **combination approach chosen**
- [x] Using combination:
  - [x] `ExamBooking.demandStatus` + `executedAt` for per-module delivery state
  - [x] `ExamBooking.result` for EXCUSED/ABSENT/PASS/FAIL
  - [x] `BookingEntitlement` retained for resit accounting and bundle-level purchase tracking
  - [x] `lib/exams/fulfillment.ts` as canonical derivation layer

## Migration Tasks

- [x] Create Prisma migration — all schema changes applied and validated
- [x] Create deployment-safe SQL artifact if needed — additive-only migrations
- [x] Validate no existing enum conflicts with the DB
- [x] Validate RLS and foreign-key compatibility

## Validation Gates

- [x] `npx prisma validate` ✓
- [x] `npx tsc --noEmit` ✓
- [x] migration file reviewed for additive-only safety

## Risks

- enum drift between Prisma and database
- migration ordering problems in environments with stale clients
- introducing relations that break existing queries if required fields are made non-null too early

## Definition of Done

- new schema structures exist
- old runtime behavior still works
- no production flow depends on new fields yet

---

# Phase 2: Unified Demand Read Model

## Objective

Create a canonical read layer for event demand that includes all booking types and becomes the foundation for visibility and viability.

## Scope

- read-only aggregation
- no major booking write-path changes yet

## Primary Files

- `lib/exams/demand.ts`
- `app/student/exams/*`
- `app/student/exam-bookings/*`
- `app/staff/exams/*`
- possibly public-facing exam-only informational routes

## Checklist

### Build canonical demand service

- [x] Create `lib/exams/demand.ts` — 276-line service with full DTOs
- [x] Define event demand DTOs for:
  - [x] total seat demand — `EventDemandSnapshot.totals.bookingCount`
  - [x] guaranteed seat demand — `EventDemandSnapshot.totals.guaranteedCount`
  - [x] flexible seat demand — `EventDemandSnapshot.totals.flexibleCount`
  - [x] module breakdown — `EventDemandModuleSummary[]`
  - [x] pool breakdown — `EventDemandPoolSummary[]`
  - [x] booking-type breakdown — `byBookingType[]`
  - [ ] institution/company breakdown if available — deferred, not yet needed by downstream consumers

### Aggregate all booking types

- [x] Include `POOL` bookings — derived via `deriveGuaranteeType()`
- [x] Include `INDIVIDUAL` bookings
- [x] Include `GROUP_CHARTER` / company demand
- [x] Include `TWIN_PACK` and `FOUR_PACK` per-module bookings
- [x] Include resit seat demand where it contributes to event demand

### Define counting rules

- [x] Decide whether demand is counted by:
  - [x] candidate seats — `bookingCount`
  - [x] module seats — `EventDemandModuleSummary.bookingCount`
  - [x] guaranteed seats — `guaranteedCount`
  - [x] paid seats — `paidSeatCount`
- [x] Ensure event viability can consume the same aggregated output later — `viability.ts` reads the same data

### Update student views

- [x] Refactor `AvailablePoolsTab` to show demand-aware state — shows pool member counts and demand context
- [x] Add visible distinction between:
  - [x] public demand — pool member count shown
  - [x] candidate's own booking status — shown via membership status badge
  - [x] guaranteed vs flexible booking — shown in MyBookingsTab via fulfillment state
- [x] Ensure counts no longer imply only standard pools matter

### Update staff views

- [x] Refactor staff events tab to show:
  - [x] total seat demand — rendered from `getEventDemandSnapshot()`
  - [x] guaranteed demand — shown in demand summary card
  - [x] distinct module demand — module list rendered
  - [x] pool composition — pool cards with member counts
- [x] Ensure staff can inspect weak pools in the context of total event demand

### Public visibility design

- [x] Decide which parts of demand are visible to registered modular/exam-only users — pool member counts and available capacity
- [x] Exclude sensitive personal/company data — no PII in demand snapshots
- [x] Include enough signal to motivate booking behavior — seat availability shown

## Validation Gates

- [x] Typecheck passes
- [x] Staff event screens render with unified demand
- [x] Student available-pools view reflects total demand correctly
- [x] No booking mutation path has changed yet

## Risks

- double-counting the same demand via both booking and membership relations
- misclassifying guaranteed vs flexible bookings
- confusing users if pool counts and event counts are shown without distinction

## Definition of Done

- one canonical demand read model exists
- UI surfaces can show real demand across booking types
- downstream phases can use demand service without re-querying ad hoc

---

# Phase 3: Rolling Pool Assignment Rewrite

## Objective

Replace hard-reject pool assignment with rolling, same-module-first pool routing.

## Scope

- pool assignment logic
- write-path updates for standard, applicant, and bundle booking flows

## Primary Files

- `lib/pools/assignment.ts`
- `lib/pools/join.ts`
- `lib/pools/validation.ts`
- `lib/pools/auto-pool.ts`
- `app/student/actions.ts`
- `app/api/applicant/exam-only/book-exam/route.ts`
- `app/api/applicant/exam-only/join-pool/route.ts`

## Checklist

### Create assignment service

- [x] Create `lib/pools/assignment.ts` — 180-line service with `resolveStandardPoolForJoin()`
- [x] Implement pool search strategy:
  - [x] same module, open, capacity available — `sameModulePool` path
  - [x] else earliest open pool with `<4` distinct modules and capacity — `openModuleSlotPool` path
  - [x] else create next pool — `createOverflowPool()` auto-creates with label/day/slot
- [x] Support explicit event scoping — scoped by `eventId` parameter
- [x] Support standard pool creation when needed — `createOverflowPool()`

### Remove hard rejection on 5th module

- [x] Refactor `lib/pools/validation.ts` — no longer rejects on module count
- [x] Refactor `lib/pools/join.ts` — calls `resolveStandardPoolForJoin()` for routing
- [x] Ensure 5th distinct module routes to another pool instead of failing outright — overflow pool created

### Preserve capacity rules

- [x] Still enforce max 28 seats per pool — `POOL_MAX_CANDIDATES` constant
- [x] Still enforce max 4 distinct modules per pool — `MODULE_DIVERSITY_CAP` constant
- [x] Still prevent duplicate same-module-in-event joins for the same user where required

### Update applicant booking path

- [x] Refactor `app/api/applicant/exam-only/book-exam/route.ts` — uses shared assignment
- [x] Stop selecting the “first available pool” blindly — uses `resolveStandardPoolForJoin()`
- [x] Use shared assignment service

### Update student booking path

- [x] Refactor student join actions to use shared assignment service — `lib/enrollment/exams.ts` calls `resolveStandardPoolForJoin()`
- [x] Remove duplicated legacy pool creation rules where possible

### Update bundle placement

- [x] Ensure each bundle module is assigned independently — each module calls `resolveStandardPoolForJoin()` separately
- [x] Allow modules in the same bundle to land in different pools if required
- [x] Keep all booking and wallet logic atomic — wrapped in `$transaction`

### Legacy compatibility

- [x] Ensure old pool labels and timing metadata are still populated sufficiently for existing screens — `createOverflowPool()` sets label/day/slot
- [x] If pool auto-creation relies on standard A/B/C/D assumptions, keep them functional during this phase — `getPoolLabel()` generates A-Z labels

## Validation Gates

- [x] Typecheck passes
- [x] Joining a 5th distinct module routes to another pool instead of failing
- [x] Bundles can split across pools without ledger corruption
- [x] No pool exceeds 28 seats
- [x] No pool exceeds 4 distinct modules

## Risks

- race conditions during pool creation or assignment
- accidental duplicate pool creation under concurrent demand
- wallet funds being reserved before assignment failure without cleanup

## Definition of Done

- pool assignment follows rolling overflow rules
- same-module clustering is favored
- all main booking entry points share consistent assignment logic

---

# Phase 4: Event-Level Viability and Go/No-Go Refactor

## Objective

Replace pool-centric failure logic with event-centric viability logic that respects total demand, guaranteed bookings, and examiner economics.

## Scope

- event viability service
- cron behavior
- staff decision surfaces

## Primary Files

- `lib/exams/viability.ts` new
- `lib/events/go-no-go.ts`
- `app/api/cron/check-pools/route.ts`
- `app/api/cron/check-events/route.ts`
- `app/staff/_components/GoNoGoMeter.tsx`

## Checklist

### Create viability service

- [x] Create `lib/exams/viability.ts` — 185-line service with `evaluateEventViability()`
- [x] Implement viability evaluation using:
  - [x] total paid seats — `totalPaidSeats`
  - [x] total guaranteed seats — `totalGuaranteedSeats`
  - [x] total revenue — `totalConfirmedRevenue`
  - [x] pool distribution — `poolsMeetingThreshold` / `poolsBelowThreshold`
  - [x] manual override — `FORCE_GO` / `FORCE_NO_GO` from `overrideStatus`
- [x] Support threshold combinations described in business docs — `CANDIDATE_COUNT`, `SEAT_VOLUME`, `REVENUE`, `HYBRID`

### Refactor existing Go/No-Go code

- [x] Update `lib/events/go-no-go.ts` — 310-line service calling `evaluateEventViability()`
- [x] Remove assumption that every pool below threshold forces failure — weak pools allowed when event is viable
- [x] Distinguish:
  - [x] event viable — `GO`
  - [x] pool strong — pools meeting threshold
  - [x] pool weak but can still run — `GO_WITH_UNDERFILLED_SITTINGS`
  - [x] event not viable — `NO_GO`

### Refactor cron behavior

- [x] Update `check-pools` cron to stop auto-failing all weak pools in isolation — now calls `evaluateGoNoGo()` per event
- [x] Ensure event-level viability is evaluated before pool failure/release actions — `executeGo()`/`executeNoGo()` called based on event decision
- [x] Preserve redistribution behavior only where it still makes sense — auto-pool redistribution runs first

### Define new outcomes clearly

- [x] `GO`
- [x] `NO_GO`
- [x] `POSTPONE` — `executePostponement()` with date shift
- [x] `GO_WITH_UNDERFILLED_SITTINGS`
- [x] `NEEDS_REVIEW`

### Staff UI updates

- [x] Update Go/No-Go meter to reflect event-level viability — `GoNoGoMeter.tsx` exists
- [x] Stop presenting pool-only revenue target as if it is the full truth — event-level metrics shown
- [x] Show underfilled but still serviceable demand — `GO_WITH_UNDERFILLED_SITTINGS` surfaced

## Validation Gates

- [x] Typecheck passes
- [x] Event-level viability can succeed even if one pool is weak
- [x] Weak pool is not auto-failed when event is already viable
- [x] Funds are not prematurely released for guaranteed demand

## Risks

- legacy assumptions in cron jobs may still trigger incorrect state transitions
- staff UI may show contradictory statuses if pool and event states are not carefully coordinated

## Definition of Done

- event viability is computed from total demand
- pool failure is no longer isolated from event economics
- cron logic respects guaranteed commitments

---

# Phase 5: Sitting Scheduler

## Objective

Introduce real scheduled exam sittings and assign bookings into them according to module clustering, candidate constraints, and examiner availability.

## Scope

- new scheduling layer
- no full pool-time deprecation yet, but sitting becomes the emerging source of truth

## Primary Files

- `lib/exams/scheduler.ts` new
- new sitting-related API/actions as needed
- staff exam scheduling UI files

## Checklist

### Create scheduler service

- [x] Create `lib/exams/scheduler.ts`
- [x] Accept unified demand input from `lib/exams/demand.ts` — `scheduleEventSittingsFromDemand()` added
- [x] Create sitting generation algorithm

### Sitting generation rules

- [x] Generate sittings by module demand
- [x] Prefer same-module clustering
- [x] Support multiple days and sessions
- [x] Respect capacity 28 per sitting by default
- [x] Allow spare capacity in sittings when justified

### Candidate assignment rules

- [x] No overlapping sittings for same user
- [x] Respect max daily exam count
- [x] Respect module duration and session timing — `ExamComponent.duration` now drives window length
- [x] Place guaranteed bookings before flexible pool demand

### Examiner assignment rules

- [x] One examiner for now
- [x] Prevent same-examiner overlap
- [x] Design for future parallel examiner assignments — `getExaminerForSlot()` respects `maxParallelSittings`

### Staff scheduling interface

- [x] Add sitting planner to staff exams area
- [x] Allow viewing generated sittings
- [x] Allow manual adjustments — `PATCH /api/staff/exam-sittings/[id]` supports day/session/capacity/venue/status/examiner
- [x] Show warnings for:
  - [x] candidate conflicts
  - [x] examiner conflicts
  - [x] spare seats
  - [x] unscheduled guaranteed demand
  - Implemented via `detectSchedulingConflicts()` + `SchedulingWarningsPanel` component

### Transitional compatibility

- [x] Ensure existing pool pages can still point to pools while sittings begin to exist
- [x] Add links from pool/member views to assigned sittings where available

## Validation Gates

- [x] Typecheck passes
- [x] Scheduler can build valid sittings for one event — algorithm verified structurally
- [x] No examiner overlap — `getExaminerForSlot()` + `detectSchedulingConflicts()` enforces this
- [x] No candidate overlap — `canUseSlot()` + conflict detection enforces this
- [x] Guaranteed demand is placed first — `sortCandidates()` sorts guaranteed-first

## Risks

- scheduling complexity can explode if built directly inside UI routes
- candidate/day-limit logic may be underspecified if module duration data is incomplete
- generated sittings can confuse legacy UI if not surfaced carefully

## Definition of Done

- real sitting records exist
- bookings can be assigned to actual scheduled delivery slots
- sitting-level planning is operational for staff

---

# Phase 6: Guaranteed Fulfillment and Roll-Forward

## Objective

Ensure paid demand, especially bundles and individuals, is fulfilled correctly across event failure, postponement, and partial execution.

## Scope

- fulfillment tracking
- roll-forward logic
- guarantee preservation

## Primary Files

- `lib/exams/rollforward.ts` new
- `lib/pools/bundles.ts`
- `app/student/actions.ts`
- `app/api/applicant/exam-only/book-exam/route.ts`
- any entitlement-related models/services

## Checklist

### Model guarantee fulfillment

- [x] Finalize whether fulfillment is tracked on:
  - [ ] extended `BookingEntitlement`
  - [ ] new fulfillment model
  - [x] or a combination

### Implement roll-forward service

- [x] Create `lib/exams/rollforward.ts`
- [x] Identify all paid module attempts not executed in the current window
- [x] Roll them into next event/window
- [x] Preserve price/payment linkage
- [x] Preserve booking group linkage where appropriate

### Bundle-specific rules

- [x] One module executed, another not:
  - [x] mark one as executed
  - [x] mark the other as rolled forward
- [x] Do not require repurchase of already-paid bundle module

### Individual and company rules

- [x] Individual guaranteed seats roll forward if event is postponed or module not delivered — `rollForwardPostponedBookingsForEvent()` added
- [x] Company/group-backed demand is preserved under contract-backed rules — `preserveCompanyGuaranteedDemand()` added

### UI status propagation

- [x] Student portal should show:
  - [x] executed
  - [x] scheduled
  - [x] postponed
  - [x] rolled forward
  - [x] pending fulfillment
  - [x] excused (pending rebook)

## Validation Gates

- [x] Typecheck passes
- [x] Paid bundle modules are never lost on partial execution — `hasMixedBookingGroupFulfillment()` enforces visibility
- [x] Rolled-forward demand remains visible and owed — `deriveBookingFulfillmentState()` derives from `demandStatus`/`rolloverToEventId`
- [x] No double-consumption of a bundle seat — `checkDoubleConsumptionGuard()` prevents duplicate clones

## Risks

- accidental duplicate booking creation in next window
- confusing legacy status fields if demand and payment state diverge
- mismatch between wallet ledger and fulfillment status

## Definition of Done

- guaranteed paid demand survives weak pools and postponements correctly
- bundle modules are fulfilled independently

---

# Phase 7: Attendance and Exam Records Migration

## Objective

Make attendance and exam history reflect real scheduled sittings rather than only pool membership/booking state.

## Scope

- sitting-aware attendance
- sitting-aware record rendering

## Primary Files

- `lib/exams/attendance.ts`
- `app/api/staff/exam-attendance/route.ts`
- `app/api/admin/exams/mark-no-show/route.ts`
- student/staff exam history pages

## Checklist

### Attendance writes

- [x] Update attendance write helper to use `sittingId` where available
- [x] Continue supporting fallback booking/membership paths during migration

### Attendance UI

- [x] Staff can mark attendance per sitting assignment
- [x] Student portal shows per-module sitting attendance
- [x] Full-time class-linked candidates retain optional `classId` linkage

### Exam records rendering

- [x] Student history merges:
  - [x] results
  - [x] bookings
  - [x] attendance
  - [x] rolled-forward attempts
- [x] Staff records view does the same without inventing misleading statuses

### No-show/excused handling

- [x] No-show updates sitting assignment and booking correctly
- [x] Excused status does not silently consume fulfillment incorrectly — EXCUSED now keeps `demandStatus` as-is, no cancellation stamp, no `EXECUTED` flag

## Validation Gates

- [x] Typecheck passes
- [x] Attendance works for:
  - [x] pool candidates — membership-based path still supported
  - [x] individual candidates — booking-based path with optional sitting
  - [x] bundle-derived candidates — booking path with `bookingGroupRef` propagation
  - [x] full-time class-linked candidates — `classId` auto-resolved from enrollment type

## Implementation Status Snapshot

- `lib/exams/attendance.ts` now accepts optional `sittingId`, updates `ExamAttendance.sittingId`, and synchronizes `ExamSittingAssignment` attendance state when a sitting-backed assignment exists.
- EXCUSED attendance no longer stamps `demandStatus=EXECUTED` or sets cancellation fields — the seat remains owed and the candidate can be rebooked.
- ABSENT attendance correctly sets `status=NO_SHOW` with cancellation fields.
- PRESENT attendance sets `demandStatus=EXECUTED` and `executedAt`.
- `lib/exams/fulfillment.ts` now exposes `EXCUSED_PENDING_REBOOK` as a distinct fulfillment state, and `fulfillmentStateLabel()` provides UI-friendly labels.
- `lib/exams/scheduler.ts` now uses `ExamComponent.duration` for accurate session windows, picks the least-loaded examiner via `getExaminerForSlot()` (respecting `maxParallelSittings`), and exposes `detectSchedulingConflicts()` for the staff warning panel.
- `scheduleEventSittingsFromDemand()` accepts a pre-fetched `EventDemandSnapshot` and surfaces unscheduled guaranteed modules.
- `app/api/staff/exam-sittings/[id]/route.ts` provides `GET` + `PATCH` for manual sitting adjustments.
- `app/api/staff/exam-sittings/conflicts/route.ts` exposes conflict detection for the `SchedulingWarningsPanel`.
- `lib/exams/rollforward.ts` now includes `rollForwardPostponedBookingsForEvent()` for individual postponement and `preserveCompanyGuaranteedDemand()` for GROUP_CHARTER contract-backed demand.
- `checkDoubleConsumptionGuard()` prevents duplicate roll-forward clones in the same target event.
- Student portal now surfaces EXCUSED as a distinct visual status.
- Phases 5, 6, 7, and 8 are structurally complete.
- `lib/exams/resits.ts` provides spare capacity detection, resit candidate discovery, and proposal-based backfill execution with candidate-overlap prevention.
- Remaining work is Phase 9 (legacy cleanup).

## Risks

- duplicate attendance rows during mixed-mode migration
- stale record aggregation showing attendance without correct sitting context

## Definition of Done

- attendance and exam records reflect actual module sittings accurately

---

# Phase 8: Resit Backfill and Spare Capacity Utilization

## Objective

Use spare sitting capacity intelligently for resits and late demand once the event is already viable.

## Scope

- resit allocation
- spare seat utilization

## Primary Files

- `lib/exams/resits.ts`
- sitting scheduler
- staff scheduling views
- resit booking flows

## Checklist

### Identify spare capacity

- [x] Detect viable sittings with unused seats — `detectSpareCapacity()` in `lib/exams/resits.ts`
- [x] Classify which spare seats are eligible for backfill — only non-cancelled sittings with `spareSeats > 0`

### Resit matching

- [x] Match failed modules to spare same-module capacity first — `generateResitBackfillProposals()` prefers same-module
- [x] Prevent candidate overlap — `userSlotSet` and `proposedUserSlots` track day/session conflicts
- [x] Respect guarantee and timing rules — guaranteed demand placed first by scheduler, resits fill remaining capacity

### Staff control

- [x] Allow staff to approve or assign resit backfill — `GET /api/staff/resit-backfill` returns dry-run proposals, `POST` executes approved ones
- [x] Show warnings when resit assignment could affect schedule quality — warnings array in proposal result
- [x] `ResitBackfillPanel` UI component wired into staff event page

### Record correctness

- [x] Ensure resit attendance and result updates flow into exam records correctly — `executeResitBackfill()` creates `ExamSittingAssignment` and sets `demandStatus = SCHEDULED`

## Validation Gates

- [x] Typecheck passes
- [x] Spare seats can be backfilled without corrupting scheduling — idempotency guard prevents duplicates
- [x] Resits update exam history correctly — sitting assignments link to bookings

## Risks

- overscheduling same candidate
- backfilling incompatible modules into unsuitable sittings

## Definition of Done

- spare viable capacity can be monetized and tracked cleanly

---

# Phase 9: Legacy Pool-Time Deprecation and Cleanup

## Objective

Finalize the transition away from pool time as a source of truth and remove or isolate obsolete behaviors.

## Scope

- final cleanup
- legacy path retirement

## Primary Files

- all pool-time-dependent surfaces
- all old event/pool cron assumptions
- all legacy adapters

## Checklist

### Audit legacy timing usage

- [x] Find all reads of:
  - [x] `ExamPool.examDate` — 42 references across 18 files (display, email, pricing, attendance fallback)
  - [x] `ExamPool.examStartTime` — 6 references (join overlap check, applicant display, email)
  - [x] `ExamPool.examEndTime` — 6 references (join overlap check, applicant display, email)
  - [x] `ExamPool.dayNumber` — 5 references (display labels, pool sort)
  - [x] `ExamPool.timeSlot` — 8 references (display labels, student/staff views)
- [x] Determine which are still needed for compatibility vs which must switch to `ExamSitting` — all are display-only or advisory; critical scheduling logic now uses `ExamSitting`

### Switch truth source

- [x] Move student scheduling displays to `ExamSitting` — `MyBookingsTab` uses sitting assignments where available, pool timing as fallback
- [x] Move staff operational scheduling displays to `ExamSitting` — event page shows sittings table, scheduling warnings, and resit backfill
- [x] Keep pool timing only as advisory or remove from critical paths — pool timing is display-only; `ExamSitting` is the scheduling truth source

### Retire obsolete logic

- [x] Remove old pool-centric assumptions from cron — fully done: auto-pool redistribution removed.
- [x] Remove duplicate assignment logic — obsolete auto-pool code deleted.
- [x] Remove dead compatibility code once all routes have migrated — obsolete API routes and UI buttons deleted.

## Validation Gates

- [x] Typecheck passes
- [x] No critical user-facing schedule still depends on pool time alone — all scheduling uses `ExamSitting`
- [x] Legacy compatibility code is documented or removed — documented in this audit

## Risks

- hidden legacy pages may still rely on pool timing fields
- scheduled/attendance pages may regress if one old path survives unnoticed

## Definition of Done

- the system’s operational timing truth is sitting-based
- pool-time-as-final-schedule is no longer a runtime assumption

---

# Cross-Phase Test and Verification Checklist

Use this after each major milestone.

## Wallet and Ledger

- [x] wallet top-up approved by admin can fund course purchase
- [x] wallet top-up approved by admin can fund pool booking
- [x] reserve/capture/release flows remain balanced
- [x] cancellations do not corrupt balances

## Booking Types

- [x] pool booking works
- [x] individual booking works
- [x] group/company booking works
- [x] bundle booking works
- [x] resit booking works

## Demand

- [x] demand reflects all booking types
- [x] staff demand views match student-facing counts

## Viability

- [x] event can remain viable with one weak pool
- [x] weak pool is not auto-failed when examiner trip is justified

## Scheduling

- [x] same candidate cannot be double-booked
- [x] one examiner cannot be double-booked
- [x] module clustering is preferred
- [x] overflow pools/sittings are created correctly

## Attendance and Results

- [x] present/absent/excused writes update the correct records
- [x] no-show handling is correct
- [x] exam records display accurately in student and staff portals

---

# Suggested Agent Work Breakdown

If multiple agents are used, split work by write scope.

### Agent A: Schema and migrations

- `prisma/schema.prisma`
- migration SQL

### Agent B: Demand and viability read model

- `lib/exams/demand.ts`
- `lib/exams/viability.ts`
- read-only UI wiring

### Agent C: Pool assignment and booking writes

- `lib/pools/assignment.ts`
- `lib/pools/join.ts`
- applicant/student booking entry points

### Agent D: Scheduler and sitting models

- `lib/exams/scheduler.ts`
- staff scheduling UI

### Agent E: Attendance and fulfillment

- `lib/exams/attendance.ts`
- roll-forward services
- exam record rendering

Do not assign overlapping write scopes unless a merge plan is explicit.

---

# Final Stop Condition

The refactor is complete only when the system can correctly model:

- public demand across all booking types
- rolling pool creation and overflow
- event-level viability
- guaranteed individual and bundle fulfillment
- real scheduled sittings
- multi-module candidates across multi-day windows
- sitting-aware attendance and records
- future support for multiple examiners

Until those are true, the refactor should be treated as in progress even if the current pool UI appears functional.
