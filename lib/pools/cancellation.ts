/**
 * Cancellation Flow — Handles booking cancellations with wallet credit.
 *
 * Per business rules:
 * - RESERVED memberships: release reserved funds back to available balance
 * - CONFIRMED memberships: credit wallet (no bank refund, wallet credit only)
 * - Notifications sent to both student and admin
 */

import prisma from '@/lib/prisma/client'
import { Prisma } from '@prisma/client'
import { releaseFunds, creditToWallet } from '@/lib/wallet/operations'
import { decrementPoolMemberCount } from './operations'
import { logAuditEvent } from '@/lib/audit/logger'

export interface CancellationResult {
  success: boolean
  error?: string
  refundAmount?: number
  refundType?: 'RELEASE' | 'CREDIT'
}

/**
 * Cancels a booking and its associated pool membership.
 * - RESERVED → release reserved funds
 * - CONFIRMED → credit wallet (wallet credit only, no bank refund)
 * Sends notifications to both student and admins.
 */
export async function cancelBooking(
  bookingId: string,
  cancelledBy: string,
  reason?: string
): Promise<CancellationResult> {
  try {
    const result = await prisma.$transaction(
      async (tx) => {
        // Find the booking
        const booking = await tx.examBooking.findUnique({
          where: { id: bookingId },
          include: {
            user: {
              select: { id: true, profile: { select: { firstName: true, lastName: true } } },
            },
            examComponent: { select: { course: { select: { code: true, name: true } } } },
            event: { select: { name: true } },
          },
        })

        if (!booking) throw new Error('Booking not found.')
        if (booking.status === 'COMPLETED') throw new Error('Cannot cancel a completed booking.')
        if (booking.cancelledAt) throw new Error('This booking has already been cancelled.')

        const userId = booking.userId
        const amount = Number(booking.amountPaid)
        const moduleLabel = booking.examComponent?.course?.code || booking.moduleCode || 'Exam'
        const studentName =
          `${booking.user.profile?.firstName || ''} ${booking.user.profile?.lastName || ''}`.trim() ||
          'Student'

        // Find associated pool membership(s)
        const memberships = await tx.poolMembership.findMany({
          where: {
            bookingId,
            status: { in: ['RESERVED', 'CONFIRMED'] },
          },
        })

        // Also check memberships by userId + examComponentId if no bookingId link
        let membershipsByLegacy: typeof memberships = []
        if (memberships.length === 0 && booking.examComponentId) {
          membershipsByLegacy = await tx.poolMembership.findMany({
            where: {
              userId,
              examComponentId: booking.examComponentId,
              status: { in: ['RESERVED', 'CONFIRMED'] },
            },
          })
        }

        const allMemberships = [...memberships, ...membershipsByLegacy]
        let totalRefund = 0
        let refundType: 'RELEASE' | 'CREDIT' = 'RELEASE'

        for (const membership of allMemberships) {
          const memberAmount = Number(membership.amountReserved) || amount

          if (membership.status === 'RESERVED' && memberAmount > 0) {
            // Release reserved funds back to available
            await releaseFunds(
              tx,
              userId,
              memberAmount,
              `Booking cancelled: ${moduleLabel}`,
              bookingId,
              'BOOKING_CANCELLATION'
            )
            totalRefund += memberAmount
            refundType = 'RELEASE'
          } else if (membership.status === 'CONFIRMED' && memberAmount > 0) {
            // Credit wallet (no bank refund per business rules)
            const creditAmount = Number(membership.amountPaid) || memberAmount
            await creditToWallet(
              tx,
              userId,
              creditAmount,
              `Cancellation credit: ${moduleLabel}`,
              bookingId,
              'BOOKING_CANCELLATION'
            )
            totalRefund += creditAmount
            refundType = 'CREDIT'
          }

          // Cancel the membership
          await tx.poolMembership.update({
            where: { id: membership.id },
            data: { status: 'CANCELLED' },
          })

          // Decrement pool count
          await decrementPoolMemberCount(membership.poolId, tx)
        }

        // Update the booking record
        await tx.examBooking.update({
          where: { id: bookingId },
          data: {
            status: 'FAILED',
            cancelledAt: new Date(),
            cancelledBy,
            cancellationReason: reason || 'Cancelled by user',
            refundAmount: totalRefund,
          },
        })

        // Student notification
        await tx.notification.create({
          data: {
            userId,
            title: 'Booking Cancelled',
            message:
              totalRefund > 0
                ? `Your booking for ${moduleLabel} has been cancelled. €${totalRefund.toFixed(2)} has been credited to your wallet.`
                : `Your booking for ${moduleLabel} has been cancelled.`,
            type: 'PAYMENT_UPDATE',
            linkUrl: '/student/wallet',
            linkText: 'View Wallet',
          },
        })

        // Admin notification — notify all staff
        const staffUsers = await tx.user.findMany({
          where: { role: { in: ['ADMIN', 'STAFF'] } },
          select: { id: true },
          take: 20,
        })

        for (const staff of staffUsers) {
          await tx.notification.create({
            data: {
              userId: staff.id,
              title: 'Booking Cancelled',
              message: `Booking cancelled for ${studentName} - ${moduleLabel}${booking.event ? ` (${booking.event.name})` : ''}. ${totalRefund > 0 ? `€${totalRefund.toFixed(2)} wallet credit issued.` : ''}`,
              type: 'PAYMENT_UPDATE',
              linkUrl: '/staff/exam-pools',
              linkText: 'View Pools',
            },
          })
        }

        await logAuditEvent(
          {
            action: 'BOOKING_CANCEL',
            entity: 'ExamBooking',
            entityId: bookingId,
            userId: cancelledBy,
            description: `Booking cancelled for ${studentName} - ${moduleLabel}${booking.event ? ` (${booking.event.name})` : ''}. Refund: €${totalRefund.toFixed(2)} (${refundType}). Reason: ${reason || 'User requested'}`,
          },
          tx
        )

        return { success: true, refundAmount: totalRefund, refundType }
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 15000,
      }
    )

    return result
  } catch (err: any) {
    console.error('[BOOKING CANCEL ERROR]', err instanceof Error ? err.message : 'Unknown error')
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to cancel booking.',
    }
  }
}
