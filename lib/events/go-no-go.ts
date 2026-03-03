/**
 * Go/No-Go Evaluation — RULE 009+010
 *
 * Three conditions evaluated at T-21 (payment deadline):
 * 1. ALL pools must meet minCandidates threshold (25)
 * 2. Total confirmed revenue ≥ event.minRevenueTarget
 * 3. No regulatory/external blockers (manual flag)
 *
 * Outcomes:
 * - GO: Event proceeds, all CONFIRMED pools are locked
 * - NO_GO: Event cancelled, all pools failed, funds released
 * - POSTPONE: Event rescheduled, pool memberships auto-rolled
 */

import prisma from '@/lib/prisma/client'
import { Prisma } from '@prisma/client'
import { failPool, confirmPoolInternal } from '@/lib/pools/confirm'
import { sendEmail } from '@/lib/email'
import { sendEventGoEmail, sendEventNoGoEmail, sendEventPostponedEmail } from '@/lib/email/service'

export interface GoNoGoEvaluation {
  eventId: string
  eventName: string
  decision: 'GO' | 'NO_GO' | 'NEEDS_REVIEW'
  reasons: string[]
  metrics: {
    totalPools: number
    poolsMeetingThreshold: number
    poolsBelowThreshold: number
    totalConfirmedRevenue: number
    revenueTarget: number
    revenueMetPercent: number
    totalCandidates: number
  }
  pools: Array<{
    id: string
    name: string
    status: string
    memberCount: number
    minRequired: number
    meetsThreshold: boolean
  }>
}

/**
 * Evaluate Go/No-Go for an event without executing it.
 */
export async function evaluateGoNoGo(eventId: string): Promise<GoNoGoEvaluation> {
  const event = await prisma.examEvent.findUnique({
    where: { id: eventId },
    include: {
      pools: {
        include: {
          memberships: { where: { status: { in: ['RESERVED', 'CONFIRMED'] } } },
        },
      },
    },
  })

  if (!event) throw new Error('Event not found')

  const reasons: string[] = []
  let decision: 'GO' | 'NO_GO' | 'NEEDS_REVIEW' = 'GO'

  // Evaluate each pool
  const poolEvals = event.pools.map((pool) => {
    const meetsThreshold = pool.currentMemberCount >= pool.minCandidates
    return {
      id: pool.id,
      name: pool.name,
      status: pool.status,
      memberCount: pool.currentMemberCount,
      minRequired: pool.minCandidates,
      meetsThreshold,
    }
  })

  // Condition 1: Pool threshold check
  const poolsBelowThreshold = poolEvals.filter((p) => !p.meetsThreshold)
  if (poolsBelowThreshold.length > 0) {
    decision = 'NEEDS_REVIEW'
    reasons.push(
      `${poolsBelowThreshold.length} pool(s) below minimum: ${poolsBelowThreshold
        .map((p) => `${p.name} (${p.memberCount}/${p.minRequired})`)
        .join(', ')}`
    )
  }

  // Condition 2: Revenue check
  const totalRevenue = event.pools.reduce((sum, pool) => {
    return (
      sum +
      pool.memberships.reduce((mSum, m) => {
        return mSum + Number(m.amountReserved || 0) + Number(m.amountPaid || 0)
      }, 0)
    )
  }, 0)

  const revenueTarget = Number(event.minRevenueTarget)
  if (totalRevenue < revenueTarget) {
    decision = 'NEEDS_REVIEW'
    reasons.push(
      `Revenue €${totalRevenue.toFixed(0)} below target €${revenueTarget.toFixed(0)} (${Math.round(
        (totalRevenue / revenueTarget) * 100
      )}%)`
    )
  }

  // If all conditions met
  if (reasons.length === 0) {
    reasons.push('All pools meet threshold and revenue target reached')
  }

  // If ALL pools are below threshold → auto NO_GO
  if (poolsBelowThreshold.length === event.pools.length && event.pools.length > 0) {
    decision = 'NO_GO'
  }

  const totalCandidates = poolEvals.reduce((sum, p) => sum + p.memberCount, 0)

  // Apply Manual Overrides
  if (event.overrideStatus === 'FORCE_GO') {
    decision = 'GO'
    reasons.unshift('<strong>ADMIN OVERRIDE: FORCE GO</strong>')
  } else if (event.overrideStatus === 'FORCE_NO_GO') {
    decision = 'NO_GO'
    reasons.unshift('<strong>ADMIN OVERRIDE: FORCE NO-GO</strong>')
  }

  return {
    eventId: event.id,
    eventName: event.name,
    decision,
    reasons,
    metrics: {
      totalPools: event.pools.length,
      poolsMeetingThreshold: poolEvals.filter((p) => p.meetsThreshold).length,
      poolsBelowThreshold: poolsBelowThreshold.length,
      totalConfirmedRevenue: totalRevenue,
      revenueTarget,
      revenueMetPercent: revenueTarget > 0 ? Math.round((totalRevenue / revenueTarget) * 100) : 100,
      totalCandidates,
    },
    pools: poolEvals,
  }
}

/**
 * Execute a Go decision — confirm all pools, lock event.
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

    // Confirm all OPEN/NEAR_FULL pools first (capture funds from RESERVED members)
    const unconfirmedPools = await tx.examPool.findMany({
      where: { eventId, status: { in: ['OPEN', 'NEAR_FULL'] } },
    })
    for (const pool of unconfirmedPools) {
      await confirmPoolInternal(pool.id, tx)
    }

    // Lock all confirmed pools (including those just confirmed above)
    await tx.examPool.updateMany({
      where: { eventId, status: 'CONFIRMED' },
      data: { status: 'LOCKED' },
    })

    return { success: true, message: 'Event confirmed — all pools locked' }
  })

  // Outside transaction: email unique participants
  if (result.success) {
    const notified = new Set<string>()
    for (const pool of event.pools) {
      if (pool.status === 'CONFIRMED' || pool.status === 'LOCKED') {
        for (const m of pool.memberships) {
          if ((m.status === 'RESERVED' || m.status === 'CONFIRMED') && !notified.has(m.userId)) {
            notified.add(m.userId)
            const email = m.user.academyEmail || m.user.email
            const name = m.user.profile?.firstName || 'Student'
            sendEventGoEmail(email, name, event.name).catch((e) =>
              console.error('[EMAIL ERROR]', e)
            )
          }
        }
      }
    }
  }

  return result
}

/**
 * Execute a No-Go decision — fail all non-confirmed pools, cancel event.
 */
export async function executeNoGo(eventId: string, adminId: string) {
  const event = await prisma.examEvent.findUnique({
    where: { id: eventId },
    include: {
      pools: { include: { memberships: { include: { user: { include: { profile: true } } } } } },
    },
  })
  if (!event) throw new Error('Event not found')

  // Fail all non-completed pools (releasing funds)
  for (const pool of event.pools) {
    if (!['COMPLETED', 'FAILED', 'CANCELLED'].includes(pool.status)) {
      await failPool(pool.id)
    }
  }

  await prisma.examEvent.update({
    where: { id: eventId },
    data: { status: 'CANCELLED' },
  })

  // Notify unique participants
  const notified = new Set<string>()
  for (const pool of event.pools) {
    for (const m of pool.memberships) {
      if (!notified.has(m.userId)) {
        notified.add(m.userId)
        const email = m.user.academyEmail || m.user.email
        const name = m.user.profile?.firstName || 'Student'
        sendEventNoGoEmail(email, name, event.name).catch((e) => console.error('[EMAIL ERROR]', e))
      }
    }
  }

  return { success: true, message: 'Event cancelled — all candidate funds released' }
}

/**
 * Execute a postponement — reschedule event, auto-roll pool memberships.
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
    // Update event dates and status
    const newPaymentDeadline = new Date(newStartDate)
    newPaymentDeadline.setDate(newPaymentDeadline.getDate() - 21) // T-21

    await tx.examEvent.update({
      where: { id: eventId },
      data: {
        startDate: newStartDate,
        endDate: newEndDate,
        paymentDeadline: newPaymentDeadline,
        status: 'POSTPONED',
      },
    })

    // Auto-roll pool dates
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

    // Notify affected candidates
    const uniqueUserIds = new Set<string>()
    for (const pool of event.pools) {
      for (const m of pool.memberships) {
        if (['RESERVED', 'CONFIRMED'].includes(m.status)) {
          uniqueUserIds.add(m.userId)
        }
      }
    }

    // Send emails non-blocking
    for (const uid of uniqueUserIds) {
      const user = await tx.user.findUnique({
        where: { id: uid },
        select: { email: true, academyEmail: true, profile: { select: { firstName: true } } },
      })
      if (user) {
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
          (e) => {
            console.error('[EMAIL ERROR] Failed to send POSTPONED to', email, e)
          }
        )
      }
    }

    return {
      success: true,
      message: `Event postponed to ${newStartDate.toLocaleDateString()}. ${uniqueUserIds.size} candidates notified.`,
      affectedCandidates: uniqueUserIds.size,
    }
  })
}

/**
 * Merge two pools into one (when one pool is below threshold).
 */
export async function mergePools(sourcePoolId: string, targetPoolId: string, adminId: string) {
  return prisma.$transaction(
    async (tx) => {
      const source = await tx.examPool.findUnique({
        where: { id: sourcePoolId },
        include: { memberships: { where: { status: { in: ['RESERVED', 'CONFIRMED'] } } } },
      })
      const target = await tx.examPool.findUnique({
        where: { id: targetPoolId },
      })

      if (!source || !target) throw new Error('Pool not found')

      // Check capacity
      const combinedCount = (target.currentMemberCount || 0) + source.memberships.length
      if (combinedCount > target.maxCandidates) {
        throw new Error(
          `Combined count (${combinedCount}) exceeds target max (${target.maxCandidates})`
        )
      }

      // Check for duplicate users between source and target pools
      const targetMembers = await tx.poolMembership.findMany({
        where: { poolId: targetPoolId, status: { in: ['RESERVED', 'CONFIRMED'] } },
        select: { userId: true },
      })
      const targetUserIds = new Set(targetMembers.map(m => m.userId))
      const duplicates = source.memberships.filter(m => targetUserIds.has(m.userId))
      if (duplicates.length > 0) {
        throw new Error(
          `Cannot merge: ${duplicates.length} user(s) already exist in the target pool`
        )
      }

      // Move memberships
      for (const m of source.memberships) {
        await tx.poolMembership.update({
          where: { id: m.id },
          data: { poolId: targetPoolId },
        })
      }

      // Update counts
      await tx.examPool.update({
        where: { id: targetPoolId },
        data: { currentMemberCount: combinedCount },
      })

      // Mark source as merged
      await tx.examPool.update({
        where: { id: sourcePoolId },
        data: { status: 'MERGED', currentMemberCount: 0 },
      })

      // Auto-confirm if combined count meets threshold
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
