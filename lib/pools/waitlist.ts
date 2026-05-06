import prisma from '@/lib/prisma/client'
import { joinPoolInternal } from './join'
import { ACTIVE_MEMBERSHIP_STATUSES } from '@/lib/utils/constants'

export async function joinWaitlist(poolId: string, userId: string, examComponentId: string) {
  // 1. Check if already on waitlist
  const existing = await prisma.poolWaitlist.findUnique({
    where: {
      poolId_userId_examComponentId: {
        poolId,
        userId,
        examComponentId,
      },
    },
  })
  if (existing && existing.status === 'PENDING') {
    return { success: false, error: 'You are already on the waitlist for this pool.' }
  }

  // 2. Check if already a member
  const inPool = await prisma.poolMembership.findFirst({
    where: { poolId, userId, status: { in: ACTIVE_MEMBERSHIP_STATUSES } },
  })
  if (inPool) {
    return { success: false, error: 'You are already a member of this pool.' }
  }

  // 3. Get next priority
  const lastEntry = await prisma.poolWaitlist.findFirst({
    where: { poolId },
    orderBy: { priority: 'desc' },
  })
  const priority = (lastEntry?.priority ?? 0) + 1

  const entry = await prisma.poolWaitlist.create({
    data: {
      poolId,
      userId,
      examComponentId,
      priority,
      status: 'PENDING',
    },
  })

  return { success: true, entry }
}

/**
 * Attempts to promote the next person on the waitlist into the pool.
 * Must be called within a transaction that has already locked the pool row.
 */
export async function promoteNextFromWaitlist(poolId: string, tx: any): Promise<any> {
  const next = await tx.poolWaitlist.findFirst({
    where: { poolId, status: 'PENDING' },
    orderBy: { priority: 'asc' },
  })

  if (!next) return null

  const examComponent = await tx.examComponent.findUnique({
    where: { id: next.examComponentId },
    select: { course: { select: { code: true } } },
  })

  // Attempt to join the pool using the internal function
  const result = await joinPoolInternal(tx, {
    poolId,
    userId: next.userId,
    examComponentId: next.examComponentId,
    moduleCode: examComponent?.course?.code,
  })

  if (result.success) {
    // Mark waitlist entry as PROMOTED
    await tx.poolWaitlist.update({
      where: { id: next.id },
      data: { status: 'PROMOTED' },
    })
    return { candidate: next, result }
  } else {
    // If promotion fails (e.g. no funds), mark entry as CANCELLED and try next
    await tx.poolWaitlist.update({
      where: { id: next.id },
      data: { status: 'CANCELLED' },
    })
    // Recursive call to try the next person
    return promoteNextFromWaitlist(poolId, tx)
  }
}
