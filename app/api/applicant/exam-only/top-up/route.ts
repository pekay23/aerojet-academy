import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'

export async function POST(request: Request) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { amount, paymentMethodId, proofUrl } = await request.json()

    if (!amount || amount < 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Get payment method name from ID if provided
    let paymentMethodName = 'BANK_TRANSFER'
    if (paymentMethodId) {
      const paymentMethod = await prisma.paymentMethod.findUnique({
        where: { id: paymentMethodId },
      })
      if (paymentMethod) {
        paymentMethodName = paymentMethod.label
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        registrationCode: true,
        programmeChoice: true,
      },
    })

    if (!user?.registrationCode) {
      return NextResponse.json({ error: 'No registration code found' }, { status: 400 })
    }

    const existingPayment = await prisma.payment.findFirst({
      where: {
        userId,
        referenceType: 'WALLET_TOPUP',
        status: 'PENDING',
      },
    })

    if (existingPayment) {
      return NextResponse.json(
        {
          error: 'You already have a pending top-up. Please wait for it to be processed.',
        },
        { status: 400 }
      )
    }

    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: Number(amount),
        currency: 'EUR',
        status: 'PENDING',
        referenceType: 'WALLET_TOPUP',
        paymentMethod: paymentMethodName,
        proofUrl: proofUrl || null,
        proofUploadedAt: proofUrl ? new Date() : null,
      },
    })

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      registrationCode: user.registrationCode,
    })
  } catch (error) {
    console.error('Error processing top-up:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
