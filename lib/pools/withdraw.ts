/**
 * Pool Withdrawal — Allows candidates to leave a pool before confirmation.
 *
 * RULE: Only RESERVED memberships can be withdrawn. CONFIRMED memberships
 * are locked and cannot be withdrawn (per spec: "Pool seat cancellations:
 * wallet credit retained until pool confirms or fails").
 *
 * On withdrawal:
 * 1. Release reserved funds back to available balance
 * 2. Update membership to CANCELLED
 * 3. Decrement pool member count
 * 4. Downgrade pool status (NEAR_FULL → OPEN if count drops below 23)
 */

import prisma from '@/lib/prisma/client'
import { Prisma } from '@prisma/client'
import { POOL_NEAR_FULL_THRESHOLD } from './types'
import { promoteNextFromWaitlist } from './waitlist'
import { logAuditEvent } from '../audit/logger'
import { sendWithdrawalConfirmationEmail, sendWaitlistPromotionEmail } from '@/lib/email/service'

export interface WithdrawResult {
  success: boolean
  error?: string
  amountReleased?: number
}

export async function withdrawFromPool(poolId: string, userId: string): Promise<WithdrawResult> {
  try {
    const result = await prisma.$transaction(
      async (tx) => {
        // Lock pool row
        const [pool] = await tx.$queryRawUnsafe<any[]>(
          `SELECT * FROM "ExamPool" WHERE id = $1 FOR UPDATE`,
          poolId
        )
        if (!pool) return { success: false, error: 'Pool not found' }

        // Find active membership
        const membership = await tx.poolMembership.findFirst({
          where: { poolId, userId, status: { in: ['RESERVED'] } },
        })

        if (!membership) {
          // Check if they have a CONFIRMED membership
          const confirmed = await tx.poolMembership.findFirst({
            where: { poolId, userId, status: 'CONFIRMED' },
          })
          if (confirmed) {
            return {
              success: false,
              error: 'Cannot withdraw from a confirmed pool. Your seat is locked.',
            }
          }
          return { success: false, error: 'No active membership found in this pool' }
        }

        const releaseAmount = Number(membership.amountReserved) || 0

        // Release reserved funds back to available balance
        if (releaseAmount > 0) {
          const wallet = await tx.wallet.findUnique({ where: { userId } })
          if (wallet) {
            await tx.wallet.update({
              where: { userId },
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
                description: `Withdrew from pool: ${pool.name}`,
                referenceId: `WITHDRAW-${poolId.substring(0, 8)}`,
                referenceType: 'POOL_WITHDRAWAL',
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
          where: { id: membership.id },
          data: { status: 'CANCELLED' },
        })

        // Decrement pool count and possibly downgrade status
        const newCount = Math.max(0, pool.currentMemberCount - 1)
        let newStatus = pool.status

        // Downgrade NEAR_FULL → OPEN if drops below threshold
        if (pool.status === 'NEAR_FULL' && newCount < POOL_NEAR_FULL_THRESHOLD) {
          newStatus = 'OPEN'
        }

        await tx.examPool.update({
          where: { id: poolId },
          data: { currentMemberCount: newCount, status: newStatus },
        })

        // Log the audit event
        await logAuditEvent({
          userId,
          action: 'POOL_WITHDRAWAL',
          entity: 'ExamPool',
          entityId: poolId,
          description: `User ${userId} withdrew from pool ${poolId}. Seat freed for waitlist.`,
        })

        // Phase 9: Auto-promote from waitlist if pool was full or has space
        const promotion = await promoteNextFromWaitlist(poolId, tx)

        return {
          success: true,
          amountReleased: releaseAmount,
          promotedUserId: promotion?.candidate?.userId,
          _emailData: { poolName: pool.name, examDate: pool.examDate },
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    )

    // Send emails outside transaction
    if (result.success) {
      const { format } = await import('date-fns')

      // Withdrawal confirmation to the user who withdrew
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, academyEmail: true, profile: { select: { firstName: true } } },
      })
      if (user) {
        const email = user.academyEmail || user.email
        const name = user.profile?.firstName || 'Student'
        sendWithdrawalConfirmationEmail(email, name, (result as any)._emailData?.poolName || 'Pool', result.amountReleased || 0)
          .catch(console.error)
      }

      // Waitlist promotion notification
      if ((result as any).promotedUserId) {
        const promoted = await prisma.user.findUnique({
          where: { id: (result as any).promotedUserId },
          select: { email: true, academyEmail: true, profile: { select: { firstName: true } } },
        })
        if (promoted) {
          const email = promoted.academyEmail || promoted.email
          const name = promoted.profile?.firstName || 'Student'
          const examDateStr = (result as any)._emailData?.examDate
            ? format(new Date((result as any)._emailData.examDate), 'dd MMM yyyy')
            : 'TBA'
          sendWaitlistPromotionEmail(email, name, (result as any)._emailData?.poolName || 'Pool', examDateStr, 'Module')
            .catch(console.error)
        }
      }
    }

    return result
  } catch (err: any) {
    console.error('[POOL WITHDRAW ERROR]', err)
    return { success: false, error: err.message || 'Failed to withdraw from pool' }
  }
}
