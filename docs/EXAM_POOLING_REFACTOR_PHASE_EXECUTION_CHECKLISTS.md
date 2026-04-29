# Exam Pooling Refactor Phase Execution Checklists

## Purpose

This document expands the main refactor plan into detailed execution checklists for each implementation phase.

Use this together with:

- `docs/EXAM_POOLING_REFACTOR_IMPLEMENTATION_PLAN.md`

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

- [ ] Read `docs/EXAM_POOLING_REFACTOR_IMPLEMENTATION_PLAN.md`
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

- [ ] Add `EventViabilityMode`
- [ ] Add `SessionType`
- [ ] Add `SittingStatus`
- [ ] Add `SittingAssignmentStatus`
- [ ] Add `BookingGuaranteeType`
- [ ] Add `BookingDemandStatus`

### Extend `ExamEvent`

- [ ] Add `minCandidateTarget`
- [ ] Add `minSeatVolumeTarget`
- [ ] Add `viabilityMode`
- [ ] Add `isExaminerConfirmed`
- [ ] Add `confirmedExaminerCount`
- [ ] Add indexes if query patterns require them

### Extend `ExamPool`

- [ ] Add `poolNumber`
- [ ] Add `isPublicVisible`
- [ ] Add `totalDemandSeats`
- [ ] Add `guaranteedSeats`
- [ ] Review whether `allowedModules` and `preSeedModules` remain sufficient during migration

### Add `Examiner`

- [ ] Create new `Examiner` model
- [ ] Link `Examiner.userId` to `User`
- [ ] Add `isActive`
- [ ] Add `maxParallelSittings`
- [ ] Add indexes

### Add `ExamSitting`

- [ ] Create `ExamSitting` model
- [ ] Add relations to `ExamEvent`, `Examiner`, and `ExamComponent`
- [ ] Add `dayNumber`
- [ ] Add `sessionType`
- [ ] Add `startTime`
- [ ] Add `endTime`
- [ ] Add `capacity`
- [ ] Add `reservedSeats`
- [ ] Add `confirmedSeats`
- [ ] Add `status`
- [ ] Add `venue`
- [ ] Add indexes for:
  - [ ] `eventId`
  - [ ] `examinerId`
  - [ ] `examComponentId`
  - [ ] `dayNumber/sessionType`
  - [ ] `status`

### Add `ExamSittingAssignment`

- [ ] Create `ExamSittingAssignment` model
- [ ] Add relations to `ExamSitting`, `ExamBooking`, and `User`
- [ ] Add `status`
- [ ] Add `attendanceStatus`
- [ ] Add `assignedAt`
- [ ] Add `assignedBy`
- [ ] Add uniqueness on `bookingId + sittingId`
- [ ] Add indexes

### Extend `ExamBooking`

- [ ] Add `guaranteeType`
- [ ] Add `demandStatus`
- [ ] Add `preferredSessionType`
- [ ] Add `guaranteedSeat`
- [ ] Add `executedAt`
- [ ] Add `rolloverFromBookingId`
- [ ] Add `rolloverToEventId`
- [ ] Review whether `examDate` remains meaningful during migration

### Extend `ExamAttendance`

- [ ] Add `sittingId`
- [ ] Add relation to `ExamSitting`
- [ ] Add index on `sittingId`

### Evolve fulfillment tracking

- [ ] Decide whether to extend `BookingEntitlement` or add a new fulfillment model
- [ ] If extending:
  - [ ] add fields for owed module fulfillment
  - [ ] add fields for executed/rolled-forward status
- [ ] If adding a new model:
  - [ ] define per-module guarantee tracking
  - [ ] keep legacy `BookingEntitlement` for resit accounting until migration completes

## Migration Tasks

- [ ] Create Prisma migration
- [ ] Create deployment-safe SQL artifact if needed
- [ ] Validate no existing enum conflicts with the DB
- [ ] Validate RLS and foreign-key compatibility

## Validation Gates

- [ ] `npx prisma validate`
- [ ] `npx tsc --noEmit`
- [ ] migration file reviewed for additive-only safety

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

- `lib/exams/demand.ts` new
- `app/student/exams/*`
- `app/student/exam-bookings/*`
- `app/staff/exams/*`
- possibly public-facing exam-only informational routes

## Checklist

### Build canonical demand service

- [ ] Create `lib/exams/demand.ts`
- [ ] Define event demand DTOs for:
  - [ ] total seat demand
  - [ ] guaranteed seat demand
  - [ ] flexible seat demand
  - [ ] module breakdown
  - [ ] pool breakdown
  - [ ] booking-type breakdown
  - [ ] institution/company breakdown if available

### Aggregate all booking types

- [ ] Include `POOL` bookings
- [ ] Include `INDIVIDUAL` bookings
- [ ] Include `GROUP_CHARTER` / company demand
- [ ] Include `TWIN_PACK` and `FOUR_PACK` per-module bookings
- [ ] Include resit seat demand where it contributes to event demand

### Define counting rules

- [ ] Decide whether demand is counted by:
  - [ ] candidate seats
  - [ ] module seats
  - [ ] guaranteed seats
  - [ ] paid seats
- [ ] Ensure event viability can consume the same aggregated output later

### Update student views

- [ ] Refactor `AvailablePoolsTab` to show demand-aware state
- [ ] Add visible distinction between:
  - [ ] public demand
  - [ ] candidate’s own booking status
  - [ ] guaranteed vs flexible booking
- [ ] Ensure counts no longer imply only standard pools matter

### Update staff views

- [ ] Refactor staff events tab to show:
  - [ ] total seat demand
  - [ ] guaranteed demand
  - [ ] distinct module demand
  - [ ] pool composition
- [ ] Ensure staff can inspect weak pools in the context of total event demand

### Public visibility design

- [ ] Decide which parts of demand are visible to registered modular/exam-only users
- [ ] Exclude sensitive personal/company data
- [ ] Include enough signal to motivate booking behavior

## Validation Gates

- [ ] Typecheck passes
- [ ] Staff event screens render with unified demand
- [ ] Student available-pools view reflects total demand correctly
- [ ] No booking mutation path has changed yet

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

- `lib/pools/assignment.ts` new
- `lib/pools/join.ts`
- `lib/pools/validation.ts`
- `lib/pools/auto-pool.ts`
- `app/student/actions.ts`
- `app/api/applicant/exam-only/book-exam/route.ts`
- `app/api/applicant/exam-only/join-pool/route.ts`

## Checklist

### Create assignment service

- [ ] Create `lib/pools/assignment.ts`
- [ ] Implement pool search strategy:
  - [ ] same module, open, capacity available
  - [ ] else earliest open pool with `<4` distinct modules and capacity
  - [ ] else create next pool
- [ ] Support explicit event scoping
- [ ] Support standard pool creation when needed

### Remove hard rejection on 5th module

- [ ] Refactor `lib/pools/validation.ts`
- [ ] Refactor `lib/pools/join.ts`
- [ ] Ensure 5th distinct module routes to another pool instead of failing outright

### Preserve capacity rules

- [ ] Still enforce max 28 seats per pool
- [ ] Still enforce max 4 distinct modules per pool
- [ ] Still prevent duplicate same-module-in-event joins for the same user where required

### Update applicant booking path

- [ ] Refactor `app/api/applicant/exam-only/book-exam/route.ts`
- [ ] Stop selecting the “first available pool” blindly
- [ ] Use shared assignment service

### Update student booking path

- [ ] Refactor student join actions to use shared assignment service
- [ ] Remove duplicated legacy pool creation rules where possible

### Update bundle placement

- [ ] Ensure each bundle module is assigned independently
- [ ] Allow modules in the same bundle to land in different pools if required
- [ ] Keep all booking and wallet logic atomic

### Legacy compatibility

- [ ] Ensure old pool labels and timing metadata are still populated sufficiently for existing screens
- [ ] If pool auto-creation relies on standard A/B/C/D assumptions, keep them functional during this phase

## Validation Gates

- [ ] Typecheck passes
- [ ] Joining a 5th distinct module routes to another pool instead of failing
- [ ] Bundles can split across pools without ledger corruption
- [ ] No pool exceeds 28 seats
- [ ] No pool exceeds 4 distinct modules

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

- [ ] Create `lib/exams/viability.ts`
- [ ] Implement viability evaluation using:
  - [ ] total paid seats
  - [ ] total guaranteed seats
  - [ ] total revenue
  - [ ] pool distribution
  - [ ] manual override
- [ ] Support threshold combinations described in business docs

### Refactor existing Go/No-Go code

- [ ] Update `lib/events/go-no-go.ts`
- [ ] Remove assumption that every pool below threshold forces failure
- [ ] Distinguish:
  - [ ] event viable
  - [ ] pool strong
  - [ ] pool weak but can still run
  - [ ] event not viable

### Refactor cron behavior

- [ ] Update `check-pools` cron to stop auto-failing all weak pools in isolation
- [ ] Ensure event-level viability is evaluated before pool failure/release actions
- [ ] Preserve redistribution behavior only where it still makes sense

### Define new outcomes clearly

- [ ] `GO`
- [ ] `NO_GO`
- [ ] `POSTPONE`
- [ ] `GO_WITH_UNDERFILLED_SITTINGS`
- [ ] `NEEDS_REVIEW`

### Staff UI updates

- [ ] Update Go/No-Go meter to reflect event-level viability
- [ ] Stop presenting pool-only revenue target as if it is the full truth
- [ ] Show underfilled but still serviceable demand

## Validation Gates

- [ ] Typecheck passes
- [ ] Event-level viability can succeed even if one pool is weak
- [ ] Weak pool is not auto-failed when event is already viable
- [ ] Funds are not prematurely released for guaranteed demand

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

- [ ] Create `lib/exams/scheduler.ts`
- [ ] Accept unified demand input from `lib/exams/demand.ts`
- [ ] Create sitting generation algorithm

### Sitting generation rules

- [ ] Generate sittings by module demand
- [ ] Prefer same-module clustering
- [ ] Support multiple days and sessions
- [ ] Respect capacity 28 per sitting by default
- [ ] Allow spare capacity in sittings when justified

### Candidate assignment rules

- [ ] No overlapping sittings for same user
- [ ] Respect max daily exam count
- [ ] Respect module duration and session timing
- [ ] Place guaranteed bookings before flexible pool demand

### Examiner assignment rules

- [ ] One examiner for now
- [ ] Prevent same-examiner overlap
- [ ] Design for future parallel examiner assignments

### Staff scheduling interface

- [ ] Add sitting planner to staff exams area
- [ ] Allow viewing generated sittings
- [ ] Allow manual adjustments
- [ ] Show warnings for:
  - [ ] candidate conflicts
  - [ ] examiner conflicts
  - [ ] spare seats
  - [ ] unscheduled guaranteed demand

### Transitional compatibility

- [ ] Ensure existing pool pages can still point to pools while sittings begin to exist
- [ ] Add links from pool/member views to assigned sittings where available

## Validation Gates

- [ ] Typecheck passes
- [ ] Scheduler can build valid sittings for one event
- [ ] No examiner overlap
- [ ] No candidate overlap
- [ ] Guaranteed demand is placed first

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

- [ ] Finalize whether fulfillment is tracked on:
  - [ ] extended `BookingEntitlement`
  - [ ] new fulfillment model
  - [ ] or a combination

### Implement roll-forward service

- [ ] Create `lib/exams/rollforward.ts`
- [ ] Identify all paid module attempts not executed in the current window
- [ ] Roll them into next event/window
- [ ] Preserve price/payment linkage
- [ ] Preserve booking group linkage where appropriate

### Bundle-specific rules

- [ ] One module executed, another not:
  - [ ] mark one as executed
  - [ ] mark the other as rolled forward
- [ ] Do not require repurchase of already-paid bundle module

### Individual and company rules

- [ ] Individual guaranteed seats roll forward if event is postponed or module not delivered
- [ ] Company/group-backed demand is preserved under contract-backed rules

### UI status propagation

- [ ] Student portal should show:
  - [ ] executed
  - [ ] scheduled
  - [ ] postponed
  - [ ] rolled forward
  - [ ] pending fulfillment

## Validation Gates

- [ ] Typecheck passes
- [ ] Paid bundle modules are never lost on partial execution
- [ ] Rolled-forward demand remains visible and owed
- [ ] No double-consumption of a bundle seat

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

- [ ] Update attendance write helper to use `sittingId` where available
- [ ] Continue supporting fallback booking/membership paths during migration

### Attendance UI

- [ ] Staff can mark attendance per sitting assignment
- [ ] Student portal shows per-module sitting attendance
- [ ] Full-time class-linked candidates retain optional `classId` linkage

### Exam records rendering

- [ ] Student history merges:
  - [ ] results
  - [ ] bookings
  - [ ] attendance
  - [ ] rolled-forward attempts
- [ ] Staff records view does the same without inventing misleading statuses

### No-show/excused handling

- [ ] No-show updates sitting assignment and booking correctly
- [ ] Excused status does not silently consume fulfillment incorrectly

## Validation Gates

- [ ] Typecheck passes
- [ ] Attendance works for:
  - [ ] pool candidates
  - [ ] individual candidates
  - [ ] bundle-derived candidates
  - [ ] full-time class-linked candidates

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

- [ ] Detect viable sittings with unused seats
- [ ] Classify which spare seats are eligible for backfill

### Resit matching

- [ ] Match failed modules to spare same-module capacity first
- [ ] Prevent candidate overlap
- [ ] Respect guarantee and timing rules

### Staff control

- [ ] Allow staff to approve or assign resit backfill
- [ ] Show warnings when resit assignment could affect schedule quality

### Record correctness

- [ ] Ensure resit attendance and result updates flow into exam records correctly

## Validation Gates

- [ ] Typecheck passes
- [ ] Spare seats can be backfilled without corrupting scheduling
- [ ] Resits update exam history correctly

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

- [ ] Find all reads of:
  - [ ] `ExamPool.examDate`
  - [ ] `ExamPool.examStartTime`
  - [ ] `ExamPool.examEndTime`
  - [ ] `ExamPool.dayNumber`
  - [ ] `ExamPool.timeSlot`
- [ ] Determine which are still needed for compatibility vs which must switch to `ExamSitting`

### Switch truth source

- [ ] Move student scheduling displays to `ExamSitting`
- [ ] Move staff operational scheduling displays to `ExamSitting`
- [ ] Keep pool timing only as advisory or remove from critical paths

### Retire obsolete logic

- [ ] Remove old pool-centric assumptions from cron
- [ ] Remove duplicate assignment logic
- [ ] Remove dead compatibility code once all routes have migrated

## Validation Gates

- [ ] Typecheck passes
- [ ] No critical user-facing schedule still depends on pool time alone
- [ ] Legacy compatibility code is documented or removed

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

- [ ] wallet top-up approved by admin can fund course purchase
- [ ] wallet top-up approved by admin can fund pool booking
- [ ] reserve/capture/release flows remain balanced
- [ ] cancellations do not corrupt balances

## Booking Types

- [ ] pool booking works
- [ ] individual booking works
- [ ] group/company booking works
- [ ] bundle booking works
- [ ] resit booking works

## Demand

- [ ] demand reflects all booking types
- [ ] staff demand views match student-facing counts

## Viability

- [ ] event can remain viable with one weak pool
- [ ] weak pool is not auto-failed when examiner trip is justified

## Scheduling

- [ ] same candidate cannot be double-booked
- [ ] one examiner cannot be double-booked
- [ ] module clustering is preferred
- [ ] overflow pools/sittings are created correctly

## Attendance and Results

- [ ] present/absent/excused writes update the correct records
- [ ] no-show handling is correct
- [ ] exam records display accurately in student and staff portals

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
