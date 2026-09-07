import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'

export const PATCH = withErrorHandler(async (_req: NextRequest, ctx) => {
  await requireStaff()
  const id = (await ctx!.params).id
  if (!id) return apiError('Missing payment method ID')

  const existing = await prismaUnfiltered.paymentMethod.findUnique({ where: { id } })
  if (!existing) return apiNotFound('Payment method not found')

  const method = await prismaUnfiltered.paymentMethod.update({
    where: { id },
    data: { isActive: !existing.isActive },
  })

  return apiSuccess(method)
})
