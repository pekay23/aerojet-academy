import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff, rateLimitByUser, rateLimitByIP } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { serializePrisma } from '@/lib/utils/serialization'
import { parsePagination } from '@/lib/api/response'

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()

  // Rate limiting: 60 requests/min per user, 40 requests/min per IP (read-heavy)
  const userLimit = rateLimitByUser(req.headers.get('x-user-id') || 'unknown', 60, 60000)
  if (!userLimit.allowed) {
    return apiError('Too many requests. Please try again later.', 429)
  }
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const ipLimit = rateLimitByIP(ip, 40, 60000)
  if (!ipLimit.allowed) {
    return apiError('Too many requests from this IP. Please try again later.', 429)
  }

  const { page, limit, skip } = parsePagination(req.nextUrl.searchParams)

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
    take: limit,
    skip,
  })

  const total = await prismaUnfiltered.payment.count({
    where: {
      status: 'APPROVED',
      reconciled: false,
    },
  })

  return apiSuccess({
    payments: serializePrisma(payments),
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  })
})
