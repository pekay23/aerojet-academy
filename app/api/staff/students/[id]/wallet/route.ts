import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { topUpWallet, adjustWallet, setWalletBalance, getOrCreateWallet } from '@/lib/wallet/operations'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { TransactionType } from '@prisma/client'

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

    const wallet = await prisma.wallet.findUnique({
      where: { userId: id },
    })

    if (!wallet) return apiNotFound('Wallet not found')

    const where: any = { walletId: wallet.id }
    if (typeFilter) where.type = typeFilter

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.walletTransaction.count({ where }),
    ])

    // Get user info for context
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        email: true,
        personalEmail: true,
        academyEmail: true,
        profile: { select: { firstName: true, middleName: true, lastName: true } },
      },
    })

    return apiSuccess({
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
      transactions,
      meta: { total, limit, offset },
    })
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

        wallet = await prisma.$transaction(async (tx) => {
          return topUpWallet(tx, id, amount, operationDescription, reference, referenceType || 'staff_topup')
        })
        break
      }

      case 'credit': {
        if (!amount || amount <= 0) return apiError('Valid positive amount required for credit')
        operationDescription = description || `Staff credit: €${amount}`
        if (notes) operationDescription += ` — ${notes}`

        wallet = await prisma.$transaction(async (tx) => {
          return adjustWallet(tx, id, amount, operationDescription, reference, referenceType || 'staff_credit', staff.id)
        })
        break
      }

      case 'debit': {
        if (!amount || amount <= 0) return apiError('Valid positive amount required for debit')
        if (!description && !notes) return apiError('Description or notes required for debit operations')
        operationDescription = description || `Staff debit: €${amount}`
        if (notes) operationDescription += ` — ${notes}`

        wallet = await prisma.$transaction(async (tx) => {
          return adjustWallet(tx, id, -amount, operationDescription, reference, referenceType || 'staff_debit', staff.id)
        })
        break
      }

      case 'adjustment': {
        if (amount === undefined || amount === null) return apiError('Amount required for adjustment (positive=credit, negative=debit)')
        if (!description && !notes) return apiError('Description or notes required for adjustments')
        operationDescription = description || `Staff adjustment: €${amount}`
        if (notes) operationDescription += ` — ${notes}`

        wallet = await prisma.$transaction(async (tx) => {
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

        wallet = await prisma.$transaction(async (tx) => {
          return setWalletBalance(tx, id, targetBalance, operationDescription, reference, referenceType || 'staff_set_balance', staff.id)
        })
        break
      }

      default:
        return apiError(`Unknown action: ${action}. Use top_up, credit, debit, adjustment, or set_balance.`)
    }

    // If proof of payment URL was provided, create a payment record
    if (proofUrl) {
      await prisma.payment.create({
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

    return apiSuccess({
      message: operationDescription,
      wallet: {
        id: wallet.id,
        balance: wallet.balance,
        reservedBalance: wallet.reservedBalance,
        availableBalance: wallet.availableBalance,
        currency: wallet.currency,
      },
    })
  }
)
