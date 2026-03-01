import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'

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

  return apiSuccess({ payments })
})
