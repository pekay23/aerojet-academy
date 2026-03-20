import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

// PUT /api/staff/students/[id]/wallet/[txnId]/proof — Attach proof to existing transaction
export const PUT = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const staff = await requireStaff()
    const id = context?.params?.id
    const txnId = context?.params?.txnId
    if (!id) return apiError('Student ID required')
    if (!txnId) return apiError('Transaction ID required')

    const body = await req.json()
    const { proofUrl } = body as { proofUrl?: string }

    if (!proofUrl) return apiError('proofUrl is required')

    // Verify the transaction exists and belongs to the student's wallet
    const transaction = await prisma.walletTransaction.findUnique({
      where: { id: txnId },
      include: { wallet: { select: { userId: true, currency: true } } },
    })

    if (!transaction) return apiNotFound('Transaction not found')
    if (transaction.wallet.userId !== id) return apiError('Transaction does not belong to this student', 403)

    // Check if proof already exists for this transaction
    const existingProof = await prisma.payment.findFirst({
      where: {
        referenceType: 'wallet_transaction_proof',
        referenceId: txnId,
      },
    })

    if (existingProof) {
      // Update existing proof record
      await prisma.payment.update({
        where: { id: existingProof.id },
        data: {
          proofUrl,
          proofUploadedAt: new Date(),
          approvedBy: staff.id,
          notes: `Proof updated by staff for transaction ${txnId}`,
        },
      })
    } else {
      // Create new payment record linking proof to this transaction
      await prisma.payment.create({
        data: {
          userId: id,
          amount: Math.abs(Number(transaction.amount)),
          currency: transaction.wallet.currency,
          paymentMethod: 'STAFF_IMPORT',
          status: 'COMPLETED',
          proofUrl,
          proofUploadedAt: new Date(),
          referenceType: 'wallet_transaction_proof',
          referenceId: txnId,
          approvedAt: new Date(),
          approvedBy: staff.id,
          notes: `Proof attached by staff for transaction: ${transaction.description || txnId}`,
        },
      })
    }

    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'WalletTransaction',
      entityId: txnId,
      userId: staff.id,
      description: `Proof of payment attached to wallet transaction`,
      changes: {
        targetUserId: id,
        transactionId: txnId,
        proofUrl,
      },
    })

    return apiSuccess({ message: 'Proof attached successfully', proofUrl })
  }
)
