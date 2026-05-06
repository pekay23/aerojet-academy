import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { topUpWallet, adjustWallet, setWalletBalance, getOrCreateWallet } from '@/lib/wallet/operations'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { TransactionType } from '@prisma/client'
import { serializePrisma } from '@/lib/utils/serialization'

// GET /api/staff/students/[id]/wallet — View student wallet with full history
export const GET = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    await requireStaff()
    const id = context?.params?.id
    if (!id) return apiError('Student ID required')

    const { searchParams } = new URL(req.url)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'))
    const typeFilter = searchParams.get('type') as TransactionType | null

    const wallet = await prismaUnfiltered.wallet.findUnique({
      where: { userId: id },
    })

    if (!wallet) return apiNotFound('Wallet not found')

    const where: any = { walletId: wallet.id }
    if (typeFilter) where.type = typeFilter

    const [transactions, total] = await Promise.all([
      prismaUnfiltered.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prismaUnfiltered.walletTransaction.count({ where }),
    ])

    // Get user info for context
    const user = await prismaUnfiltered.user.findUnique({
      where: { id },
      select: {
        email: true,
        personalEmail: true,
        academyEmail: true,
        profile: { select: { firstName: true, middleName: true, lastName: true } },
      },
    })

    // Resolve staff names for transactions with createdBy
    const staffIds = [...new Set(transactions.filter((t) => t.createdBy).map((t) => t.createdBy!))]
    const staffUsers =
      staffIds.length > 0
        ? await prismaUnfiltered.user.findMany({
            where: { id: { in: staffIds } },
            select: { id: true, profile: { select: { firstName: true, lastName: true } } },
          })
        : []
    const staffMap = Object.fromEntries(
      staffUsers.map((u) => [
        u.id,
        u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : 'Staff',
      ])
    )

    // Check for linked payment proofs on staff transactions
    const txnIds = transactions.map((t) => t.id)
    const linkedPayments =
      txnIds.length > 0
        ? await prismaUnfiltered.payment.findMany({
            where: {
              OR: [
                { referenceId: { in: txnIds } },
                { referenceType: 'wallet_transaction_proof', referenceId: { in: txnIds } },
              ],
            },
            select: { referenceId: true, proofUrl: true },
          })
        : []
    const proofMap = Object.fromEntries(
      linkedPayments.filter((p) => p.proofUrl && p.referenceId).map((p) => [p.referenceId!, p.proofUrl!])
    )

    // Enrich transactions with staff names and proof URLs
    const enrichedTransactions = transactions.map((t) => ({
      ...t,
      staffName: t.createdBy ? staffMap[t.createdBy] || null : null,
      proofUrl: proofMap[t.id] || null,
    }))

    return apiSuccess(serializePrisma({
      wallet: {
        id: wallet.id,
        userId: wallet.userId,
        balance: wallet.balance,
        reservedBalance: wallet.reservedBalance,
        availableBalance: wallet.availableBalance,
        currency: wallet.currency,
        updatedAt: wallet.updatedAt,
      },
      user: user ? {
        email: user.academyEmail || user.email,
        personalEmail: user.personalEmail,
        name: user.profile
          ? `${user.profile.firstName} ${user.profile.middleName || ''} ${user.profile.lastName}`.replace(/\s+/g, ' ').trim()
          : user.email,
      } : null,
      transactions: enrichedTransactions,
      meta: { total, limit, offset },
    }))
  }
)

// POST /api/staff/students/[id]/wallet — Wallet operations
// Supports: top_up, credit, debit, adjustment, set_balance
export const POST = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const staff = await requireStaff()
    const id = context?.params?.id
    if (!id) return apiError('Student ID required')

    const body = await req.json()
    const {
      action = 'top_up',
      amount,
      description,
      reference,
      referenceType,
      proofUrl,
      notes,
      targetBalance,
    } = body as {
      action?: 'top_up' | 'credit' | 'debit' | 'adjustment' | 'set_balance'
      amount?: number
      description?: string
      reference?: string
      referenceType?: string
      proofUrl?: string
      notes?: string
      targetBalance?: number
    }

    // Ensure wallet exists
    await getOrCreateWallet(id)

    let wallet
    let operationDescription: string

    switch (action) {
      case 'top_up': {
        if (!amount || amount <= 0) return apiError('Valid positive amount required for top-up')
        operationDescription = description || `Staff top-up: €${amount}`
        if (notes) operationDescription += ` — ${notes}`

        wallet = await prismaUnfiltered.$transaction(async (tx) => {
          return topUpWallet(tx, id, amount, operationDescription, reference, referenceType || 'staff_topup')
        })
        break
      }

      case 'credit': {
        if (!amount || amount <= 0) return apiError('Valid positive amount required for credit')
        operationDescription = description || `Staff credit: €${amount}`
        if (notes) operationDescription += ` — ${notes}`

        wallet = await prismaUnfiltered.$transaction(async (tx) => {
          return adjustWallet(tx, id, amount, operationDescription, reference, referenceType || 'staff_credit', staff.id)
        })
        break
      }

      case 'debit': {
        if (!amount || amount <= 0) return apiError('Valid positive amount required for debit')
        if (!description && !notes) return apiError('Description or notes required for debit operations')
        operationDescription = description || `Staff debit: €${amount}`
        if (notes) operationDescription += ` — ${notes}`

        wallet = await prismaUnfiltered.$transaction(async (tx) => {
          return adjustWallet(tx, id, -amount, operationDescription, reference, referenceType || 'staff_debit', staff.id)
        })
        break
      }

      case 'adjustment': {
        if (amount === undefined || amount === null) return apiError('Amount required for adjustment (positive=credit, negative=debit)')
        if (!description && !notes) return apiError('Description or notes required for adjustments')
        operationDescription = description || `Staff adjustment: €${amount}`
        if (notes) operationDescription += ` — ${notes}`

        wallet = await prismaUnfiltered.$transaction(async (tx) => {
          return adjustWallet(tx, id, amount, operationDescription, reference, referenceType || 'staff_adjustment', staff.id)
        })
        break
      }

      case 'set_balance': {
        if (targetBalance === undefined || targetBalance === null || targetBalance < 0) {
          return apiError('Valid non-negative targetBalance required')
        }
        if (!description && !notes) return apiError('Description or notes required for balance override')
        operationDescription = description || `Staff set balance to €${targetBalance}`
        if (notes) operationDescription += ` — ${notes}`

        wallet = await prismaUnfiltered.$transaction(async (tx) => {
          return setWalletBalance(tx, id, targetBalance, operationDescription, reference, referenceType || 'staff_set_balance', staff.id)
        })
        break
      }

      default:
        return apiError(`Unknown action: ${action}. Use top_up, credit, debit, adjustment, or set_balance.`)
    }

    // If proof of payment URL was provided, create a payment record
    if (proofUrl) {
      await prismaUnfiltered.payment.create({
        data: {
          userId: id,
          amount: Math.abs(amount || targetBalance || 0),
          currency: 'EUR',
          paymentMethod: 'STAFF_IMPORT',
          status: 'COMPLETED',
          proofUrl,
          proofUploadedAt: new Date(),
          referenceType: referenceType || `staff_wallet_${action}`,
          referenceId: reference,
          approvedAt: new Date(),
          approvedBy: staff.id,
          notes: operationDescription,
        },
      })
    }

    await createAuditLog({
      action: AuditAction.WALLET_TOP_UP,
      entity: 'Wallet',
      entityId: wallet.id,
      userId: staff.id,
      description: operationDescription,
      changes: {
        targetUserId: id,
        action,
        amount: amount || targetBalance,
        reference,
        proofUrl: proofUrl || null,
        notes,
      },
    })

    // Notify the student about the wallet adjustment
    const actionLabels: Record<string, string> = {
      top_up: 'Top-Up',
      credit: 'Credit',
      debit: 'Debit',
      adjustment: 'Adjustment',
      set_balance: 'Balance Update',
    }
    const actionLabel = actionLabels[action] || 'Update'
    const adjustmentAmount = amount || targetBalance || 0

    await prismaUnfiltered.notification.create({
      data: {
        userId: id,
        title: `Wallet ${actionLabel}`,
        message: operationDescription,
        type: 'WALLET_ADJUSTMENT',
        linkUrl: '/student/wallet',
        linkText: 'View Wallet',
      },
    })

    return apiSuccess(serializePrisma({
      message: operationDescription,
      wallet: {
        id: wallet.id,
        balance: wallet.balance,
        reservedBalance: wallet.reservedBalance,
        availableBalance: wallet.availableBalance,
        currency: wallet.currency,
      },
    }))
  }
)
