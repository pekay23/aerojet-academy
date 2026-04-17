import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { createAuditLog } from '@/lib/audit/logger'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireStaff()
    const { id } = await params
    const { reason } = await req.json()

    if (!reason) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 })
    }

    const payment = await prisma.payment.findUnique({
      where: { id },
    })

    if (!payment || payment.status !== 'PENDING' || payment.referenceType !== 'WALLET_TOPUP') {
      return NextResponse.json(
        { error: 'Invalid or already processed top-up request' },
        { status: 400 }
      )
    }

    await prisma.payment.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedBy: staff.id,
        rejectionReason: reason,
      },
    })

    await createAuditLog({
      action: 'SYSTEM_UPDATE',
      entity: 'payments',
      entityId: id,
      userId: staff.id,
      description: `Rejected wallet top-up of ${payment.amount} for user ID ${payment.userId}. Reason: ${reason}`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Reject top-up err:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
