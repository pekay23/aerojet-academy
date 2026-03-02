import prisma from '@/lib/prisma/client'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async () => {
  const methods = await prisma.paymentMethod.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
  return apiSuccess(methods)
})
