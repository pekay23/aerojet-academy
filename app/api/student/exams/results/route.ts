import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStudent } from '@/lib/auth/helpers'
import { apiSuccess, withErrorHandler, parsePagination } from '@/lib/api/response'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireStudent()
  const searchParams = req.nextUrl.searchParams
  const { page, limit, skip } = parsePagination(searchParams)

  const where = { userId: user.id }

  const [results, total] = await Promise.all([
    prisma.examResult.findMany({
      where,
      include: {
        exam: {
          include: { examComponent: { include: { course: { select: { code: true, name: true } } } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.examResult.count({ where }),
  ])

  return apiSuccess({
    data: results,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
})
