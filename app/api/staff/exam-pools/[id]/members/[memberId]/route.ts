import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { Prisma } from '@prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { POOL_NEAR_FULL_THRESHOLD } from '@/lib/pools/types'
import { decrementPoolMemberCount } from '@/lib/pools/operations'

interface RouteParams {
  params: { id: string; memberId: string }
}

// DELETE /api/staff/exam-pools/[id]/members/[memberId] — Remove a member from a pool
export const DELETE = withErrorHandler(async (req: NextRequest, { params }: RouteParams) => {
  const staff = await requireStaff()
  const { id: poolId, memberId } = params

  const { reason } = await req.json()
  if (!reason || reason.trim().length < 5) {
    return apiError('A valid withdrawal reason (at least 5 characters) is required.')
  }

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
              description: `Removed from pool by staff. Reason: ${reason}`,
              referenceId: `REMOVE-${poolId.substring(0, 8)}`,
              referenceType: 'STAFF_REMOVAL',
              balanceBefore: Number(wallet.balance),
              balanceAfter: Number(wallet.balance),
              reservedBefore: Number(wallet.reservedBalance),
              reservedAfter: Number(wallet.reservedBalance) - releaseAmount,
              availableBefore: Number(wallet.availableBalance),
              availableAfter: Number(wallet.availableBalance) + releaseAmount,
              metadata: { reason, staffId: staff.id },
            },
          })
        }
      }

      // Cancel membership
      await tx.poolMembership.update({
        where: { id: memberId },
        data: { status: 'CANCELLED' },
      })

      // Lock pool row and decrement count
      await tx.$executeRawUnsafe(`SELECT id FROM exam_pools WHERE id = $1 FOR UPDATE`, poolId)
      await decrementPoolMemberCount(poolId, tx)

      return { userId: membership.userId, releaseAmount }
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  )

  await createAuditLog({
    action: AuditAction.DELETE,
    entity: 'PoolMembership',
    entityId: memberId,
    userId: staff.id,
    details: { poolId, removedUserId: result.userId, amountReleased: result.releaseAmount, reason },
  })

  return apiSuccess({ message: 'Member removed', amountReleased: result.releaseAmount })
})
