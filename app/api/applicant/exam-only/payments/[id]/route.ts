import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { requireApplicant } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { apiError, withErrorHandler , RouteContext } from '@/lib/api/response'

export const DELETE = withErrorHandler(async (request: NextRequest, ctx?: RouteContext) => {
  const user = await requireApplicant()

  const { id: paymentId } = (await ctx!.params) as Record<string, string>

  const payment = await prismaUnfiltered.payment.findUnique({
    where: { id: paymentId },
  })

  if (!payment) {
    return apiError('Payment not found', 404)
  }

  if (payment.userId !== user.id) {
    return apiError('Unauthorized', 403)
  }

  if (payment.status !== 'PENDING') {
    return apiError(`Cannot cancel payment with status ${payment.status}`, 400)
  }

  const body = await request.json()
  const { reason } = body

  if (!reason || reason.trim().length < 10) {
    return apiError('Please provide a reason for cancellation (min 10 characters)', 400)
  }

  await prismaUnfiltered.payment.update({
    where: { id: paymentId },
    data: {
      status: 'REJECTED',
      rejectionReason: reason,
      rejectedAt: new Date(),
    },
  })

  return NextResponse.json({
    success: true,
    message: 'Payment cancelled successfully',
  })
})
