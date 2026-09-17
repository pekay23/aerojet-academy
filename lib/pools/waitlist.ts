import prisma from '@/lib/prisma/client'
import { Prisma } from '@prisma/client'
import { joinPoolInternal } from './join'
import { ACTIVE_MEMBERSHIP_STATUSES } from '@/lib/utils/constants'

export async function joinWaitlist(poolId: string, userId: string, examComponentId: string) {
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

  const inPool = await prisma.poolMembership.findFirst({
    where: { poolId, userId, status: { in: ACTIVE_MEMBERSHIP_STATUSES } },
  })
  if (inPool) {
    return { success: false, error: 'You are already a member of this pool.' }
  }

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

export interface WaitlistPromotionResult {
  candidate: { id: string; userId: string; examComponentId: string; status: string }
  result: {
    success: boolean
    membership?: { id: string } | Prisma.PoolMembershipGetPayload<{}>
    booking?: { id: string } | Prisma.ExamBookingGetPayload<{}> | null
    pool?: { id: string; name: string }
  }
}

export async function promoteNextFromWaitlist(poolId: string, tx: Prisma.TransactionClient): Promise<WaitlistPromotionResult | null> {
  const next = await tx.poolWaitlist.findFirst({
    where: { poolId, status: 'PENDING' },
    orderBy: { priority: 'asc' },
  })

  if (!next) return null

  const examComponent = await tx.examComponent.findUnique({
    where: { id: next.examComponentId },
    select: { course: { select: { code: true } } },
  })

  const result = await joinPoolInternal(tx, {
    poolId,
    userId: next.userId,
    examComponentId: next.examComponentId,
    moduleCode: examComponent?.course?.code,
  })

  if (result.success) {
    await tx.poolWaitlist.update({
      where: { id: next.id },
      data: { status: 'CONFIRMED' },
    })
    return { candidate: next, result: { success: result.success, membership: result.membership, booking: result.booking, pool: result.pool } }
  } else {
    await tx.poolWaitlist.update({
      where: { id: next.id },
      data: { status: 'CANCELLED' as const },
    })
    return promoteNextFromWaitlist(poolId, tx)
  }
}
