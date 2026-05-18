/**
 * Pool Withdrawal — Allows candidates to leave a pool.
 *
 * Supports both RESERVED and CONFIRMED memberships:
 * - RESERVED: release reserved funds back to available balance
 * - CONFIRMED: credit wallet (no bank refund, wallet credit only)
 *
 * On withdrawal:
 * 1. Release/credit funds to wallet
 * 2. Update membership to CANCELLED
 * 3. Decrement pool member count
 * 4. Downgrade pool status (NEAR_FULL → OPEN if count drops below 23)
 * 5. Send notifications to student and admin
 */

import prisma from '@/lib/prisma/client'
import { Prisma } from '@prisma/client'
import { POOL_NEAR_FULL_THRESHOLD } from './types'
import { promoteNextFromWaitlist } from './waitlist'
import { decrementPoolMemberCount } from './operations'
import { creditToWallet } from '@/lib/wallet/operations'
import { logAuditEvent } from '../audit/logger'
import { sendWithdrawalConfirmationEmail, sendWaitlistPromotionEmail } from '@/lib/email/service'
import { ACTIVE_MEMBERSHIP_STATUSES } from '@/lib/utils/constants'

export interface WithdrawResult {
  success: boolean
  error?: string
  amountReleased?: number
}

export async function withdrawFromPool(poolId: string, userId: string): Promise<WithdrawResult> {
  try {
    const result = await prisma.$transaction(
      async (tx) => {
        // Advisory lock on pool to prevent concurrent modifications
        const lockKey = BigInt('0x' + poolId.replace(/-/g, '').slice(0, 15))
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey})`

        const pool = await tx.examPool.findUnique({ where: { id: poolId } })
        if (!pool) return { success: false, error: 'Pool not found' }

        // Find active membership (RESERVED or CONFIRMED)
        const membership = await tx.poolMembership.findFirst({
          where: { poolId, userId, status: { in: ACTIVE_MEMBERSHIP_STATUSES } },
        })

        if (!membership) {
          return { success: false, error: 'No active membership found in this pool' }
        }

        let releaseAmount = 0

        if (membership.status === 'RESERVED') {
          // Release reserved funds back to available balance
          releaseAmount = Number(membership.amountReserved) || 0
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
        } else if (membership.status === 'CONFIRMED') {
          // Credit wallet for confirmed memberships (no bank refund, wallet credit only)
          releaseAmount = Number(membership.amountPaid) || Number(membership.amountReserved) || 0
          if (releaseAmount > 0) {
            await creditToWallet(
              tx,
              userId,
              releaseAmount,
              `Pool withdrawal credit: ${pool.name}`,
              poolId,
              'POOL_WITHDRAWAL'
            )
          }

          // Notify admin about confirmed withdrawal
          const staffUsers = await tx.user.findMany({
            where: { role: { in: ['ADMIN', 'STAFF'] } },
            select: { id: true },
            take: 20,
          })
          for (const staff of staffUsers) {
            await tx.notification.create({
              data: {
                userId: staff.id,
                title: 'Confirmed Member Withdrew',
                message: `A confirmed member withdrew from "${pool.name}". €${releaseAmount.toFixed(2)} wallet credit issued.`,
                type: 'POOL_UPDATE',
                linkUrl: '/staff/exam-pools',
                linkText: 'View Pools',
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
        await decrementPoolMemberCount(poolId, tx)

        // Log the audit event
        await logAuditEvent({
          userId,
          action: 'POOL_WITHDRAWAL',
          entity: 'ExamPool',
          entityId: poolId,
          description: `User ${userId} withdrew from pool "${pool.name}". Seat freed for waitlist.`,
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
        sendWithdrawalConfirmationEmail(
          email,
          name,
          (result as any)._emailData?.poolName || 'Pool',
          result.amountReleased || 0
        ).catch(console.error)
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
          sendWaitlistPromotionEmail(
            email,
            name,
            (result as any)._emailData?.poolName || 'Pool',
            examDateStr,
            'Module'
          ).catch(console.error)
        }
      }
    }

    return result
  } catch (err: any) {
    console.error('[POOL WITHDRAW ERROR]', err)
    return { success: false, error: err.message || 'Failed to withdraw from pool' }
  }
}
