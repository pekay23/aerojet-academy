import { NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import { PaymentStatus } from '@prisma/client'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { id: paymentId } = await params

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    })

    if (!payment) {
      return Response.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (payment.userId !== userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (payment.status !== 'PENDING') {
      return Response.json(
        {
          error: `Cannot cancel payment with status ${payment.status}`,
        },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { reason } = body

    if (!reason || reason.trim().length < 10) {
      return Response.json(
        {
          error: 'Please provide a reason for cancellation (min 10 characters)',
        },
        { status: 400 }
      )
    }

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        rejectedAt: new Date(),
      },
    })

    return Response.json({
      success: true,
      message: 'Payment cancelled successfully',
    })
  } catch (error) {
    console.error('Error cancelling payment:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
