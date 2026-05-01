import prisma from '@/lib/prisma/client'
import { Prisma } from '@prisma/client'
import { MODULE_DIVERSITY_CAP, POOL_MAX_CANDIDATES } from './types'
import { confirmPoolInternal } from './confirm'

export interface MergeValidationResult {
  compatible: boolean
  reason: string
}

export async function canMergePools(
  poolAId: string,
  poolBId: string
): Promise<MergeValidationResult> {
  const [poolA, poolB] = await Promise.all([
    prisma.examPool.findUnique({
      where: { id: poolAId },
      include: {
        memberships: { where: { status: { in: ['RESERVED', 'CONFIRMED'] } } },
      },
    }),
    prisma.examPool.findUnique({
      where: { id: poolBId },
      include: {
        memberships: { where: { status: { in: ['RESERVED', 'CONFIRMED'] } } },
      },
    }),
  ])

  if (!poolA || !poolB) {
    return { compatible: false, reason: 'One or both pools not found' }
  }

  if (poolA.id === poolB.id) {
    return { compatible: false, reason: 'Cannot merge a pool into itself' }
  }

  if (poolA.eventId !== poolB.eventId) {
    return { compatible: false, reason: 'Pools must be in the same event' }
  }

  if (!['OPEN', 'NEAR_FULL', 'DRAFT'].includes(poolA.status)) {
    return { compatible: false, reason: `Pool A is ${poolA.status} (must be OPEN or NEAR_FULL)` }
  }

  if (!['OPEN', 'NEAR_FULL', 'DRAFT'].includes(poolB.status)) {
    return { compatible: false, reason: `Pool B is ${poolB.status} (must be OPEN or NEAR_FULL)` }
  }

  const combinedCount = poolA.currentMemberCount + poolB.currentMemberCount
  if (combinedCount > POOL_MAX_CANDIDATES) {
    return {
      compatible: false,
      reason: `Combined count (${combinedCount}) exceeds maximum capacity (${POOL_MAX_CANDIDATES})`,
    }
  }

  const modulesA = new Set(poolA.allowedModules || [])
  const modulesB = new Set(poolB.allowedModules || [])
  const combinedModules = new Set([...modulesA, ...modulesB])

  if (combinedModules.size > MODULE_DIVERSITY_CAP) {
    return {
      compatible: false,
      reason: `Combined modules (${Array.from(combinedModules).join(', ')}) exceeds cap of ${MODULE_DIVERSITY_CAP}`,
    }
  }

  // Same date/time check logic from business rules
  if (
    poolA.examDate &&
    poolB.examDate &&
    poolA.examDate.getTime() === poolB.examDate.getTime()
  ) {
    const aStart = poolA.examStartTime?.getTime() || 0
    const aEnd = poolA.examEndTime?.getTime() || 0
    const bStart = poolB.examStartTime?.getTime() || 0
    const bEnd = poolB.examEndTime?.getTime() || 0

    if (aStart > 0 && aEnd > 0 && bStart > 0 && bEnd > 0) {
      if (!(aEnd <= bStart || bEnd <= aStart)) {
        return { compatible: false, reason: 'Pools have overlapping exam times' }
      }
    }
  }

  // Check for candidate collisions (same user in both pools)
  const usersA = new Set(poolA.memberships.map((m) => m.userId))
  for (const m of poolB.memberships) {
    if (usersA.has(m.userId)) {
      return {
        compatible: false,
        reason: 'Candidate collision: A candidate is already in both pools',
      }
    }
  }

  return {
    compatible: true,
    reason: `Compatible: ${combinedCount} candidates, ${combinedModules.size} modules`,
  }
}

/**
 * Merges Pool B into Pool A, moving all candidates and closing Pool B.
 * Pool A absorbs Pool B's candidates and allowed modules.
 */
export async function mergePools(poolAId: string, poolBId: string, adminId: string) {
  const validation = await canMergePools(poolAId, poolBId)
  if (!validation.compatible) {
    throw new Error(validation.reason)
  }

  return prisma.$transaction(
    async (tx) => {
      const poolA = await tx.examPool.findUniqueOrThrow({
        where: { id: poolAId },
      })
      const poolB = await tx.examPool.findUniqueOrThrow({
        where: { id: poolBId },
        include: {
          memberships: { where: { status: { in: ['RESERVED', 'CONFIRMED'] } } },
        },
      })

      // Calculate new values for Pool A
      const combinedModules = Array.from(
        new Set([...(poolA.allowedModules || []), ...(poolB.allowedModules || [])])
      )
      const combinedCount = poolA.currentMemberCount + poolB.currentMemberCount
      const combinedTotalDemand = (poolA.totalDemandSeats || 0) + (poolB.totalDemandSeats || 0)

      let newStatus = poolA.status
      if (combinedCount >= 25) newStatus = 'CONFIRMED'
      else if (combinedCount >= 23) newStatus = 'NEAR_FULL'

      // 1. Move memberships from B to A
      await tx.poolMembership.updateMany({
        where: { poolId: poolB.id, status: { in: ['RESERVED', 'CONFIRMED'] } },
        data: { poolId: poolA.id },
      })

      // 2. Update Pool A
      const updatedPoolA = await tx.examPool.update({
        where: { id: poolA.id },
        data: {
          allowedModules: combinedModules,
          currentMemberCount: combinedCount,
          totalDemandSeats: combinedTotalDemand,
          status: newStatus,
        },
      })

      // 3. Mark Pool B as MERGED and reset counts
      await tx.examPool.update({
        where: { id: poolB.id },
        data: {
          status: 'MERGED',
          currentMemberCount: 0,
        },
      })

      // 4. Log audit event
      const { createAuditLog, AuditAction } = await import('@/lib/audit/logger')
      await createAuditLog(
        {
          action: AuditAction.UPDATE,
          entity: 'ExamPool',
          entityId: poolA.id,
          userId: adminId,
          details: {
            mergedFrom: poolB.id,
            newCount: combinedCount,
            newModules: combinedModules,
          },
        },
        tx
      )

      // 5. If we just hit CONFIRMED, trigger confirmation
      if (newStatus === 'CONFIRMED' && poolA.status !== 'CONFIRMED') {
        await confirmPoolInternal(poolA.id, tx)
      }

      return updatedPoolA
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  )
}
