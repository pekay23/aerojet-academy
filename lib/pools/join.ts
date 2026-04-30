import prisma from '@/lib/prisma/client'
import { BookingType, Prisma, MembershipStatus, PoolStatus } from '@prisma/client'
import {
  POOL_MIN_CANDIDATES,
  POOL_NEAR_FULL_THRESHOLD,
  POOL_MAX_CANDIDATES,
  MAX_TOTAL_STUDENT_POOLS,
} from './types'
import { confirmPoolInternal } from './confirm'
import type { PoolJoinInput, PoolJoinResult } from './types'
import { resolveStandardPoolForJoin } from './assignment'
import { reserveFunds } from '@/lib/wallet/operations'

// Simple string hash to generate two 32-bit integers for PG advisory locks
function getLockKeys(str: string): [number, number] {
  let h1 = 5381
  let h2 = 52711
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    h1 = ((h1 << 5) + h1) ^ char
    h2 = ((h2 << 5) + h2) ^ char
  }
  return [h1 & 0x7fffffff, h2 & 0x7fffffff]
}

function resolveGuaranteeType(bookingType: BookingType) {
  if (bookingType === 'POOL') return 'POOL_FLEX' as const
  if (bookingType === 'GROUP_CHARTER') return 'COMPANY_GUARANTEED' as const
  if (bookingType === 'TWIN_PACK' || bookingType === 'FOUR_PACK') return 'BUNDLE_GUARANTEED' as const
  return 'INDIVIDUAL_GUARANTEED' as const
}

export async function joinPool(input: PoolJoinInput): Promise<PoolJoinResult> {
  try {
    const lockScope =
      input.eventId ||
      (
        await prisma.examPool.findUnique({
          where: { id: input.poolId },
          select: { eventId: true },
        })
      )?.eventId ||
      input.poolId

    const result = await prisma.$transaction(
      async (tx) => {
        const [lockKey1, lockKey2] = getLockKeys(lockScope)
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey1}, ${lockKey2})`
        return joinPoolInternal(tx, input)
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    )

    if (result.success && result.triggeredNearFull && result.pool?.id) {
      const memberships = await prisma.poolMembership.findMany({
        where: { poolId: result.pool.id, status: { in: ['RESERVED', 'CONFIRMED'] } },
        include: {
          user: { include: { profile: true } },
          pool: { select: { name: true, examDate: true } },
          examComponent: { include: { course: true } },
        },
      })

      const { sendPoolApproachingConfirmationEmail } = await import('@/lib/email/service')
      const { format } = await import('date-fns')

      for (const membership of memberships) {
        const name = membership.user.profile?.firstName || 'Student'
        const email = membership.user.academyEmail || membership.user.email
        const moduleLabel = membership.examComponent?.course?.code || 'Module'
        const examDateStr = membership.pool.examDate
          ? format(membership.pool.examDate, 'dd MMM yyyy')
          : 'TBA'

        sendPoolApproachingConfirmationEmail(
          email,
          name,
          membership.pool.name,
          examDateStr,
          moduleLabel
        ).catch((error) => {
          console.error('[EMAIL ERROR] Failed to send NEAR_FULL to', email, error)
        })
      }
    }

    return result
  } catch (err: any) {
    console.error('[POOL JOIN ERROR]', err)
    return { success: false, error: err.message || 'Failed to join booking' }
  }
}

/**
 * Internal join logic that can be reused within an existing transaction.
 */
export async function joinPoolInternal(
  tx: Prisma.TransactionClient,
  input: PoolJoinInput
): Promise<PoolJoinResult & { triggeredNearFull?: boolean }> {
  const { poolId, userId, examComponentId } = input
  const bookingType = input.bookingType || 'POOL'
  const guaranteeType = resolveGuaranteeType(bookingType)
  const guaranteedSeat = guaranteeType !== 'POOL_FLEX'

  const sourcePool = await tx.examPool.findUnique({
    where: { id: poolId },
    select: {
      id: true,
      eventId: true,
      poolType: true,
    },
  })
  if (!sourcePool) return { success: false, error: 'Pool not found' }
  if (sourcePool.poolType === 'AUTO') {
    return { success: false, error: 'Cannot join auto pools directly. Please book an exam instead.' }
  }
  if (sourcePool.poolType === 'GROUP_CHARTER') {
    return { success: false, error: 'Group charter pools require a group booking representative.' }
  }
  if (!sourcePool.eventId) {
    return { success: false, error: 'Pool is not attached to an exam event.' }
  }
  if (!input.moduleCode) {
    return { success: false, error: 'Module code is required for pool assignment.' }
  }

  const resolvedPool = await resolveStandardPoolForJoin(tx, {
    eventId: sourcePool.eventId,
    moduleCode: input.moduleCode,
    preferredPoolId: poolId,
  })
  const eventIdForBooking = input.eventId || sourcePool.eventId

  const [pool] = await tx.$queryRawUnsafe<any[]>(
    `SELECT * FROM "exam_pools" WHERE id = $1 FOR UPDATE`,
    resolvedPool.id
  )
  if (!pool) return { success: false, error: 'Pool not found' }
  if (!['OPEN', 'NEAR_FULL', 'DRAFT', 'CONFIRMED'].includes(pool.status)) {
    return { success: false, error: 'Pool is not open' }
  }
  if (pool.currentMemberCount >= POOL_MAX_CANDIDATES) {
    return { success: false, error: 'Pool is full' }
  }

  const existingInPool = await tx.poolMembership.findFirst({
    where: { poolId: pool.id, userId, status: { in: ['RESERVED', 'CONFIRMED'] } },
  })
  if (existingInPool) {
    return {
      success: false,
      error: 'You already have a seat in this booking (one module per booking)',
    }
  }

  const totalMyPools = await tx.poolMembership.count({
    where: {
      userId,
      status: { in: ['RESERVED', 'CONFIRMED'] },
    },
  })
  if (totalMyPools >= MAX_TOTAL_STUDENT_POOLS) {
    return {
      success: false,
      error: `You have reached the maximum of ${MAX_TOTAL_STUDENT_POOLS} pool bookings.`,
    }
  }

  if (pool.eventId && examComponentId) {
    const component = await tx.examComponent.findUnique({
      where: { id: examComponentId },
      select: { courseId: true },
    })

    const duplicateInEvent = await tx.poolMembership.findFirst({
      where: {
        userId,
        status: { in: ['RESERVED', 'CONFIRMED'] },
        pool: { eventId: pool.eventId },
        examComponent: { courseId: component?.courseId },
      },
    })

    if (duplicateInEvent) {
      return {
        success: false,
        error:
          'You are already registered for this module in another pool within the same exam event.',
      }
    }
  }

  if (pool.examStartTime && pool.examEndTime) {
    const conflictingMemberships = await tx.poolMembership.findMany({
      where: {
        userId,
        status: { in: ['RESERVED', 'CONFIRMED'] },
        pool: {
          id: { not: pool.id },
          examDate: pool.examDate,
          examStartTime: { lt: pool.examEndTime },
          examEndTime: { gt: pool.examStartTime },
        },
      },
      include: { pool: { select: { name: true, examStartTime: true, examEndTime: true } } },
    })
    if (conflictingMemberships.length > 0) {
      const conflictName = conflictingMemberships[0].pool.name
      return {
        success: false,
        error: `Time conflict: Already in "${conflictName}"`,
      }
    }
  }

  const profile = await tx.studentProfile.findUnique({
    where: { userId },
    include: { user: true },
  })

  if (!profile) {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { role: true, programmeChoice: true },
    })
    if (!user || (user.role !== 'APPLICANT' && user.role !== 'STUDENT')) {
      return { success: false, error: 'User not found or unauthorized' }
    }
    if (user.role === 'APPLICANT' && user.programmeChoice !== 'EXAM_ONLY') {
      return { success: false, error: 'Please select the Exam Only pathway first' }
    }
  }

  if (profile?.enrollmentType === 'FULL_TIME') {
    return {
      success: false,
      error: 'Full-Time students do not join exam bookings individually.',
    }
  }

  // If the pool is already CONFIRMED (candidates 26-28), capture funds immediately
  const isJoiningConfirmedPool = pool.status === 'CONFIRMED'

  let feeToReserve = typeof input.reserveAmount === 'number' ? input.reserveAmount : 0
  if (typeof input.reserveAmount !== 'number') {
    const { calculatePoolSeatPrice } = await import('./pricing')
    const priceCalc = await calculatePoolSeatPrice(userId, pool.eventId)
    feeToReserve = priceCalc.totalPrice
  }

  if (input.bundleId) {
    const { useBundleSeat } = await import('./bundles')
    await useBundleSeat(tx, input.bundleId)
    feeToReserve = 0
  }

  // For non-confirmed pools: reserve funds (held until pool confirms)
  // For confirmed pools: skip reservation — we capture directly after membership creation
  if (feeToReserve > 0 && !isJoiningConfirmedPool) {
    await reserveFunds(
      tx,
      userId,
      feeToReserve,
      `Reserved for pool: ${pool.name}`,
      `POOL-${pool.id.substring(0, 8)}`,
      'POOL_RESERVATION'
    )
  }

  let booking: any = null
  if (eventIdForBooking && input.moduleCode) {
    booking = await tx.examBooking.create({
      data: {
        userId,
        examComponentId,
        eventId: eventIdForBooking,
        bookingType,
        moduleCode: input.moduleCode,
        amountPaid: input.amountPaid ?? feeToReserve,
        guaranteeType,
        demandStatus: 'POOLED',
        guaranteedSeat,
        status: isJoiningConfirmedPool ? 'APPROVED' : (feeToReserve > 0 ? 'PENDING' : 'APPROVED'),
        examDate: pool.examDate,
        isResit: input.isResit ?? bookingType === 'RESIT',
      },
    })
  }

  let membershipStatus: MembershipStatus
  let membershipAmountPaid: number

  if (isJoiningConfirmedPool && feeToReserve > 0) {
    // Pool is already confirmed — capture funds right away
    const { captureFunds } = await import('@/lib/wallet/operations')
    await captureFunds(
      tx,
      userId,
      feeToReserve,
      `Exam fee captured: ${pool.name}`,
      booking?.id || pool.id,
      booking?.id ? 'EXAM_BOOKING' : 'POOL_CAPTURE'
    )
    membershipStatus = 'CONFIRMED'
    membershipAmountPaid = feeToReserve
  } else {
    membershipStatus = feeToReserve > 0 ? 'RESERVED' : 'CONFIRMED'
    membershipAmountPaid = feeToReserve > 0 ? 0 : input.amountPaid ?? 0
  }

  const membership = await tx.poolMembership.create({
    data: {
      poolId: pool.id,
      userId,
      examComponentId,
      bookingId: booking?.id || null,
      status: membershipStatus,
      amountReserved: isJoiningConfirmedPool ? 0 : feeToReserve,
      amountPaid: membershipAmountPaid,
      ...(isJoiningConfirmedPool ? { confirmedAt: new Date(), paidAt: new Date() } : {}),
    },
  })

  const newCount = pool.currentMemberCount + 1

  // Determine new pool status:
  // - Already CONFIRMED and now at max → LOCKED
  // - Reaching POOL_MIN_CANDIDATES → CONFIRMED (auto-confirm trigger)
  // - Approaching threshold → NEAR_FULL
  // - Otherwise keep current status
  let newStatus: PoolStatus
  if (isJoiningConfirmedPool && newCount >= POOL_MAX_CANDIDATES) {
    newStatus = 'LOCKED'
  } else if (isJoiningConfirmedPool) {
    newStatus = 'CONFIRMED' // keep it confirmed
  } else if (newCount >= POOL_MIN_CANDIDATES) {
    newStatus = 'CONFIRMED'
  } else if (newCount >= POOL_NEAR_FULL_THRESHOLD) {
    newStatus = 'NEAR_FULL'
  } else {
    newStatus = pool.status
  }

  const allowedModules = pool.allowedModules || []
  const newAllowedModules = input.moduleCode && !allowedModules.includes(input.moduleCode)
    ? [...allowedModules, input.moduleCode]
    : allowedModules

  await tx.examPool.update({
    where: { id: pool.id },
    data: {
      currentMemberCount: newCount,
      status: newStatus,
      allowedModules: newAllowedModules,
      totalDemandSeats: { increment: 1 },
      ...(guaranteedSeat ? { guaranteedSeats: { increment: 1 } } : {}),
    },
  })

  let autoConfirmed = false
  if (newCount >= POOL_MIN_CANDIDATES && pool.status !== 'CONFIRMED') {
    await confirmPoolInternal(pool.id, tx)
    autoConfirmed = true
  }

  const triggeredNearFull = newStatus === 'NEAR_FULL' && pool.status !== 'NEAR_FULL'
  return {
    success: true,
    membership,
    booking,
    pool: { id: pool.id, name: pool.name, status: newStatus, currentMemberCount: newCount },
    autoConfirmed,
    triggeredNearFull,
  }
}
