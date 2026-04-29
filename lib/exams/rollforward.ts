import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma/client'
import { resolveStandardPoolForJoin } from '@/lib/pools/assignment'
import { joinPoolInternal } from '@/lib/pools/join'
import { hasMixedBookingGroupFulfillment } from '@/lib/exams/fulfillment'

const ROLL_FORWARDABLE_BOOKING_TYPES = ['INDIVIDUAL', 'RESIT', 'TWIN_PACK', 'FOUR_PACK'] as const
const COMPANY_ROLL_FORWARDABLE_TYPES = ['GROUP_CHARTER'] as const

/**
 * Guard: returns true if an active clone of sourceBookingId already exists in targetEventId.
 * Use before creating a roll-forward clone to prevent double-consumption.
 */
export async function checkDoubleConsumptionGuard(
  tx: Prisma.TransactionClient,
  sourceBookingId: string,
  targetEventId: string
): Promise<boolean> {
  const existing = await tx.examBooking.findFirst({
    where: {
      rolloverFromBookingId: sourceBookingId,
      eventId: targetEventId,
      deletedAt: null,
      status: { notIn: ['CANCELLED'] },
    },
    select: { id: true },
  })
  return existing !== null
}

function isAlreadyPaidBooking(booking: {
  bookingType: string
  amountPaid: Prisma.Decimal
  status: string
}) {
  if (booking.bookingType === 'TWIN_PACK' || booking.bookingType === 'FOUR_PACK') return true
  return Number(booking.amountPaid || 0) > 0 && ['APPROVED', 'COMPLETED', 'NO_SHOW'].includes(booking.status)
}

export async function rollForwardGuaranteedBookingsFromCancelledEvent(
  eventId: string,
  actorId?: string | null
) {
  return rollForwardGuaranteedBookings({
    eventId,
    actorId,
    sourceReason: 'Rolled forward after event cancellation',
    deferredReason: 'Awaiting roll-forward into a future event window',
  })
}

export async function rollForwardGuaranteedBookings(params: {
  eventId: string
  actorId?: string | null
  bookingIds?: string[]
  targetEventId?: string | null
  sourceReason: string
  deferredReason: string
}) {
  const { eventId, actorId, bookingIds, targetEventId, sourceReason, deferredReason } = params

  return prisma.$transaction(async (tx) => {
    const event = await tx.examEvent.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        startDate: true,
      },
    })

    if (!event) throw new Error('Event not found')

    const targetEvent = targetEventId
      ? await tx.examEvent.findUnique({
          where: { id: targetEventId },
          select: { id: true, name: true },
        })
      : await tx.examEvent.findFirst({
          where: {
            id: { not: eventId },
            status: { in: ['OPEN', 'DRAFT'] },
            startDate: { gt: event.startDate },
          },
          orderBy: { startDate: 'asc' },
          select: { id: true, name: true },
        })

    const candidates = await tx.examBooking.findMany({
      where: {
        eventId,
        deletedAt: null,
        ...(bookingIds?.length ? { id: { in: bookingIds } } : {}),
        bookingType: { in: [...ROLL_FORWARDABLE_BOOKING_TYPES] },
        guaranteeType: { not: 'POOL_FLEX' },
        demandStatus: { notIn: ['EXECUTED', 'ROLLED_FORWARD', 'CANCELLED'] },
        rolloverToEventId: null,
      },
      select: {
        id: true,
        userId: true,
        examComponentId: true,
        moduleCode: true,
        bookingType: true,
        amountPaid: true,
        status: true,
        demandStatus: true,
        attemptType: true,
        bookingGroupRef: true,
        courseId: true,
        examCategory: true,
        preferredSessionType: true,
        walletTxnId: true,
        isResit: true,
        executedAt: true,
      },
      orderBy: { bookedAt: 'asc' },
    })

    const eligibleBookings = candidates.filter(
      (booking) =>
        booking.examComponentId &&
        booking.moduleCode &&
        !booking.executedAt &&
        isAlreadyPaidBooking(booking)
    )

    if (!targetEvent) {
      if (eligibleBookings.length > 0) {
        await tx.examBooking.updateMany({
          where: { id: { in: eligibleBookings.map((booking) => booking.id) } },
          data: {
            demandStatus: 'POSTPONED',
            cancellationReason: deferredReason,
          },
        })
      }

      return {
        targetEventId: null,
        targetEventName: null,
        rolledForwardCount: 0,
        deferredCount: eligibleBookings.length,
        partiallyFulfilledGroupCount: 0,
      }
    }

    let rolledForwardCount = 0
    let partiallyFulfilledGroupCount = 0
    const partialGroupsCounted = new Set<string>()

    const bookingGroupRefs = Array.from(
      new Set(eligibleBookings.map((booking) => booking.bookingGroupRef).filter((value): value is string => Boolean(value)))
    )

    const groupedBookings = bookingGroupRefs.length
      ? await tx.examBooking.findMany({
          where: {
            eventId,
            deletedAt: null,
            bookingGroupRef: { in: bookingGroupRefs },
          },
          select: {
            id: true,
            bookingGroupRef: true,
            demandStatus: true,
            executedAt: true,
            rolloverToEventId: true,
            status: true,
          },
        })
      : []
    const groupedBookingMap = new Map<string, typeof groupedBookings>()
    for (const booking of groupedBookings) {
      if (!booking.bookingGroupRef) continue
      const current = groupedBookingMap.get(booking.bookingGroupRef) || []
      current.push(booking)
      groupedBookingMap.set(booking.bookingGroupRef, current)
    }

    for (const booking of eligibleBookings) {
      if (booking.bookingGroupRef && !partialGroupsCounted.has(booking.bookingGroupRef)) {
        const related = groupedBookingMap.get(booking.bookingGroupRef) || []
        if (hasMixedBookingGroupFulfillment(related)) {
          partiallyFulfilledGroupCount += 1
          partialGroupsCounted.add(booking.bookingGroupRef)
        }
      }

      const existingClone = await tx.examBooking.findFirst({
        where: {
          rolloverFromBookingId: booking.id,
          eventId: targetEvent.id,
          deletedAt: null,
        },
        select: { id: true },
      })

      if (existingClone) {
        await tx.examBooking.update({
          where: { id: booking.id },
          data: {
            demandStatus: 'ROLLED_FORWARD',
            rolloverToEventId: targetEvent.id,
            status: 'CANCELLED',
            cancellationReason: sourceReason,
            cancelledAt: new Date(),
            cancelledBy: actorId ?? null,
          },
        })

        await tx.poolMembership.updateMany({
          where: {
            bookingId: booking.id,
            status: { in: ['RESERVED', 'CONFIRMED', 'NO_SHOW'] },
          },
          data: { status: 'ROLLED' },
        })
        continue
      }

      const resolvedPool = await resolveStandardPoolForJoin(tx, {
        eventId: targetEvent.id,
        moduleCode: booking.moduleCode!,
      })

      const placement = await joinPoolInternal(tx, {
        poolId: resolvedPool.id,
        userId: booking.userId,
        examComponentId: booking.examComponentId!,
        eventId: targetEvent.id,
        moduleCode: booking.moduleCode!,
        bookingType: booking.bookingType as 'INDIVIDUAL' | 'RESIT' | 'TWIN_PACK' | 'FOUR_PACK',
        reserveAmount: 0,
        amountPaid: Number(booking.amountPaid || 0),
        isResit: booking.isResit,
      })

      if (!placement.success || !placement.booking) {
        throw new Error(placement.error || `Failed to roll forward booking ${booking.id}`)
      }

      await tx.examBooking.update({
        where: { id: placement.booking.id },
        data: {
          rolloverFromBookingId: booking.id,
          attemptType: booking.attemptType,
          bookingGroupRef: booking.bookingGroupRef,
          courseId: booking.courseId,
          examCategory: booking.examCategory,
          preferredSessionType: booking.preferredSessionType,
          walletTxnId: booking.walletTxnId,
          status: 'APPROVED',
        },
      })

      await tx.examBooking.update({
        where: { id: booking.id },
        data: {
          demandStatus: 'ROLLED_FORWARD',
          rolloverToEventId: targetEvent.id,
          status: 'CANCELLED',
          cancellationReason: sourceReason,
          cancelledAt: new Date(),
          cancelledBy: actorId ?? null,
        },
      })

      await tx.poolMembership.updateMany({
        where: {
          bookingId: booking.id,
          status: { in: ['RESERVED', 'CONFIRMED', 'NO_SHOW'] },
        },
        data: { status: 'ROLLED' },
      })

      rolledForwardCount += 1
    }

    return {
      targetEventId: targetEvent.id,
      targetEventName: targetEvent.name,
      rolledForwardCount,
      deferredCount: 0,
      partiallyFulfilledGroupCount,
    }
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  })
}

/**
 * Phase 6 — Individual postponement rule.
 *
 * When an event RUNS but a candidate's module was not delivered (e.g. examiner
 * unavailable for that module), that booking lands in demandStatus=POSTPONED with
 * no rolloverToEventId. This function picks them up and rolls them into the next
 * open/draft event — identical to the cancelled-event path but scoped to only
 * POSTPONED bookings that have not yet been placed.
 */
export async function rollForwardPostponedBookingsForEvent(
  eventId: string,
  actorId?: string | null
) {
  return rollForwardGuaranteedBookings({
    eventId,
    actorId,
    // Only pick bookings that are genuinely stranded (POSTPONED, no rolloverTarget yet)
    sourceReason: 'Rolled forward after module not delivered in event window',
    deferredReason: 'Awaiting placement — no future event window open yet',
  })
}

/**
 * Phase 6 — Company / group-charter demand preservation.
 *
 * GROUP_CHARTER bookings represent contracted company demand. When the event they
 * belong to is cancelled or their module is not delivered, they must roll forward
 * into the next open/draft event under the same group identity, without repurchase.
 *
 * Returns counts of rolled vs deferred company bookings.
 */
export async function preserveCompanyGuaranteedDemand(
  eventId: string,
  actorId?: string | null
) {
  return prisma.$transaction(async (tx) => {
    const event = await tx.examEvent.findUnique({
      where: { id: eventId },
      select: { id: true, name: true, startDate: true },
    })
    if (!event) throw new Error('Event not found')

    const targetEvent = await tx.examEvent.findFirst({
      where: {
        id: { not: eventId },
        status: { in: ['OPEN', 'DRAFT'] },
        startDate: { gt: event.startDate },
      },
      orderBy: { startDate: 'asc' },
      select: { id: true, name: true },
    })

    const companyBookings = await tx.examBooking.findMany({
      where: {
        eventId,
        deletedAt: null,
        bookingType: { in: [...COMPANY_ROLL_FORWARDABLE_TYPES] },
        demandStatus: { notIn: ['EXECUTED', 'ROLLED_FORWARD', 'CANCELLED'] },
        rolloverToEventId: null,
      },
      select: {
        id: true,
        userId: true,
        examComponentId: true,
        moduleCode: true,
        bookingType: true,
        amountPaid: true,
        status: true,
        groupName: true,
        groupRepId: true,
        bookingGroupRef: true,
        courseId: true,
        examCategory: true,
        preferredSessionType: true,
        walletTxnId: true,
        isResit: true,
        executedAt: true,
      },
    })

    const eligible = companyBookings.filter(
      (b) => b.examComponentId && b.moduleCode && !b.executedAt
    )

    if (!targetEvent) {
      if (eligible.length > 0) {
        await tx.examBooking.updateMany({
          where: { id: { in: eligible.map((b) => b.id) } },
          data: {
            demandStatus: 'POSTPONED',
            cancellationReason: 'Company demand awaiting next event window',
          },
        })
      }
      return { targetEventId: null, rolledForwardCount: 0, deferredCount: eligible.length }
    }

    let rolledForwardCount = 0

    for (const booking of eligible) {
      // Double-consumption guard
      const alreadyCloned = await checkDoubleConsumptionGuard(tx, booking.id, targetEvent.id)
      if (alreadyCloned) {
        await tx.examBooking.update({
          where: { id: booking.id },
          data: {
            demandStatus: 'ROLLED_FORWARD',
            rolloverToEventId: targetEvent.id,
            status: 'CANCELLED',
            cancellationReason: 'Company demand rolled forward to next event',
            cancelledAt: new Date(),
            cancelledBy: actorId ?? null,
          },
        })
        continue
      }

      const resolvedPool = await resolveStandardPoolForJoin(tx, {
        eventId: targetEvent.id,
        moduleCode: booking.moduleCode!,
      })

      const placement = await joinPoolInternal(tx, {
        poolId: resolvedPool.id,
        userId: booking.userId,
        examComponentId: booking.examComponentId!,
        eventId: targetEvent.id,
        moduleCode: booking.moduleCode!,
        bookingType: 'GROUP_CHARTER',
        reserveAmount: 0,
        amountPaid: Number(booking.amountPaid || 0),
        isResit: booking.isResit,
      })

      if (!placement.success || !placement.booking) {
        throw new Error(placement.error || `Failed to roll forward company booking ${booking.id}`)
      }

      await tx.examBooking.update({
        where: { id: placement.booking.id },
        data: {
          rolloverFromBookingId: booking.id,
          groupName: booking.groupName,
          groupRepId: booking.groupRepId,
          bookingGroupRef: booking.bookingGroupRef,
          courseId: booking.courseId,
          examCategory: booking.examCategory,
          preferredSessionType: booking.preferredSessionType,
          walletTxnId: booking.walletTxnId,
          guaranteeType: 'COMPANY_GUARANTEED',
          guaranteedSeat: true,
          status: 'APPROVED',
        },
      })

      await tx.examBooking.update({
        where: { id: booking.id },
        data: {
          demandStatus: 'ROLLED_FORWARD',
          rolloverToEventId: targetEvent.id,
          status: 'CANCELLED',
          cancellationReason: 'Company demand rolled forward to next event',
          cancelledAt: new Date(),
          cancelledBy: actorId ?? null,
        },
      })

      await tx.poolMembership.updateMany({
        where: {
          bookingId: booking.id,
          status: { in: ['RESERVED', 'CONFIRMED', 'NO_SHOW'] },
        },
        data: { status: 'ROLLED' },
      })

      rolledForwardCount += 1
    }

    return {
      targetEventId: targetEvent.id,
      targetEventName: targetEvent.name,
      rolledForwardCount,
      deferredCount: 0,
    }
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  })
}
