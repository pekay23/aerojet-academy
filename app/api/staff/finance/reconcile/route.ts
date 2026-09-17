import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

export const POST = withErrorHandler(async (req: NextRequest) => {
  const staff = await requireStaff()

  let body: { paymentIds: string[]; notes?: string }
  try {
    body = await req.json()
  } catch (_e) {
    return apiError('Invalid request body', 400)
  }

  const { paymentIds, notes } = body
  if (!paymentIds || !Array.isArray(paymentIds)) {
    return apiError('paymentIds array is required')
  }

  const result = await prismaUnfiltered.$transaction(async (tx) => {
    const updated = await tx.payment.updateMany({
      where: {
        id: { in: paymentIds },
        status: 'APPROVED',
        reconciled: false,
      },
      data: {
        reconciled: true,
        reconciledAt: new Date(),
        reconciledBy: staff.id,
        reconciliationNotes: notes || 'Hand-matched reconciliation',
      },
    })

    // Add audit logs for each payment? Might be excessive for bulk.
    // We'll log the bulk action.
    await createAuditLog({
      action: AuditAction.PAYMENT_RECONCILE_BULK,
      entity: 'Payment',
      userId: staff.id,
      details: {
        count: updated.count,
        paymentIds,
        notes,
      },
    })

    return updated
  })

  return apiSuccess({ message: `Reconciled ${result.count} payments`, count: result.count })
})
