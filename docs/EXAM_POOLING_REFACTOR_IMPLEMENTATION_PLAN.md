# Exam Pooling Refactor Implementation Plan

## Purpose

This document is the canonical implementation plan for refactoring the Aerojet exam booking system from the current pool-centric model into a demand-driven, scheduling-aware model that matches the updated business rules.

It is written for engineers and AI agents working in this repository so implementation can proceed consistently without re-interpreting the business logic from scratch.

## Why This Refactor Is Needed

The current implementation mixes three different concerns into the same structures:

1. Public demand collection
2. Commercial booking/guarantee logic
3. Final exam delivery scheduling

That coupling was acceptable for the first-generation model where a pool was treated as the final exam sitting, but it is not sufficient for the current operational requirement.

The updated business model requires:

- visible public demand across all booking types
- rolling pool creation and overflow handling
- bundle commitments that survive partial pool failure
- event-level viability instead of isolated pool failure
- support for candidates writing multiple modules across multiple sessions and days
- one examiner for now, with future support for multiple examiners running parallel sittings

## Current Repo Reality

### Current Intent in Docs

The source documentation already establishes most of the first-generation business model:

- a pool is a single exam sitting
- a candidate takes one module per pool
- each pool supports up to 4 distinct modules
- each pool targets 25-28 candidates
- event Go/No-Go is based on aggregate thresholds across booking types
- confirmed bookings can roll forward when the event is postponed

Relevant sources:

- `aerojet master/AEROJET_Pooling_System_Complete_Technical_Spec (1).md`
- `aerojet master/AEROJET_MASTER_PACK_COMPLETE.md`
- `text_output.txt`

### Current Live Implementation

The codebase diverges from the written model in important ways:

- `ExamPool` is still both demand container and final timed sitting
- `PoolMembership` enforces one membership per user per pool
- pool joining rejects a 5th distinct module instead of routing it into the next pool
- event Go/No-Go logic still evaluates weak pools too aggressively and independently
- public pool visibility does not yet reflect total demand across all booking types
- group charters and individual bookings are not integrated into a unified demand layer

Relevant files:

- `prisma/schema.prisma`
- `lib/pools/join.ts`
- `lib/pools/validation.ts`
- `lib/pools/auto-pool.ts`
- `lib/pools/group-booking.ts`
- `lib/events/go-no-go.ts`
- `app/api/cron/check-pools/route.ts`
- `app/api/applicant/exam-only/book-exam/route.ts`
- `app/student/exams/_components/AvailablePoolsTab.tsx`

## Updated Business Rules

This section defines the target behavior to implement.

### 1. Pool Filling Rules

- A pool can hold a maximum of 28 candidate seats.
- A pool can contain a maximum of 4 distinct modules.
- New modules can continue to be introduced into a pool until 4 distinct modules are present.
- Once a pool has 4 distinct modules:
  - more students for those same 4 modules may still join
  - a candidate for a 5th distinct module must be routed into another pool
- When a pool reaches 28 candidate seats:
  - no more candidates can join that pool
  - overflow must be routed into the next eligible pool
- This process repeats until all candidates and all requested modules are accommodated.

### 2. Pool Selection Rules

For each booking that needs pool placement:

1. Prefer an existing open pool in the event that already contains the requested module and still has capacity.
2. Otherwise prefer the earliest open pool with fewer than 4 distinct modules and capacity.
3. Otherwise create the next pool and assign the booking there.

This is the required behavior for both normal pool booking and bundle-driven pool assignment.

### 3. Demand Visibility Rules

Pool/status visibility must represent total real demand, not just standard pooled seats.

Demand shown to users should include:

- pooled bookings
- individual bookings
- company/group bookings
- bundle-derived module bookings
- eligible resit seat demand if it contributes to the event

This visibility is intentional. It helps external candidates and partner institutions see whether an exam window is becoming viable and encourages faster commitment.

### 4. Event Viability Rules

Event viability must be determined at event level, not by independently failing every weak pool.

The event should be considered viable when aggregate demand/economics meet business thresholds. Those thresholds may include:

- total confirmed paid seats
- total confirmed revenue
- number of viable pools
- manual operational override

If the examiner is already coming because the event is viable overall, weaker pools or underfilled sessions may still be allowed to run.

### 5. Underfilled Pool and Session Rules

If the event is viable and the examiner trip is confirmed:

- an underfilled pool does not have to fail automatically
- the underfilled pool may still be scheduled and delivered
- spare seats may be backfilled with:
  - resits
  - late individual bookings
  - staff/manual assignments

This is especially important when stronger pools or other booking types already make the event economically viable.

### 6. Bundle Rules

Bundles represent guaranteed, paid entitlements to module attempts.

- a twin bundle creates two guaranteed module demands
- a four-seat bundle creates four guaranteed module demands
- those module bookings may land in different pools
- if one bundled module executes and another does not:
  - the executed module is consumed
  - the unexecuted module remains owed
  - the unexecuted module must roll forward automatically into the next exam window at no extra cost

Bundle logic must not treat all seats in a bundle as all-or-nothing.

### 7. Individual and Company Booking Rules

Individual and company bookings must contribute to visible demand and viability calculations.

However, their guarantees differ:

- `INDIVIDUAL` bookings are guaranteed seats
- `COMPANY` / `GROUP_CHARTER` bookings are commercially committed demand and should also be treated as guaranteed or contract-backed demand
- pool bookings are flexible demand until the event and final sittings are confirmed

### 8. Candidate Daily Scheduling Rules

Candidates can write multiple exams within the same event window, but final scheduling must respect:

- per-day maximum of 2 or 3 separate exams depending on duration and session layout
- no overlapping assignments
- realistic examiner/session timing
- module duration differences

This means scheduling can no longer be represented correctly by pool time alone.

### 9. Examiner Rules

For now:

- there is one active examiner
- the examiner can only supervise one sitting at a time

Future support must allow:

- multiple examiners
- parallel sittings
- examiner conflict detection

The schema and services should be future-ready now even if the initial implementation uses only one examiner.

### 10. Financial and Registration Integrity Rules

To maintain absolute data and financial integrity, the following rules must be enforced during any booking or pool assignment operation:

- **Wallet Pre-check**: No `PoolMembership` or `ExamBooking` can be created or updated without a mandatory verification of the user's wallet balance.
- **Fund Reservation**: 
  - If the wallet balance is sufficient (>= exam/module cost), the funds must be moved from `availableBalance` to `reservedBalance`.
  - The `ExamBooking` status must be set to `APPROVED` and `demandStatus` to `POOLED`.
  - The `PoolMembership` record must include the `amountReserved`.
- **Intended Demand Handling**:
  - If a student has insufficient funds, they **must not** occupy a seat in a pool (`PoolMembership`).
  - Instead, their interest should be tracked as "Intended Demand" (using `PoolWaitlist` or a non-seating metadata layer) without a financial `ExamBooking` record.
- **Pathway Enforcement**: 
  - Specific student groups (e.g., Ghana Airforce officers) must have their `programmeChoice` explicitly set to `EXAM_ONLY` in their `StudentProfile`.
  - Registration flows must validate this pathway before allowing exam-only bookings.
- **Atomic Linking**: 
  - Every pool membership must be explicitly linked to:
    - a valid `ExamPool`
    - a specific `ExamComponent` (module)
    - a confirmed `ExamBooking` (if paid/reserved)
  - Ghost memberships (unlinked or un-reserved) are strictly prohibited in the live pools.


The refactor should separate the domain into four clear layers.

### A. Demand Layer

Purpose:

- collect and expose all exam demand across booking types
- power public/student/staff visibility
- power viability calculations

Primary concepts:

- event demand
- module demand
- guaranteed vs flexible demand
- pool grouping for public consumption

### B. Pooling Layer

Purpose:

- organize demand into public-facing pool buckets
- enforce max 28 seats and max 4 distinct modules
- apply rolling overflow behavior

Important note:

Pools should no longer be the final delivery-time source of truth.

### C. Scheduling Layer

Purpose:

- create real exam sittings
- assign bookings into timed sessions
- enforce candidate, room, and examiner constraints

This is where delivery actually happens.

### D. Fulfillment Layer

Purpose:

- track whether a paid seat has been executed, rolled forward, or remains pending
- preserve individual, company, and bundle guarantees
- support accurate attendance and exam record history

## Required Data Model Changes

These schema changes define the target model.

### 1. Extend `ExamEvent`

Add event-level viability fields so the event can be assessed on more than a single revenue number.

Suggested additions:

- `minCandidateTarget`
- `minSeatVolumeTarget`
- `minRevenueTarget` (already exists)
- `viabilityMode`
- `isExaminerConfirmed`
- `confirmedExaminerCount`

Suggested enum:

- `EventViabilityMode`
  - `CANDIDATE_COUNT`
  - `SEAT_VOLUME`
  - `REVENUE`
  - `HYBRID`

### 2. Keep but Reframe `ExamPool`

`ExamPool` should remain but its role changes.

It becomes:

- a public demand bucket
- a rolling capacity and module-diversity container
- an operational grouping mechanism

It should stop being treated as the ultimate delivery schedule record.

Suggested additions:

- `poolNumber`
- `isPublicVisible`
- `totalDemandSeats`
- `guaranteedSeats`

Notes:

- keep existing timing fields during migration for compatibility
- do not treat pool time as final truth once `ExamSitting` exists

### 3. Add `Examiner`

Create an explicit model for the examiner.

Suggested fields:

- `userId`
- `isActive`
- `maxParallelSittings`
- `notes`

### 4. Add `ExamSitting`

This becomes the real scheduled delivery slot.

Each sitting should represent:

- one event
- one module
- one day/session
- one time block
- one examiner assignment
- one capacity value

Suggested fields:

- `eventId`
- `examinerId`
- `examComponentId`
- `dayNumber`
- `sessionType`
- `startTime`
- `endTime`
- `capacity`
- `reservedSeats`
- `confirmedSeats`
- `status`
- `venue`
- `notes`

Suggested enums:

- `SessionType`
  - `MORNING`
  - `AFTERNOON`
  - `EVENING`
- `SittingStatus`
  - `DRAFT`
  - `OPEN`
  - `SCHEDULED`
  - `CONFIRMED`
  - `COMPLETED`
  - `POSTPONED`
  - `CANCELLED`

### 5. Add `ExamSittingAssignment`

This links a booking to a real sitting.

Suggested fields:

- `sittingId`
- `bookingId`
- `userId`
- `status`
- `attendanceStatus`
- `assignedAt`
- `assignedBy`

Suggested enum:

- `SittingAssignmentStatus`
  - `ASSIGNED`
  - `CONFIRMED`
  - `ATTENDED`
  - `ABSENT`
  - `EXCUSED`
  - `ROLLED_FORWARD`
  - `CANCELLED`

### 6. Extend `ExamBooking`

`ExamBooking` remains the financial and student-facing unit, one row per module attempt.

Add fields for guarantee and fulfillment behavior:

- `guaranteeType`
- `demandStatus`
- `preferredSessionType`
- `guaranteedSeat`
- `executedAt`
- `rolloverFromBookingId`
- `rolloverToEventId`

Suggested enums:

- `BookingGuaranteeType`
  - `POOL_FLEX`
  - `INDIVIDUAL_GUARANTEED`
  - `COMPANY_GUARANTEED`
  - `BUNDLE_GUARANTEED`
- `BookingDemandStatus`
  - `DEMAND_CAPTURED`
  - `POOLED`
  - `SCHEDULED`
  - `EXECUTED`
  - `ROLLED_FORWARD`
  - `POSTPONED`
  - `CANCELLED`

### 7. Evolve `BookingEntitlement`

`BookingEntitlement` already exists and currently tracks free resits per booking group.

That is not enough for the new model.

It must either be:

- extended into a full fulfillment-tracking model, or
- supplemented by a new guaranteed-demand model

Needed behavior:

- track whether a paid module attempt is still owed
- distinguish executed vs pending vs rolled-forward module obligations
- support bundle-level and possibly company-level fulfillment grouping

### 8. Extend `ExamAttendance`

Attendance must eventually be linked to the sitting assignment or at least sitting itself.

Current attendance is still tied mainly to booking/membership context.

Add:

- `sittingId`

Then progressively move attendance flows to use sitting-aware logic.

## Service Layer Refactor

Create or refactor services in a way that preserves clean domain boundaries.

### 1. `lib/exams/demand.ts`

Responsibilities:

- aggregate visible demand for an event
- include all booking types
- group demand by module
- compute guaranteed vs flexible demand
- compute total seat volume
- feed public/student/staff demand dashboards

### 2. `lib/pools/assignment.ts`

Responsibilities:

- implement rolling pool selection
- prefer same-module pool reuse
- prefer partially filled pools before creating new ones
- auto-create next pool when needed

This should replace the current hard-reject behavior for a 5th distinct module.

### 3. `lib/exams/viability.ts`

Responsibilities:

- evaluate event-level viability
- calculate candidate, revenue, and seat-volume thresholds
- determine whether underfilled pools/sittings may still run
- centralize manual override handling

This should become the new authoritative replacement for the current pool-centric Go/No-Go assumptions.

### 4. `lib/exams/scheduler.ts`

Responsibilities:

- build real sittings from demand
- assign bookings into sittings
- cluster same-module demand where possible
- enforce no-overlap and daily-limit rules
- enforce examiner availability

### 5. `lib/exams/rollforward.ts`

Responsibilities:

- detect paid bookings not executed in the current window
- move them into the next event/window
- preserve payment linkage
- mark fulfillment correctly

### 6. `lib/exams/resits.ts`

Responsibilities:

- backfill spare sitting capacity with resits
- respect eligibility and scheduling constraints
- ensure resit outcomes update exam history correctly

## Required Behavioral Changes in Existing Logic

This section describes the most important code changes relative to the current implementation.

### 1. Replace “Reject 5th Module” With “Route to Next Pool”

Current behavior in validation and join logic:

- if the pool already has 4 distinct modules
- and the candidate requests a new module
- reject the join

Target behavior:

- search for the next eligible pool
- if found, route there
- if not found, create one and route there

### 2. Stop Failing Pools in Isolation at T-21

Current behavior:

- weak pools are failed independently at T-21
- cron logic releases their funds even if the event may still be worth running

Target behavior:

- evaluate event viability first
- if event is viable, weak pools may still become real sittings or be merged/scheduled differently
- if event is not viable, then roll forward or release based on guarantee type

### 3. Integrate Individual and Company Bookings Into Demand

Current behavior:

- individual bookings largely bypass pool demand
- group charter creates a dedicated pool but not a complete seat-level demand model

Target behavior:

- all demand counts into the same event-level visibility and viability model

### 4. Split Timing Off of Pools

Current behavior:

- pool date/time is treated as final schedule

Target behavior:

- pool is for demand organization
- sitting is for actual schedule and attendance

### 5. Bundle Modules Must Be Fulfilled Independently

Current behavior:

- bundles create multiple bookings, but the system does not yet fully model partial execution and guaranteed carry-forward

Target behavior:

- each module in the bundle becomes its own fulfillment obligation
- unexecuted paid modules roll forward automatically

## UI and API Impact

### Student Portal

Update student exam views to show:

- event-level demand
- pool demand composition
- booking guarantee status
- sitting assignment when scheduled
- roll-forward state if a paid module is deferred

Key areas:

- `app/student/exams/*`
- `app/student/exam-bookings/*`

### Staff Portal

Update staff exam management to show:

- event demand dashboard
- pool composition
- module demand heatmap
- viability indicators
- sitting planner
- examiner allocation
- resit backfill opportunities

Key areas:

- `app/staff/exams/*`
- `app/staff/_components/GoNoGoMeter.tsx`

### Public / Registered Demand Visibility

Registered modular and exam-only users should be able to see meaningful progress indicators:

- seat demand
- module demand mix
- whether an event window is likely to proceed

Do not expose:

- named candidates
- sensitive company financial details

## Migration Strategy

The refactor should be staged carefully to avoid breaking wallet, ledger, and existing booking flows.

### Phase 1: Schema Foundation

Goals:

- add new models and fields without changing runtime behavior yet

Deliverables:

- `Examiner`
- `ExamSitting`
- `ExamSittingAssignment`
- extended `ExamEvent`
- extended `ExamBooking`
- extended `ExamAttendance`
- upgraded fulfillment / entitlement structure

### Phase 2: Unified Demand Read Model

Goals:

- compute accurate demand without changing write paths yet

Deliverables:

- `lib/exams/demand.ts`
- updated staff/student/public read models
- demand views that include all booking types

### Phase 3: Pool Assignment Rewrite

Goals:

- replace hard-reject logic with rolling pool assignment

Deliverables:

- new `lib/pools/assignment.ts`
- refactor `lib/pools/join.ts`
- refactor applicant and student exam-booking entry points

### Phase 4: Event-Level Viability

Goals:

- replace current pool-centric Go/No-Go

Deliverables:

- `lib/exams/viability.ts`
- refactor `lib/events/go-no-go.ts`
- refactor `app/api/cron/check-pools/route.ts`
- possibly split pool check and event check responsibilities more cleanly

### Phase 5: Scheduler

Goals:

- introduce real sittings and sitting assignment

Deliverables:

- `lib/exams/scheduler.ts`
- staff scheduling interfaces
- sitting assignment logic

### Phase 6: Attendance and Records

Goals:

- make attendance and exam records sitting-aware

Deliverables:

- sitting-aware attendance writes
- exam record rendering updated to show correct status per module sitting

### Phase 7: Legacy Pool Timing Deprecation

Goals:

- stop using pool datetime as delivery truth

Deliverables:

- pool datetime retained only for compatibility or eventually removed from critical logic

## Acceptance Criteria

The refactor is only considered complete when all of the following are true.

### Demand Visibility

- all active booking types contribute to visible demand
- users can see actual demand progression for an event

### Pool Assignment

- a 5th distinct module never hard-fails if another pool can be created or reused
- pools fill progressively
- same-module grouping is preferred
- overflow creates new pools automatically

### Viability

- weak pools are not failed independently if overall event viability is already satisfied
- event viability is calculated from aggregate booking demand

### Bundles

- every bundle module is represented as a separate module attempt
- bundle modules may land in different pools/sittings
- unexecuted paid modules roll forward automatically

### Scheduling

- one examiner cannot be double-booked
- candidates cannot be assigned to overlapping sittings
- per-day candidate exam limits are enforced
- module clustering is preferred where feasible

### Attendance and Records

- each executed module sitting can produce independent attendance and result data
- resits can use spare seats and still update records correctly

## Primary Files Likely To Change

The highest-impact files/modules for this refactor are:

- `prisma/schema.prisma`
- `lib/pools/join.ts`
- `lib/pools/validation.ts`
- `lib/pools/auto-pool.ts`
- `lib/pools/group-booking.ts`
- `lib/pools/operations.ts`
- `lib/events/go-no-go.ts`
- `app/api/cron/check-pools/route.ts`
- `app/api/applicant/exam-only/book-exam/route.ts`
- `app/api/applicant/exam-only/join-pool/route.ts`
- `app/student/actions.ts`
- `app/student/exams/_components/AvailablePoolsTab.tsx`
- `app/staff/exams/page.tsx`
- `lib/exams/attendance.ts`

New planned modules:

- `lib/exams/demand.ts`
- `lib/exams/viability.ts`
- `lib/exams/scheduler.ts`
- `lib/exams/rollforward.ts`
- `lib/exams/resits.ts`
- `lib/pools/assignment.ts`

## Implementation Order Recommendation

The recommended engineering order is:

1. Schema foundation
2. Unified demand read layer
3. Rolling pool assignment
4. Event-level viability logic
5. Sitting scheduler
6. Attendance and exam record migration
7. Legacy pool-time deprecation

Do not begin with UI-first changes. The domain split between demand, pooling, scheduling, and fulfillment must be established before extensive surface-level work.

## Final Guiding Principle

The current system should evolve from:

- `Pool = the exam sitting`

to:

- `Pool = demand grouping`
- `Sitting = actual scheduled delivery`
- `Booking = financial / student-facing attempt`
- `Fulfillment = whether a paid module has actually been delivered or rolled forward`

That domain separation is the key design requirement that makes the rest of the updated business rules implementable without brittle workarounds.
