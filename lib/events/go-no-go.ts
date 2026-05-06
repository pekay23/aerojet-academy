import prisma from '@/lib/prisma/client'
import { Prisma } from '@prisma/client'
import { confirmPoolInternal, failPool } from '@/lib/pools/confirm'
import { sendEventGoEmail, sendEventNoGoEmail, sendEventPostponedEmail } from '@/lib/email/service'
import { evaluateEventViability, type EventViabilityEvaluation } from '@/lib/exams/viability'
import { rollForwardGuaranteedBookingsFromCancelledEvent } from '@/lib/exams/rollforward'
import { ACTIVE_MEMBERSHIP_STATUSES } from '@/lib/utils/constants'

export type GoNoGoEvaluation = EventViabilityEvaluation

/**
 * Evaluate event viability without executing status transitions.
 */
export async function evaluateGoNoGo(
  eventId: string,
  options?: { unfiltered?: boolean }
): Promise<GoNoGoEvaluation> {
  return evaluateEventViability(eventId, options)
}

/**
 * Execute a Go decision.
 * Only pools that meet their own threshold are confirmed; underfilled pools can remain open
 * when the event is viable overall.
 */
export async function executeGo(eventId: string, adminId: string) {
  const event = await prisma.examEvent.findUnique({
    where: { id: eventId },
    include: {
      pools: { include: { memberships: { include: { user: { include: { profile: true } } } } } },
    },
  })
  if (!event) throw new Error('Event not found')

  const result = await prisma.$transaction(async (tx) => {
    await tx.examEvent.update({
      where: { id: eventId },
      data: { status: 'CONFIRMED' },
    })

    // Fetch candidate pools then filter by each pool's own minCandidates threshold
    const candidatePools = await tx.examPool.findMany({
      where: {
        eventId,
        status: { in: ['OPEN', 'NEAR_FULL'] },
      },
      select: { id: true, minCandidates: true, currentMemberCount: true },
    })
    const confirmablePools = candidatePools.filter(
      (p) => p.currentMemberCount >= (p.minCandidates ?? 25)
    )

    for (const pool of confirmablePools) {
      await confirmPoolInternal(pool.id, tx)
    }

    await tx.examPool.updateMany({
      where: { eventId, status: 'CONFIRMED' },
      data: { status: 'LOCKED' },
    })

    return {
      success: true,
      message:
        confirmablePools.length > 0
          ? 'Event confirmed and viable pools locked.'
          : 'Event confirmed with underfilled pools still awaiting manual handling.',
    }
  })

  if (result.success) {
    const notified = new Set<string>()
    for (const pool of event.pools) {
      for (const membership of pool.memberships) {
        if (
          (membership.status === 'RESERVED' || membership.status === 'CONFIRMED') &&
          !notified.has(membership.userId)
        ) {
          notified.add(membership.userId)
          const email = membership.user.academyEmail || membership.user.email
          const name = membership.user.profile?.firstName || 'Student'
          sendEventGoEmail(email, name, event.name).catch((error) =>
            console.error('[EMAIL ERROR]', error)
          )
        }
      }
    }
  }

  return result
}

/**
 * Execute a No-Go decision by failing remaining active pools and cancelling the event.
 */
export async function executeNoGo(eventId: string, adminId: string) {
  const event = await prisma.examEvent.findUnique({
    where: { id: eventId },
    include: {
      pools: { include: { memberships: { include: { user: { include: { profile: true } } } } } },
    },
  })
  if (!event) throw new Error('Event not found')

  for (const pool of event.pools) {
    if (!['COMPLETED', 'FAILED', 'CANCELLED'].includes(pool.status)) {
      await failPool(pool.id)
    }
  }

  await prisma.examEvent.update({
    where: { id: eventId },
    data: { status: 'CANCELLED' },
  })

  const rollForwardResult = await rollForwardGuaranteedBookingsFromCancelledEvent(eventId, adminId)

  const notified = new Set<string>()
  for (const pool of event.pools) {
    for (const membership of pool.memberships) {
      if (!notified.has(membership.userId)) {
        notified.add(membership.userId)
        const email = membership.user.academyEmail || membership.user.email
        const name = membership.user.profile?.firstName || 'Student'
        sendEventNoGoEmail(email, name, event.name).catch((error) =>
          console.error('[EMAIL ERROR]', error)
        )
      }
    }
  }

  return {
    success: true,
    message:
      rollForwardResult.rolledForwardCount > 0
        ? `Event cancelled, active candidate funds released where applicable, and ${rollForwardResult.rolledForwardCount} guaranteed booking(s) rolled into ${rollForwardResult.targetEventName || 'the next event'}.`
        : rollForwardResult.deferredCount > 0
          ? `Event cancelled. ${rollForwardResult.deferredCount} guaranteed booking(s) are awaiting a future event window.`
          : 'Event cancelled and active candidate funds released.',
  }
}

/**
 * Execute a postponement by moving event and pool dates together.
 */
export async function executePostponement(
  eventId: string,
  newStartDate: Date,
  newEndDate: Date,
  adminId: string
) {
  const event = await prisma.examEvent.findUnique({
    where: { id: eventId },
    include: { pools: { include: { memberships: true } } },
  })
  if (!event) throw new Error('Event not found')

  return prisma.$transaction(async (tx) => {
    const newPaymentDeadline = new Date(newStartDate)
    newPaymentDeadline.setDate(newPaymentDeadline.getDate() - 21)

    await tx.examEvent.update({
      where: { id: eventId },
      data: {
        startDate: newStartDate,
        endDate: newEndDate,
        paymentDeadline: newPaymentDeadline,
        status: 'POSTPONED',
      },
    })

    await tx.examBooking.updateMany({
      where: {
        eventId,
        deletedAt: null,
        demandStatus: { notIn: ['EXECUTED', 'ROLLED_FORWARD', 'CANCELLED'] },
      },
      data: {
        demandStatus: 'POSTPONED',
        examDate: newStartDate,
      },
    })

    const daysDiff = Math.round(
      (newStartDate.getTime() - event.startDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    for (const pool of event.pools) {
      if (['FAILED', 'CANCELLED', 'COMPLETED'].includes(pool.status)) continue

      const newExamDate = new Date(pool.examDate.getTime() + daysDiff * 24 * 60 * 60 * 1000)
      const newStart = new Date(pool.examStartTime.getTime() + daysDiff * 24 * 60 * 60 * 1000)
      const newEnd = new Date(pool.examEndTime.getTime() + daysDiff * 24 * 60 * 60 * 1000)

      await tx.examPool.update({
        where: { id: pool.id },
        data: {
          examDate: newExamDate,
          examStartTime: newStart,
          examEndTime: newEnd,
          status: pool.status === 'LOCKED' ? 'CONFIRMED' : pool.status,
        },
      })
    }

    const uniqueUserIds = new Set<string>()
    for (const pool of event.pools) {
      for (const membership of pool.memberships) {
        if (ACTIVE_MEMBERSHIP_STATUSES.includes(membership.status)) {
          uniqueUserIds.add(membership.userId)
        }
      }
    }

    for (const userId of uniqueUserIds) {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { email: true, academyEmail: true, profile: { select: { firstName: true } } },
      })
      if (!user) continue

      const name = user.profile?.firstName || 'Student'
      const email = user.academyEmail || user.email
      const newStartDateStr = newStartDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      const newEndDateStr = newEndDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })

      sendEventPostponedEmail(email, name, event.name, newStartDateStr, newEndDateStr).catch(
        (error) => {
          console.error('[EMAIL ERROR] Failed to send POSTPONED to', email, error)
        }
      )
    }

    return {
      success: true,
      message: `Event postponed to ${newStartDate.toLocaleDateString()}. ${uniqueUserIds.size} candidates notified.`,
      affectedCandidates: uniqueUserIds.size,
    }
  })
}

/**
 * Merge one pool into another.
 */
export async function mergePools(sourcePoolId: string, targetPoolId: string, adminId: string) {
  return prisma.$transaction(
    async (tx) => {
      const source = await tx.examPool.findUnique({
        where: { id: sourcePoolId },
        include: { memberships: { where: { status: { in: ACTIVE_MEMBERSHIP_STATUSES } } } },
      })
      const target = await tx.examPool.findUnique({
        where: { id: targetPoolId },
      })

      if (!source || !target) throw new Error('Pool not found')

      const combinedCount = (target.currentMemberCount || 0) + source.memberships.length
      if (combinedCount > target.maxCandidates) {
        throw new Error(
          `Combined count (${combinedCount}) exceeds target max (${target.maxCandidates})`
        )
      }

      const targetMembers = await tx.poolMembership.findMany({
        where: { poolId: targetPoolId, status: { in: ACTIVE_MEMBERSHIP_STATUSES } },
        select: { userId: true },
      })
      const targetUserIds = new Set(targetMembers.map((member) => member.userId))
      const duplicates = source.memberships.filter((member) => targetUserIds.has(member.userId))
      if (duplicates.length > 0) {
        throw new Error(
          `Cannot merge: ${duplicates.length} user(s) already exist in the target pool`
        )
      }

      for (const membership of source.memberships) {
        await tx.poolMembership.update({
          where: { id: membership.id },
          data: { poolId: targetPoolId },
        })
      }

      await tx.examPool.update({
        where: { id: targetPoolId },
        data: { currentMemberCount: combinedCount },
      })

      await tx.examPool.update({
        where: { id: sourcePoolId },
        data: { status: 'MERGED', currentMemberCount: 0 },
      })

      if (combinedCount >= 25 && target.status !== 'CONFIRMED') {
        await confirmPoolInternal(targetPoolId, tx)
      }

      return {
        success: true,
        message: `Merged ${source.memberships.length} members from "${source.name}" into "${target.name}"`,
        movedMembers: source.memberships.length,
      }
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  )
}
