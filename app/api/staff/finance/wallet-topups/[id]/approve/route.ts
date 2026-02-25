import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { createAuditLog } from '@/lib/audit/logger'
import { getOrCreateWallet, topUpWallet } from '@/lib/wallet/operations'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireStaff()
    const { id } = await params

    const payment = await prisma.payment.findUnique({
      where: { id },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 })
    }

    if (payment.status !== 'PENDING') {
      return NextResponse.json({ error: 'Top-up request is not pending' }, { status: 400 })
    }

    if (payment.referenceType !== 'WALLET_TOPUP') {
      return NextResponse.json({ error: 'Payment is not a wallet top-up request' }, { status: 400 })
    }

    // Ensure wallet exists before tx
    await getOrCreateWallet(payment.userId)

    // Process atomically
    await prisma.$transaction(async (tx) => {
      // Update payment status
      await tx.payment.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: staff.id,
        },
      })

      // Top up wallet
      await topUpWallet(
        tx,
        payment.userId,
        Number(payment.amount),
        'Wallet top-up approved by admin',
        payment.id,
        'PAYMENT_ID'
      )
    })

    await createAuditLog({
      action: 'SYSTEM_UPDATE' as any,
      entity: 'payments',
      entityId: id,
      userId: staff.id,
      description: `Approved wallet top-up of ${payment.amount} for user ID ${payment.userId}`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Approve top-up err:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
