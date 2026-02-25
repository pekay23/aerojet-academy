import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { topUpWallet, getOrCreateWallet } from '@/lib/wallet/operations'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

// GET /api/staff/students/[id]/wallet — View student wallet
export const GET = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    await requireStaff()
    const id = context?.params?.id
    if (!id) return apiError('Student ID required')

    const wallet = await prisma.wallet.findUnique({
      where: { userId: id },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 50 } },
    })

    if (!wallet) return apiNotFound('Wallet not found')
    return apiSuccess(wallet)
  }
)

// POST /api/staff/students/[id]/wallet — Top up or adjust wallet
export const POST = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const staff = await requireStaff()
    const id = context?.params?.id
    if (!id) return apiError('Student ID required')

    const body = await req.json()
    const { amount, description, reference } = body

    if (!amount || amount <= 0) return apiError('Valid amount required')

    // Ensure wallet exists
    await getOrCreateWallet(id)

    const wallet = await prisma.$transaction(async (tx) => {
      return topUpWallet(tx, id, amount, description, reference)
    })

    await createAuditLog({
      action: AuditAction.WALLET_TOP_UP,
      entity: 'Wallet',
      entityId: wallet.id,
      userId: staff.id,
      details: { targetUserId: id, amount, description, reference },
    })

    return apiSuccess({ message: `Wallet topped up by €${amount}`, wallet })
  }
)
