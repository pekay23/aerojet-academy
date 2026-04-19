import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiPaginated, withErrorHandler } from '@/lib/api/response'
import { parsePagination } from '@/lib/api/response'
import { serializePrisma } from '@/lib/utils/serialization'

// GET /api/staff/payments/pending
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()
  const { searchParams } = new URL(req.url)
  const { page, limit, skip } = parsePagination(searchParams)

  const where = { status: 'PENDING' as const }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        user: { include: { profile: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
    }),
    prisma.payment.count({ where }),
  ])

  return apiPaginated(serializePrisma(payments), total, page, limit)
})

