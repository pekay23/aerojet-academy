import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { Prisma } from '@prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { decrementPoolMemberCount } from '@/lib/pools/operations'
import { releaseFunds, creditToWallet } from '@/lib/wallet/operations'

// DELETE /api/staff/exam-pools/[id]/members/[memberId] — Remove a member from a pool
export const DELETE = withErrorHandler(
  async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
    const staff = await requireStaff()
    const poolId = ctx?.params?.id
    const memberId = ctx?.params?.memberId

    const { reason } = await req.json()
    if (!reason || reason.trim().length < 5) {
      return apiError('A valid withdrawal reason (at least 5 characters) is required.')
    }

    const result = await prismaUnfiltered.$transaction(
      async (tx) => {
        const membership = await tx.poolMembership.findUnique({
          where: { id: memberId },
          include: {
            user: { select: { id: true, email: true, profile: { select: { firstName: true } } } },
            pool: { select: { name: true } },
          },
        })

        if (!membership) throw new Error('NOT_FOUND')
        if (membership.poolId !== poolId) throw new Error('NOT_FOUND')

        if (!['RESERVED', 'CONFIRMED'].includes(membership.status)) {
          throw new Error(`Cannot remove member with status ${membership.status}`)
        }

        let refundAmount = 0
        let refundType: 'RELEASE' | 'CREDIT' = 'RELEASE'

        if (membership.status === 'RESERVED') {
          refundAmount = Number(membership.amountReserved) || 0
          if (refundAmount > 0) {
            await releaseFunds(
              tx,
              membership.userId,
              refundAmount,
              `Removed from pool by staff: ${membership.pool.name}. Reason: ${reason}`,
              poolId,
              'STAFF_REMOVAL'
            )
          }
        } else if (membership.status === 'CONFIRMED') {
          // Wallet credit for confirmed members (no bank refund)
          refundAmount = Number(membership.amountPaid) || Number(membership.amountReserved) || 0
          refundType = 'CREDIT'
          if (refundAmount > 0) {
            await creditToWallet(
              tx,
              membership.userId,
              refundAmount,
              `Removed from pool by staff: ${membership.pool.name}. Reason: ${reason}`,
              poolId,
              'STAFF_REMOVAL'
            )
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

        // Notify the student
        await tx.notification.create({
          data: {
            userId: membership.userId,
            title: 'Removed from Exam Pool',
            message:
              refundAmount > 0
                ? `You have been removed from "${membership.pool.name}". €${refundAmount.toFixed(2)} has been ${refundType === 'CREDIT' ? 'credited to' : 'released to'} your wallet. Reason: ${reason}`
                : `You have been removed from "${membership.pool.name}". Reason: ${reason}`,
            type: 'POOL_UPDATE',
            linkUrl: '/student/exam-bookings',
            linkText: 'View Bookings',
          },
        })

        return {
          userId: membership.userId,
          refundAmount,
          refundType,
          poolName: membership.pool.name,
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    )

    await createAuditLog({
      action: AuditAction.DELETE,
      entity: 'PoolMembership',
      entityId: memberId,
      userId: staff.id,
      description: `Removed member from pool "${result.poolName}" - Refund: €${result.refundAmount.toFixed(2)} (${result.refundType}). Reason: ${reason}`,
      details: {
        poolId,
        removedUserId: result.userId,
        amountRefunded: result.refundAmount,
        refundType: result.refundType,
        reason,
      },
    })

    return apiSuccess({
      message: 'Member removed',
      amountRefunded: result.refundAmount,
      refundType: result.refundType,
    })
  }
)
