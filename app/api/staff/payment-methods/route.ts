import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiCreated, apiError, withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async () => {
  await requireStaff()
  const methods = await prisma.paymentMethod.findMany({
    orderBy: { sortOrder: 'asc' },
  })
  return apiSuccess(methods)
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()
  const body = await req.json()

  const { type, label, currency, isActive, bankName, bankAccountName, bankAccountNumber, bankSwiftCode, bankBranch, momoProvider, momoNumber, momoMerchantCode, momoAccountName, stripeAccountId } = body

  if (!type || !label || !currency) {
    return apiError('type, label, and currency are required')
  }

  if (!['BANK_TRANSFER', 'MOBILE_MONEY', 'CARD_STRIPE'].includes(type)) {
    return apiError('Invalid type. Must be BANK_TRANSFER, MOBILE_MONEY, or CARD_STRIPE')
  }

  // Get the next sort order
  const maxSort = await prisma.paymentMethod.aggregate({ _max: { sortOrder: true } })
  const nextSort = (maxSort._max.sortOrder ?? -1) + 1

  const method = await prisma.paymentMethod.create({
    data: {
      type,
      label,
      currency,
      isActive: isActive ?? true,
      sortOrder: nextSort,
      bankName: type === 'BANK_TRANSFER' ? bankName : null,
      bankAccountName: type === 'BANK_TRANSFER' ? bankAccountName : null,
      bankAccountNumber: type === 'BANK_TRANSFER' ? bankAccountNumber : null,
      bankSwiftCode: type === 'BANK_TRANSFER' ? bankSwiftCode : null,
      bankBranch: type === 'BANK_TRANSFER' ? bankBranch : null,
      momoProvider: type === 'MOBILE_MONEY' ? momoProvider : null,
      momoNumber: type === 'MOBILE_MONEY' ? momoNumber : null,
      momoMerchantCode: type === 'MOBILE_MONEY' ? momoMerchantCode : null,
      momoAccountName: type === 'MOBILE_MONEY' ? momoAccountName : null,
      stripeAccountId: type === 'CARD_STRIPE' ? stripeAccountId : null,
    },
  })

  return apiCreated(method)
})
