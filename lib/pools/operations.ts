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
import prisma, { prismaUnfiltered } from '@/lib/prisma/client'
import { createAuditLog } from '@/lib/audit/logger'
import { POOL_NEAR_FULL_THRESHOLD } from './types'

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export type PoolWithDetails = Prisma.ExamPoolGetPayload<{
  include: {
    event: true
    memberships: {
      include: {
        examAttendance: true
        user: {
          include: {
            profile: true
            studentProfile: true
          }
        }
        examComponent: {
          include: {
            course: true
          }
        }
      }
    }
  }
}>

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

// Re-export canonical join from join.ts
export { joinPool } from './join'

// Re-export canonical confirm + fail from confirm.ts
export { confirmPoolInternal, failPool } from './confirm'

// ---------------------------------------------------------------------------
// GET POOL DETAILS
// ---------------------------------------------------------------------------

export async function getPoolWithDetails(
  poolId: string,
  options?: { includeAllStatuses?: boolean; unfiltered?: boolean }
): Promise<PoolWithDetails | null> {
  if (!poolId || typeof poolId !== 'string') return null

  const membershipsFilter: Prisma.PoolMembershipWhereInput = options?.includeAllStatuses
    ? {}
    : { status: { in: ['RESERVED', 'CONFIRMED'] } }

  const db = options?.unfiltered ? prismaUnfiltered : prisma

  try {
    return await db.examPool.findUnique({
      where: { id: poolId },
      include: {
        event: true,
        memberships: {
          where: membershipsFilter,
          include: {
            examAttendance: true,
            user: {
              include: {
                profile: true,
                studentProfile: true,
              },
            },
            examComponent: {
              include: {
                course: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
  } catch (error) {
    console.error(`[getPoolWithDetails] Error fetching pool ${poolId}:`, error)
    return null
  }
}

// ---------------------------------------------------------------------------
// GET AVAILABLE POOLS
// ---------------------------------------------------------------------------

export async function getAvailablePools(options?: { unfiltered?: boolean }) {
  const db = options?.unfiltered ? prismaUnfiltered : prisma
  return db.examPool.findMany({
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
// ---------------------------------------------------------------------------
// DECREMENT POOL COUNT (Shared logic for withdrawals/removals)
// ---------------------------------------------------------------------------

/**
 * Safely decrements a pool's member count and updates its status.
 * Must be called within a transaction that has locked the pool row.
 */
export async function decrementPoolMemberCount(poolId: string, tx: Prisma.TransactionClient) {
  // Use a raw query to lock the row if not already locked, but since we expect
  // the caller to have locked it, we just fetch it here.
  const pool = await tx.examPool.findUnique({ where: { id: poolId } })
  if (!pool) return

  const newCount = Math.max(0, pool.currentMemberCount - 1)
  let newStatus = pool.status

  // Downgrade NEAR_FULL -> OPEN if drops below threshold
  if (pool.status === 'NEAR_FULL' && newCount < POOL_NEAR_FULL_THRESHOLD) {
    newStatus = 'OPEN'
  }

  return tx.examPool.update({
    where: { id: poolId },
    data: { currentMemberCount: newCount, status: newStatus },
  })
}
