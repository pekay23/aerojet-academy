import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { chargeWallet } from '@/lib/wallet/operations'
import { logAuditEvent, AuditAction } from '@/lib/audit/logger'
import { convertCurrency } from '@/lib/currency-api'
import { getCurrencySymbol } from '@/lib/currency'

// ---------------------------------------------------------------------------
// GET — Registration fee status
// ---------------------------------------------------------------------------

export const GET = withErrorHandler(async (_req: NextRequest) => {
  const session = await getAuthSession()
  if (!session) throw new Error('Unauthorized')

  const user = await prismaUnfiltered.user.findUnique({
    where: { id: session.user.id },
    select: {
      registrationFee: true,
      registrationPaid: true,
      paymentApprovedAt: true,
    },
  })

  if (!user) throw new Error('User not found')

  const wallet = await prismaUnfiltered.wallet.findUnique({
    where: { userId: session.user.id },
    select: { availableBalance: true, currency: true },
  })

  return apiSuccess({
    registrationFee: Number(user.registrationFee),
    registrationCurrency: 'GHS', // Enforce GHS for display
    registrationPaid: user.registrationPaid,
    paymentApprovedAt: user.paymentApprovedAt,
    walletBalance: wallet ? Number(wallet.availableBalance) : 0,
    walletCurrency: wallet?.currency ?? 'EUR',
  })
})

// ---------------------------------------------------------------------------
// POST — Pay registration fee from wallet
// ---------------------------------------------------------------------------

export const POST = withErrorHandler(async (_req: NextRequest) => {
  const session = await getAuthSession()
  if (!session) throw new Error('Unauthorized')

  const userId = session.user.id

  // Fetch user and wallet
  const [user, wallet] = await Promise.all([
    prismaUnfiltered.user.findUnique({
      where: { id: userId },
      select: { registrationFee: true, registrationPaid: true },
    }),
    prismaUnfiltered.wallet.findUnique({
      where: { userId },
      select: { availableBalance: true, currency: true },
    }),
  ])

  if (!user) throw new Error('User not found')

  if (user.registrationPaid) {
    return apiError('Registration fee has already been paid', 409)
  }

  if (!wallet) {
    return apiError('Wallet not found. Please contact support.', 404)
  }

  // --- Currency Configuration ---
  const feeGhs = Number(user.registrationFee)
  const walletCurrency = wallet.currency || 'EUR'
  const walletSymbol = getCurrencySymbol(walletCurrency)
  
  // Convert fee (GHS) to wallet currency
  const { convertedAmount: amountToDeduct } = await convertCurrency(feeGhs, 'GHS', walletCurrency)

  const available = Number(wallet.availableBalance)
  if (available < amountToDeduct) {
    return apiError(
      `Insufficient wallet balance. Available: ${walletSymbol}${available.toFixed(2)}, Required: ${walletSymbol}${amountToDeduct.toFixed(2)} (Equivalent of GH₵${feeGhs.toFixed(2)})`,
      400
    )
  }

  // Execute in a transaction
  await prismaUnfiltered.$transaction(async (tx) => {
    // Charge wallet (creates transaction + decrements balance)
    await chargeWallet(
      tx,
      userId,
      amountToDeduct,
      `Registration Fee Payment (GH₵${feeGhs.toFixed(2)})`,
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

    // Qualify any pending referral for this user
    const { qualifyReferral } = await import('@/lib/referral/operations')
    await qualifyReferral(userId)
  }, {
    timeout: 20000 // Increase timeout to 20s to handle DB latency/cold starts
  })

  // Audit log (outside transaction)
  await logAuditEvent({
    userId,
    action: AuditAction.PAYMENT_APPROVE,
    entity: 'User',
    entityId: userId,
    description: `Student paid registration fee of GH₵${feeGhs.toFixed(2)} using ${walletSymbol}${amountToDeduct.toFixed(2)} from wallet`,
    changes: { registrationPaid: true, amount: feeGhs, deduction: amountToDeduct, currency: walletCurrency },
  })

  return apiSuccess({ message: 'Registration fee paid successfully' })
})
