import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { chargeWallet } from '@/lib/wallet/operations'
import { logAuditEvent, AuditAction } from '@/lib/audit/logger'

// ---------------------------------------------------------------------------
// GET — Registration fee status
// ---------------------------------------------------------------------------

export const GET = withErrorHandler(async (_req: NextRequest) => {
  const session = await getAuthSession()
  if (!session) throw new Error('Unauthorized')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      registrationFee: true,
      registrationCurrency: true,
      registrationPaid: true,
      paymentApprovedAt: true,
    },
  })

  if (!user) throw new Error('User not found')

  const wallet = await prisma.wallet.findUnique({
    where: { userId: session.user.id },
    select: { availableBalance: true, currency: true },
  })

  return apiSuccess({
    registrationFee: Number(user.registrationFee),
    registrationCurrency: user.registrationCurrency,
    registrationPaid: user.registrationPaid,
    paymentApprovedAt: user.paymentApprovedAt,
    walletBalance: wallet ? Number(wallet.availableBalance) : 0,
    walletCurrency: wallet?.currency ?? 'EUR',
  })
})

// ---------------------------------------------------------------------------
// POST — Pay registration fee from wallet
// ---------------------------------------------------------------------------

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await getAuthSession()
  if (!session) throw new Error('Unauthorized')

  const userId = session.user.id

  // Fetch user and wallet
  const [user, wallet] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { registrationFee: true, registrationPaid: true },
    }),
    prisma.wallet.findUnique({
      where: { userId },
      select: { availableBalance: true },
    }),
  ])

  if (!user) throw new Error('User not found')

  if (user.registrationPaid) {
    return apiError('Registration fee has already been paid', 409)
  }

  const fee = Number(user.registrationFee)

  if (!wallet) {
    return apiError('Wallet not found. Please contact support.', 404)
  }

  const available = Number(wallet.availableBalance)
  if (available < fee) {
    return apiError(
      `Insufficient wallet balance. Available: \u20AC${available.toFixed(2)}, Required: \u20AC${fee.toFixed(2)}`,
      400
    )
  }

  // Execute in a transaction
  await prisma.$transaction(async (tx) => {
    // Charge wallet (creates transaction + decrements balance)
    await chargeWallet(
      tx,
      userId,
      fee,
      'Registration Fee Payment',
      userId,
      'REGISTRATION_FEE'
    )

    // Mark registration as paid
    await tx.user.update({
      where: { id: userId },
      data: {
        registrationPaid: true,
        paymentApprovedAt: new Date(),
      },
    })
  })

  // Audit log (outside transaction so it doesn't block)
  await logAuditEvent({
    userId,
    action: AuditAction.PAYMENT_APPROVE,
    entity: 'User',
    entityId: userId,
    description: `Student paid registration fee of \u20AC${fee.toFixed(2)} from wallet`,
    changes: { registrationPaid: true, amount: fee },
  })

  return apiSuccess({ message: 'Registration fee paid successfully' })
})
