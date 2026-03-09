import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { createAuditLog } from '@/lib/audit/logger'
import { getOrCreateWallet, topUpWallet } from '@/lib/wallet/operations'
import { convertCurrency } from '@/lib/currency-api'

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

    // Use paymentCurrency and originalAmount if available (standardized fields)
    const paymentCurrency = payment.paymentCurrency || (payment.currency !== 'EUR' ? payment.currency : 'EUR')
    const originalAmount = payment.originalAmount ? Number(payment.originalAmount) : Number(payment.amount)
    
    let eurAmount = Number(payment.amount) // Default to stored indicative amount
    let conversionNote = ''

    if (paymentCurrency !== 'EUR') {
      try {
        const { convertedAmount, rate } = await convertCurrency(
          originalAmount,
          paymentCurrency,
          'EUR'
        )
        eurAmount = convertedAmount
        conversionNote = ` (converted from ${paymentCurrency} ${originalAmount} at rate ${rate.toFixed(4)})`
      } catch (err) {
        console.error('Conversion failed during approval:', err)
        // Fallback to indicative amount if live conversion fails
        conversionNote = ` (using indicative amount; live conversion failed)`
      }
    }

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

      // Top up wallet in EUR
      await topUpWallet(
        tx,
        payment.userId,
        eurAmount,
        `Wallet top-up approved by admin${conversionNote}`,
        payment.id,
        'PAYMENT_ID'
      )

      await tx.notification.create({
        data: {
          userId: payment.userId,
          title: 'Wallet Top-Up Approved',
          message: paymentCurrency !== 'EUR'
            ? `Your ${paymentCurrency} ${payment.amount} top-up has been approved and credited as EUR ${eurAmount.toFixed(2)}.`
            : `Your wallet top-up of EUR ${payment.amount} has been approved.`,
          type: 'SUCCESS',
          linkUrl: '/student/wallet',
          linkText: 'View Wallet',
        },
      })
    })

    // Qualify any pending referral for this user (non-blocking)
    import('@/lib/referral/operations')
      .then(({ qualifyReferral }) => qualifyReferral(payment.userId))
      .catch(console.error)

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
