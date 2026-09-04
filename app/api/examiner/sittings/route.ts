import { NextRequest } from 'next/server'
import { requireExaminer } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { apiPaginated, apiError, withErrorHandler } from '@/lib/api/response'
import { parsePagination } from '@/lib/api/response'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireExaminer()
  const { searchParams } = new URL(req.url)
  const { page, limit, skip } = parsePagination(searchParams)

  const examiner = await prismaUnfiltered.examiner.findUnique({
    where: { userId: user.id },
    select: { id: true },
  })
  if (!examiner) return apiError('Examiner profile not found', 404)

  const [sittings, total] = await Promise.all([
    prismaUnfiltered.examSitting.findMany({
      where: { examinerId: examiner.id },
      include: {
        event: { select: { name: true } },
        examComponent: { select: { code: true, name: true } },
      },
      orderBy: { startTime: 'desc' },
      skip,
      take: limit,
    }),
    prismaUnfiltered.examSitting.count({ where: { examinerId: examiner.id } }),
  ])

  return apiPaginated(sittings, total, page, limit)
})
