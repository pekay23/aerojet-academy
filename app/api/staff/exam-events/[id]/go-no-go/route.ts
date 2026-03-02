import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { failPool } from '@/lib/pools/operations'
import { creditToWallet } from '@/lib/wallet/operations'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { EventStatus, PaymentStatus } from '@prisma/client'

export const POST = withErrorHandler(
  async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
    const admin = await requireStaff()
    if (admin.role !== 'ADMIN' && admin.role !== 'SUPER_ADMIN') {
      return apiError('Unauthorized', 403)
    }

    const id = ctx?.params?.id
    if (!id) return apiError('Event ID required')

    const body = await req.json()
    const { decision } = body // 'go' | 'no_go' | 'postpone'

    const event = await prisma.examEvent.findUnique({
      where: { id },
      include: { pools: { include: { memberships: true } } },
    })
    if (!event) return apiNotFound('Event not found')

    if (decision === 'go') {
      await prisma.examEvent.update({ where: { id }, data: { status: EventStatus.CONFIRMED } })
    } else if (decision === 'no_go' || decision === 'postpone') {
      // Fail all non-confirmed pools (release funds)
      for (const pool of event.pools) {
        if (pool.status !== 'CONFIRMED' && pool.status !== 'COMPLETED') {
          await failPool(pool.id, admin.id)
        }
      }

      // For postponement: credit wallet for all confirmed bookings (per business rules)
      if (decision === 'postpone') {
        const confirmedBookings = await prisma.examBooking.findMany({
          where: {
            eventId: id,
            status: PaymentStatus.COMPLETED,
          },
        })

        for (const booking of confirmedBookings) {
          const amount = Number(booking.amountPaid || 0)
          if (amount > 0) {
            await prisma.$transaction(async (tx) => {
              await creditToWallet(
                tx,
                booking.userId,
                amount,
                `Refund: Exam event postponed - ${event.name}`,
                booking.id,
                'EVENT_POSTPONEMENT_REFUND'
              )
            })
          }
        }
      }

      await prisma.examEvent.update({
        where: { id },
        data: { status: decision === 'postpone' ? EventStatus.POSTPONED : EventStatus.CANCELLED },
      })
    } else {
      return apiError('Decision must be "go", "no_go", or "postpone"')
    }

    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'ExamEvent',
      entityId: id,
      userId: admin.id,
      details: { decision },
    })
    return apiSuccess({ message: `Event ${decision} decision recorded` })
  }
)
