/**
 * Pool Operations — Consolidated Entry Point
 *
 * This module re-exports the canonical implementations from their respective
 * files and provides query functions (getPoolWithDetails, getAvailablePools).
 *
 * Mutation operations (joinPool, confirmPool, failPool) are delegated to
 * lib/pools/join.ts and lib/pools/confirm.ts for proper atomic transactions.
 */

import { Prisma, PoolStatus } from '@prisma/client'
import { AuditAction } from '@/lib/audit/logger'
import prisma from '@/lib/prisma/client'
import { createAuditLog } from '@/lib/audit/logger'

// Re-export canonical join from join.ts
export { joinPool } from './join'

// Re-export canonical confirm + fail from confirm.ts
export { confirmPoolInternal, failPool } from './confirm'

// ---------------------------------------------------------------------------
// CONFIRM POOL (standalone, for staff manual confirm)
// ---------------------------------------------------------------------------

export async function confirmPool(poolId: string, actorId: string) {
  const { confirmPoolInternal: confirm } = await import('./confirm')

  return prisma.$transaction(
    async (tx) => {
      const pool = await tx.examPool.findUnique({
        where: { id: poolId },
        include: { memberships: true },
      })

      if (!pool) throw new Error('Pool not found')
      if (pool.status === 'CONFIRMED') throw new Error('Pool is already confirmed')

      await confirm(poolId, tx)

      await createAuditLog({
        action: AuditAction.APPROVE,
        entity: 'ExamPool',
        entityId: poolId,
        userId: actorId,
        details: {
          memberCount: pool.currentMemberCount,
          manualConfirm: true,
        },
      })

      return tx.examPool.findUnique({
        where: { id: poolId },
        include: { memberships: true },
      })
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  )
}

// ---------------------------------------------------------------------------
// GET POOL DETAILS
// ---------------------------------------------------------------------------

export async function getPoolWithDetails(poolId: string) {
  return prisma.examPool.findUnique({
    where: { id: poolId },
    include: {
      event: true,
      memberships: {
        where: { status: { in: ['RESERVED', 'CONFIRMED'] } },
        include: {
          user: {
            include: {
              profile: { select: { firstName: true, lastName: true } },
              studentProfile: { select: { studentId: true } },
            },
          },
          examComponent: {
            include: { course: { select: { code: true } } },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
}

// ---------------------------------------------------------------------------
// GET AVAILABLE POOLS
// ---------------------------------------------------------------------------

export async function getAvailablePools() {
  return prisma.examPool.findMany({
    where: {
      status: { in: [PoolStatus.OPEN, PoolStatus.NEAR_FULL] },
      examDate: { gt: new Date() },
    },
    include: {
      event: { select: { name: true, startDate: true, endDate: true } },
      _count: {
        select: { memberships: { where: { status: { in: ['RESERVED', 'CONFIRMED'] } } } },
      },
    },
    orderBy: { examDate: 'asc' },
  })
}
