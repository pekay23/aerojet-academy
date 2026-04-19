import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { serializePrisma } from '@/lib/utils/serialization'

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()

  const payments = await prisma.payment.findMany({
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
  })

  return apiSuccess({ payments: serializePrisma(payments) })
})
