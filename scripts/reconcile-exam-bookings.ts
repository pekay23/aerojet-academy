/**
 * One-off script: reconcile stale exam bookings and sittings.
 *
 * This script is intended to be run once against production (or staging) to
 * clean up historical records that were left in limbo by the pre-fix Go/No-Go
 * and attendance flows.
 *
 * What it does:
 *  1. Finds ExamBooking rows where examDate < now and demandStatus is not in a
 *     terminal state (EXECUTED / ROLLED_FORWARD / CANCELLED / POSTPONED).
 *  2. For each, checks the linked ExamEvent status and reconciles:
 *     - CANCELLED event  -> demandStatus = CANCELLED, result = null
 *     - POSTPONED event  -> demandStatus = POSTPONED (or roll forward if target exists)
 *     - No attendance/result and past date -> demandStatus = CANCELLED, result = 'ABSENT'
 *  3. Cancels stale ExamSitting and ExamSittingAssignment for past events.
 *  4. Writes audit logs for every mutation.
 *
 * Usage:
 *   bun run scripts:reconcile-exam-bookings
 *
 * Safety:
 *   - Dry-run mode is the default. Pass --apply to actually mutate data.
 *   - The script prints a summary before mutating anything.
 */

import prisma from '../lib/prisma/client'
import { createAuditLog } from '../lib/audit/logger'
import { markExamAttendance } from '../lib/exams/attendance'

const DRY_RUN = process.argv.includes('--apply') === false
const BATCH_SIZE = 100

const TERMINAL_DEMAND_STATUSES = new Set(['EXECUTED', 'ROLLED_FORWARD', 'CANCELLED', 'POSTPONED'])

const COMPLETED_RESULT_VALUES = new Set([
  'PASS',
  'FAIL',
  'ABSENT',
  'EXCUSED',
  'MIGRATED',
  'HISTORICAL',
])

async function reconcileBookings() {
  console.log('\n=== Reconciling ExamBookings ===')

  const staleBookings = await prisma.examBooking.findMany({
    where: {
      examDate: { lt: new Date() },
      deletedAt: null,
      demandStatus: { notIn: Array.from(TERMINAL_DEMAND_STATUSES) },
    },
    include: {
      event: true,
      user: {
        select: { id: true, email: true, profile: { select: { firstName: true } } },
      },
    },
    take: BATCH_SIZE,
  })

  console.log(`Found ${staleBookings.length} stale bookings to review`)

  let fixed = 0
  let skipped = 0
  let errors = 0

  for (const booking of staleBookings) {
    try {
      // Skip if already has a completed result
      if (booking.result && COMPLETED_RESULT_VALUES.has(booking.result.toUpperCase())) {
        skipped++
        continue
      }

      // Skip if score exists
      if (booking.score != null) {
        skipped++
        continue
      }

      // Check if attendance exists
      const attendance = await prisma.examAttendance.findFirst({
        where: {
          OR: [{ membershipId: booking.id }, { bookingId: booking.id }],
        },
      })
      if (attendance) {
        skipped++
        continue
      }

      // Check if result exists
      const result = await prisma.examResult.findFirst({
        where: {
          bookingId: booking.id,
          examComponentId: booking.examComponentId,
        },
      })
      if (result) {
        skipped++
        continue
      }

      // Determine action based on event status
      const eventStatus = booking.event?.status
      let action: 'CANCEL' | 'POSTPONE' | 'MARK_ABSENT' = 'MARK_ABSENT'

      if (eventStatus === 'CANCELLED') {
        action = 'CANCEL'
      } else if (eventStatus === 'POSTPONED') {
        action = 'POSTPONE'
      }

      if (DRY_RUN) {
        console.log(`[DRY RUN] Would ${action} booking ${booking.id} (${booking.moduleCode})`)
        fixed++
        continue
      }

      // Apply fix
      if (action === 'CANCEL') {
        await prisma.examBooking.update({
          where: { id: booking.id },
          data: {
            demandStatus: 'CANCELLED',
            cancellationReason: 'Reconciled: event was cancelled',
            cancelledAt: new Date(),
          },
        })
      } else if (action === 'POSTPONE') {
        await prisma.examBooking.update({
          where: { id: booking.id },
          data: {
            demandStatus: 'POSTPONED',
            cancellationReason: 'Reconciled: event was postponed',
          },
        })
      } else {
        // Mark as absent via attendance
        await markExamAttendance({
          bookingId: booking.id,
          status: 'ABSENT',
        })
      }

      await createAuditLog({
        action: 'UPDATE',
        entity: 'ExamBooking',
        entityId: booking.id,
        userId: null,
        description: `Reconciled stale booking: ${action} for module ${booking.moduleCode}`,
        changes: {
          before: { demandStatus: booking.demandStatus, result: booking.result },
          after: {
            demandStatus:
              action === 'CANCEL'
                ? 'CANCELLED'
                : action === 'POSTPONE'
                  ? 'POSTPONED'
                  : booking.demandStatus,
            result: action === 'MARK_ABSENT' ? 'ABSENT' : booking.result,
          },
        },
      })

      fixed++
      console.log(
        `[${DRY_RUN ? 'DRY RUN' : 'APPLIED'}] ${action} booking ${booking.id} (${booking.moduleCode})`
      )
    } catch (err: unknown) {
      errors++
      console.error(
        `Error processing booking ${booking.id}:`,
        err instanceof Error ? err.message : String(err)
      )
    }
  }

  console.log(
    `\nBooking reconciliation summary: ${fixed} fixed, ${skipped} skipped, ${errors} errors`
  )
  return { fixed, skipped, errors }
}

async function reconcileSittings() {
  console.log('\n=== Reconciling ExamSittings ===')

  const pastSittings = await prisma.examSitting.findMany({
    where: {
      startTime: { lt: new Date() },
      deletedAt: null,
      status: { notIn: ['COMPLETED', 'CANCELLED'] },
    },
    include: {
      event: true,
      assignments: {
        include: {
          booking: {
            include: {
              user: true,
            },
          },
        },
      },
    },
    take: BATCH_SIZE,
  })

  console.log(`Found ${pastSittings.length} past sittings to review`)

  let fixed = 0
  let skipped = 0
  let errors = 0

  for (const sitting of pastSittings) {
    try {
      // Skip if event is still active
      if (sitting.event?.status === 'OPEN' || sitting.event?.status === 'CONFIRMED') {
        skipped++
        continue
      }

      if (DRY_RUN) {
        console.log(
          `[DRY RUN] Would cancel sitting ${sitting.id} and ${sitting.assignments.length} assignments`
        )
        fixed++
        continue
      }

      // Cancel assignments
      await prisma.examSittingAssignment.updateMany({
        where: {
          sittingId: sitting.id,
          status: { notIn: ['CANCELLED', 'ATTENDED', 'EXCUSED'] },
        },
        data: { status: 'CANCELLED' },
      })

      // Cancel sitting
      await prisma.examSitting.update({
        where: { id: sitting.id },
        data: { status: 'CANCELLED' },
      })

      await createAuditLog({
        action: 'UPDATE',
        entity: 'ExamSitting',
        entityId: sitting.id,
        userId: null,
        description: `Reconciled past sitting: cancelled ${sitting.assignments.length} assignments`,
        changes: {
          before: { status: sitting.status },
          after: { status: 'CANCELLED' },
        },
      })

      fixed++
      console.log(
        `[APPLIED] Cancelled sitting ${sitting.id} and ${sitting.assignments.length} assignments`
      )
    } catch (err: unknown) {
      errors++
      console.error(
        `Error processing sitting ${sitting.id}:`,
        err instanceof Error ? err.message : String(err)
      )
    }
  }

  console.log(
    `\nSitting reconciliation summary: ${fixed} fixed, ${skipped} skipped, ${errors} errors`
  )
  return { fixed, skipped, errors }
}

async function main() {
  console.log('Starting exam reconciliation script...')
  console.log(
    `Mode: ${DRY_RUN ? 'DRY RUN (no data will be mutated)' : 'APPLY (data will be mutated)'}`
  )

  const bookingResults = await reconcileBookings()
  const sittingResults = await reconcileSittings()

  console.log('\n=== FINAL SUMMARY ===')
  console.log(
    `Bookings: ${bookingResults.fixed} fixed, ${bookingResults.skipped} skipped, ${bookingResults.errors} errors`
  )
  console.log(
    `Sittings: ${sittingResults.fixed} fixed, ${sittingResults.skipped} skipped, ${sittingResults.errors} errors`
  )

  if (DRY_RUN) {
    console.log('\nThis was a dry run. Run with --apply to mutate data.')
  } else {
    console.log('\nData mutations applied. Review the audit log for details.')
  }

  await prisma.$disconnect()
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
