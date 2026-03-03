import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { Prisma } from '@prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { POOL_NEAR_FULL_THRESHOLD } from '@/lib/pools/types'

interface RouteParams {
  params: { id: string; memberId: string }
}

// DELETE /api/staff/exam-pools/[id]/members/[memberId] — Remove a member from a pool
export const DELETE = withErrorHandler(async (req: NextRequest, { params }: RouteParams) => {
  const staff = await requireStaff()
  const { id: poolId, memberId } = params

  const result = await prisma.$transaction(
    async (tx) => {
      const membership = await tx.poolMembership.findUnique({
        where: { id: memberId },
        include: { user: { select: { id: true, email: true } } },
      })

      if (!membership) throw new Error('NOT_FOUND')
      if (membership.poolId !== poolId) throw new Error('NOT_FOUND')

      if (!['RESERVED', 'CONFIRMED'].includes(membership.status)) {
        throw new Error(`Cannot remove member with status ${membership.status}`)
      }

      const releaseAmount = Number(membership.amountReserved) || 0

      // Release reserved funds if any
      if (releaseAmount > 0) {
        const wallet = await tx.wallet.findUnique({ where: { userId: membership.userId } })
        if (wallet) {
          await tx.wallet.update({
            where: { userId: membership.userId },
            data: {
              reservedBalance: { decrement: releaseAmount },
              availableBalance: { increment: releaseAmount },
            },
          })

          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              type: 'RELEASE',
              amount: releaseAmount,
              description: `Removed from pool by staff`,
              referenceId: `REMOVE-${poolId.substring(0, 8)}`,
              referenceType: 'STAFF_REMOVAL',
              balanceBefore: Number(wallet.balance),
              balanceAfter: Number(wallet.balance),
              reservedBefore: Number(wallet.reservedBalance),
              reservedAfter: Number(wallet.reservedBalance) - releaseAmount,
              availableBefore: Number(wallet.availableBalance),
              availableAfter: Number(wallet.availableBalance) + releaseAmount,
            },
          })
        }
      }

      // Cancel membership
      await tx.poolMembership.update({
        where: { id: memberId },
        data: { status: 'CANCELLED' },
      })

      // Update pool count and status
      const pool = await tx.examPool.findUnique({ where: { id: poolId } })
      if (pool) {
        const newCount = Math.max(0, pool.currentMemberCount - 1)
        let newStatus = pool.status
        if (pool.status === 'NEAR_FULL' && newCount < POOL_NEAR_FULL_THRESHOLD) {
          newStatus = 'OPEN'
        }
        await tx.examPool.update({
          where: { id: poolId },
          data: { currentMemberCount: newCount, status: newStatus },
        })
      }

      return { userId: membership.userId, releaseAmount }
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  )

  await createAuditLog({
    action: AuditAction.DELETE,
    entity: 'PoolMembership',
    entityId: memberId,
    userId: staff.id,
    details: { poolId, removedUserId: result.userId, amountReleased: result.releaseAmount },
  })

  return apiSuccess({ message: 'Member removed', amountReleased: result.releaseAmount })
})
