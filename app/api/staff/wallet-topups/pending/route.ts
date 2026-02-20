import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiPaginated, withErrorHandler } from '@/lib/api/response'
import { parsePagination } from '@/lib/api/response'

// GET /api/staff/wallet-topups/pending
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()
  const { searchParams } = new URL(req.url)
  const { page, limit, skip } = parsePagination(searchParams)

  const where = { type: 'WALLET_TOP_UP' as const, status: 'PENDING' as const }

  const [topups, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        user: {
          include: {
            profile: { select: { firstName: true, lastName: true } },
            studentProfile: { select: { studentId: true } },
            wallet: { select: { balance: true, availableBalance: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
    }),
    prisma.payment.count({ where }),
  ])

  return apiPaginated(topups, total, page, limit)
})

