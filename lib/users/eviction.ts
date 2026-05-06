import prisma from '@/lib/prisma/client'
import { Prisma, PoolStatus, PaymentStatus } from '@prisma/client'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { ACTIVE_MEMBERSHIP_STATUSES } from '@/lib/utils/constants'

/**
 * Sweeps a user's upcoming exams and pool memberships to ensure they do not
 * occupy capacity if their account becomes inactive (SUSPENDED, ARCHIVED, DELETED).
 * Refunds their reserved or paid amounts back to their wallet balance.
 */
export async function evictInactiveUserFromExams(userId: string, actorId: string, reason: string) {
  return prisma.$transaction(
    async (tx) => {
      let totalAmountRefunded = 0
      let totalMembershipsCancelled = 0
      let totalBookingsCancelled = 0

      const now = new Date()

      // 1. Cancel future Pool Memberships
      const futureMemberships = await tx.poolMembership.findMany({
        where: {
          userId,
          status: { in: ACTIVE_MEMBERSHIP_STATUSES },
          pool: {
            examDate: { gt: now },
            status: { in: ['OPEN', 'NEAR_FULL', 'CONFIRMED'] },
          },
        },
        include: { pool: true },
      })

      for (const membership of futureMemberships) {
        // Find if this pool has a confirmed booking tied to it (for CONFIRMED memberships)
        const booking = await tx.examBooking.findFirst({
          where: {
            eventId: membership.pool.eventId,
            userId: membership.userId,
            examComponentId: membership.examComponentId,
            status: { in: ['PENDING', 'APPROVED'] },
          },
        })

        const releaseAmount = Number(membership.amountReserved) || 0
        const captureAmount = Number(booking?.amountPaid) || 0
        const refundAmount = membership.status === 'CONFIRMED' ? captureAmount : releaseAmount

        // Process Refund
        if (refundAmount > 0) {
          const wallet = await tx.wallet.findUnique({ where: { userId } })
          if (wallet) {
            if (membership.status === 'RESERVED') {
              // Valid reserved balance to release back to available
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
                  description: `Auto-Released: Removed from pool (${reason})`,
                  referenceId: `EVICT-${membership.poolId.substring(0, 8)}`,
                  referenceType: 'EVICTION',
                  balanceBefore: Number(wallet.balance),
                  balanceAfter: Number(wallet.balance),
                  reservedBefore: Number(wallet.reservedBalance),
                  reservedAfter: Number(wallet.reservedBalance) - releaseAmount,
                  availableBefore: Number(wallet.availableBalance),
                  availableAfter: Number(wallet.availableBalance) + releaseAmount,
                },
              })
            } else if (membership.status === 'CONFIRMED') {
              // Once confirmed, funds were actually captured (removed from balance). Credit back.
              await tx.wallet.update({
                where: { userId },
                data: {
                  availableBalance: { increment: refundAmount },
                  balance: { increment: refundAmount },
                },
              })
              await tx.walletTransaction.create({
                data: {
                  walletId: wallet.id,
                  type: 'CREDIT',
                  amount: refundAmount,
                  description: `Auto-Refunded: Removed from confirmed pool (${reason})`,
                  referenceId: `REFUND-${membership.poolId.substring(0, 8)}`,
                  referenceType: 'EVICTION_REFUND',
                  balanceBefore: Number(wallet.balance),
                  balanceAfter: Number(wallet.balance) + refundAmount,
                  reservedBefore: Number(wallet.reservedBalance),
                  reservedAfter: Number(wallet.reservedBalance),
                  availableBefore: Number(wallet.availableBalance),
                  availableAfter: Number(wallet.availableBalance) + refundAmount,
                },
              })
            }
            totalAmountRefunded += refundAmount
          }
        }

        // Cancel membership
        await tx.poolMembership.update({
          where: { id: membership.id },
          data: { status: 'CANCELLED' },
        })
        totalMembershipsCancelled++

        // Decrement Pool Count (Only if pool isn't already closed/failed)
        if (['OPEN', 'NEAR_FULL', 'CONFIRMED'].includes(membership.pool.status)) {
          const newCount = Math.max(0, membership.pool.currentMemberCount - 1)
          let newStatus = membership.pool.status
          if (membership.pool.status === 'NEAR_FULL' && newCount < membership.pool.maxCandidates) {
            newStatus = 'OPEN'
          }
          await tx.examPool.update({
            where: { id: membership.pool.id },
            data: { currentMemberCount: newCount, status: newStatus },
          })
        }

        // Cancel individual booking linked to pool (Atomicity)
        if (booking) {
          await tx.examBooking.update({
            where: { id: booking.id },
            data: { status: 'REJECTED' },
          })
        }
      }

      // 2. Cancel future Individual Bookings (Not linked to pools)
      const futureBookings = await tx.examBooking.findMany({
        where: {
          userId,
          status: { in: ['PENDING', 'APPROVED'] },
          examDate: { gt: now },
        },
      })

      for (const booking of futureBookings) {
        // Note: Booking cancellation is already somewhat handled above if linked to memberships
        // But for truly standalone bookings (e.g. ones that didn't go through pools):

        const refundAmount = Number(booking.amountPaid) || 0
        if (refundAmount > 0) {
          const wallet = await tx.wallet.findUnique({ where: { userId } })
          if (wallet) {
            await tx.wallet.update({
              where: { userId },
              data: {
                availableBalance: { increment: refundAmount },
                balance: { increment: refundAmount },
              },
            })
            await tx.walletTransaction.create({
              data: {
                walletId: wallet.id,
                type: 'CREDIT',
                amount: refundAmount,
                description: `Auto-Refunded: Individual Exam Booking Cancelled (${reason})`,
                referenceId: `REFUND-BKG-${booking.id.substring(0, 8)}`,
                referenceType: 'EVICTION_REFUND',
                balanceBefore: Number(wallet.balance),
                balanceAfter: Number(wallet.balance) + refundAmount,
                reservedBefore: Number(wallet.reservedBalance),
                reservedAfter: Number(wallet.reservedBalance),
                availableBefore: Number(wallet.availableBalance),
                availableAfter: Number(wallet.availableBalance) + refundAmount,
              },
            })
            totalAmountRefunded += refundAmount
          }
        }

        // Reject booking
        await tx.examBooking.update({
          where: { id: booking.id },
          data: { status: 'REJECTED' },
        })
        totalBookingsCancelled++
      }

      return { totalAmountRefunded, totalMembershipsCancelled, totalBookingsCancelled }
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 10000,
    }
  )
}
