import prisma from '@/lib/prisma/client'
import { Prisma } from '@prisma/client'
import {
  POOL_EXAM_FEE,
  POOL_MIN_CANDIDATES,
  POOL_NEAR_FULL_THRESHOLD,
  POOL_MAX_CANDIDATES,
  MODULE_DIVERSITY_CAP,
  MAX_TOTAL_STUDENT_POOLS,
} from './types'
import { confirmPoolInternal } from './confirm'
import type { PoolJoinInput, PoolJoinResult } from './types'

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

export async function joinPool(input: PoolJoinInput): Promise<PoolJoinResult> {
  const { poolId } = input
  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const [lockKey1, lockKey2] = getLockKeys(poolId)
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey1}, ${lockKey2})`
        return joinPoolInternal(tx, input)
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    )

    // After transaction completes, if NEAR_FULL was triggered, send emails
    if (result.success && result.triggeredNearFull) {
      const memberships = await prisma.poolMembership.findMany({
        where: { poolId, status: { in: ['RESERVED', 'CONFIRMED'] } },
        include: {
          user: { include: { profile: true } },
          pool: { select: { name: true, examDate: true } },
          examComponent: { include: { course: true } },
        },
      })

      const { sendPoolApproachingConfirmationEmail } = await import('@/lib/email/service')
      const { format } = await import('date-fns')

      for (const m of memberships) {
        const name = m.user.profile?.firstName || 'Student'
        const email = m.user.academyEmail || m.user.email
        const moduleLabel = m.examComponent?.course?.code || 'Module'
        const examDateStr = m.pool.examDate ? format(m.pool.examDate, 'dd MMM yyyy') : 'TBA'

        sendPoolApproachingConfirmationEmail(
          email,
          name,
          m.pool.name,
          examDateStr,
          moduleLabel
        ).catch((e) => {
          console.error('[EMAIL ERROR] Failed to send NEAR_FULL to', email, e)
        })
      }
    }

    return result
  } catch (err: any) {
    console.error('[POOL JOIN ERROR]', err)
    return { success: false, error: err.message || 'Failed to join pool' }
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

  // Lock pool row
  const [pool] = await tx.$queryRawUnsafe<any[]>(
    `SELECT * FROM "exam_pools" WHERE id = $1 FOR UPDATE`,
    poolId
  )
  if (!pool) return { success: false, error: 'Pool not found' }
  if (!['OPEN', 'NEAR_FULL'].includes(pool.status))
    return { success: false, error: 'Pool is not open' }
  if (pool.currentMemberCount >= POOL_MAX_CANDIDATES)
    return { success: false, error: 'Pool is full' }

  // RULE: One module per candidate per pool
  const existingInPool = await tx.poolMembership.findFirst({
    where: { poolId, userId, status: { in: ['RESERVED', 'CONFIRMED'] } },
  })
  if (existingInPool) {
    return {
      success: false,
      error: 'You already have a seat in this pool (one module per pool)',
    }
  }

  // RULE 001: Module diversity cap — max 4 DISTINCT modules per pool
  const distinctModules = await tx.poolMembership.findMany({
    where: { poolId, status: { in: ['RESERVED', 'CONFIRMED'] } },
    select: { examComponentId: true },
    distinct: ['examComponentId'],
  })
  const isNewModule = !distinctModules.some((m) => m.examComponentId === examComponentId)
  if (isNewModule && distinctModules.length >= MODULE_DIVERSITY_CAP) {
    return {
      success: false,
      error: `Pool already has ${MODULE_DIVERSITY_CAP} modules (maximum). Please choose from the existing modules in this pool.`,
    }
  }

  // RULE 005: Global student pool cap (max 4 total)
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

  // RULE 006: Unique module per event — cannot book same module twice in the same event
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

  // RULE 004: Datetime conflict detection
  if (pool.examStartTime && pool.examEndTime) {
    const conflictingMemberships = await tx.poolMembership.findMany({
      where: {
        userId,
        status: { in: ['RESERVED', 'CONFIRMED'] },
        pool: {
          id: { not: poolId },
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

  // Allow applicants (no student profile yet) if they are EXAM_ONLY
  if (!profile) {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { role: true, programmeChoice: true },
    })
    if (!user || (user.role !== 'APPLICANT' && user.role !== 'STUDENT')) {
      return { success: false, error: 'User not found or unauthorized' }
    }
    // Applicants with EXAM_ONLY programme choice can join pools
    if (user.role === 'APPLICANT' && user.programmeChoice !== 'EXAM_ONLY') {
      return { success: false, error: 'Please select the Exam Only pathway first' }
    }
    // If role is STUDENT without profile, allow through (edge case during promotion)
  }

  if (profile?.enrollmentType === 'FULL_TIME') {
    return {
      success: false,
      error: 'Full-Time students do not join exam pools individually.',
    }
  }

  let feeToReserve = 0
  let usedBundleId: string | null = null
  const { calculatePoolSeatPrice } = await import('./pricing')
  const priceCalc = await calculatePoolSeatPrice(userId, pool.eventId)
  feeToReserve = priceCalc.totalPrice

  // Check for available bundle seat before charging wallet
  const { getAvailableBundle, useBundleSeat } = await import('./bundles')
  const availableBundle = await getAvailableBundle(userId)
  if (availableBundle) {
    await useBundleSeat(tx, availableBundle.id)
    usedBundleId = availableBundle.id
    feeToReserve = 0 // Bundle covers the cost
  }

  const wallet = await tx.wallet.findUnique({ where: { userId } })
  if (!wallet) return { success: false, error: 'No wallet' }

  if (feeToReserve > 0) {
    const available = Number(wallet.balance) - Number(wallet.reservedBalance)
    if (available < feeToReserve) return { success: false, error: 'Insufficient balance' }

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { reservedBalance: { increment: feeToReserve } },
    })

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'RESERVE',
        amount: feeToReserve,
        description: `Reserved for pool: ${pool.name}`,
        referenceId: `POOL-${poolId.substring(0, 8)}`,
        referenceType: 'POOL_RESERVATION',
        balanceBefore: Number(wallet.balance) - Number(wallet.reservedBalance),
        balanceAfter: Number(wallet.balance) - Number(wallet.reservedBalance) - feeToReserve,
      },
    })
  }

  const membership = await tx.poolMembership.create({
    data: {
      poolId,
      userId,
      examComponentId,
      status: feeToReserve > 0 ? 'RESERVED' : 'CONFIRMED',
      amountReserved: feeToReserve,
      amountPaid: 0,
    },
  })

  const newCount = pool.currentMemberCount + 1
  const newStatus =
    newCount >= POOL_MIN_CANDIDATES
      ? 'CONFIRMED'
      : newCount >= POOL_NEAR_FULL_THRESHOLD
        ? 'NEAR_FULL'
        : pool.status

  const allowedModules = pool.allowedModules || []
  let newAllowedModules = [...allowedModules]
  if (input.moduleCode && !allowedModules.includes(input.moduleCode)) {
    newAllowedModules.push(input.moduleCode)
  }

  await tx.examPool.update({
    where: { id: poolId },
    data: {
      currentMemberCount: newCount,
      status: newStatus,
      allowedModules: newAllowedModules,
    },
  })

  let booking: any = null
  if (input.eventId && input.moduleCode) {
    booking = await tx.examBooking.create({
      data: {
        userId,
        examComponentId,
        eventId: input.eventId,
        bookingType: 'POOL',
        moduleCode: input.moduleCode,
        amountPaid: input.amountPaid || feeToReserve,
        status: feeToReserve > 0 ? 'PENDING' : 'APPROVED',
      },
    })
  }

  let autoConfirmed = false
  if (newCount >= POOL_MIN_CANDIDATES && pool.status !== 'CONFIRMED') {
    await confirmPoolInternal(poolId, tx)
    autoConfirmed = true
  }

  const triggeredNearFull = newStatus === 'NEAR_FULL' && pool.status !== 'NEAR_FULL'
  return { success: true, membership, booking, autoConfirmed, triggeredNearFull }
}
