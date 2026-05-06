import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'

export const PUT = withErrorHandler(async (req: NextRequest, ctx) => {
  await requireStaff()
  const id = ctx?.params?.id
  if (!id) return apiError('Missing payment method ID')

  const existing = await prismaUnfiltered.paymentMethod.findUnique({ where: { id } })
  if (!existing) return apiNotFound('Payment method not found')

  const body = await req.json()
  const { type, label, currency, isActive, bankName, bankAccountName, bankAccountNumber, bankSwiftCode, bankBranch, momoProvider, momoNumber, momoMerchantCode, momoAccountName, stripeAccountId } = body

  const method = await prismaUnfiltered.paymentMethod.update({
    where: { id },
    data: {
      type: type ?? existing.type,
      label: label ?? existing.label,
      currency: currency ?? existing.currency,
      isActive: isActive ?? existing.isActive,
      bankName: bankName !== undefined ? bankName : existing.bankName,
      bankAccountName: bankAccountName !== undefined ? bankAccountName : existing.bankAccountName,
      bankAccountNumber: bankAccountNumber !== undefined ? bankAccountNumber : existing.bankAccountNumber,
      bankSwiftCode: bankSwiftCode !== undefined ? bankSwiftCode : existing.bankSwiftCode,
      bankBranch: bankBranch !== undefined ? bankBranch : existing.bankBranch,
      momoProvider: momoProvider !== undefined ? momoProvider : existing.momoProvider,
      momoNumber: momoNumber !== undefined ? momoNumber : existing.momoNumber,
      momoMerchantCode: momoMerchantCode !== undefined ? momoMerchantCode : existing.momoMerchantCode,
      momoAccountName: momoAccountName !== undefined ? momoAccountName : existing.momoAccountName,
      stripeAccountId: stripeAccountId !== undefined ? stripeAccountId : existing.stripeAccountId,
    },
  })

  return apiSuccess(method)
})

export const DELETE = withErrorHandler(async (_req: NextRequest, ctx) => {
  await requireStaff()
  const id = ctx?.params?.id
  if (!id) return apiError('Missing payment method ID')

  const existing = await prismaUnfiltered.paymentMethod.findUnique({ where: { id } })
  if (!existing) return apiNotFound('Payment method not found')

  await prismaUnfiltered.paymentMethod.delete({ where: { id } })
  return apiSuccess({ deleted: true })
})
