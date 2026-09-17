import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { serializePrisma } from '@/lib/utils/serialization'

export const GET = withErrorHandler(async (_req: NextRequest) => {
  await requireStaff()

  const payments = await prismaUnfiltered.payment.findMany({
    where: {
      status: 'APPROVED',
      reconciled: false,
    },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
    },
    orderBy: {
      approvedAt: 'desc',
    },
    take: 200,
  })

  return apiSuccess({ payments: serializePrisma(payments) })
})
