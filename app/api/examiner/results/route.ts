import { NextRequest } from 'next/server'
import { requireExaminer } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async (_req: NextRequest) => {
  const user = await requireExaminer()
  const examiner = await prismaUnfiltered.examiner.findUnique({
    where: { userId: user.id },
    select: { id: true },
  })
  if (!examiner) return apiError('Examiner profile not found', 404)

  const sittings = await prismaUnfiltered.examSitting.findMany({
    where: { examinerId: examiner.id },
    include: {
      event: { select: { name: true } },
      examComponent: { include: { course: { select: { code: true, name: true } } } },
      assignments: {
        include: {
          user: { select: { id: true, profile: { select: { firstName: true, lastName: true } } } },
          booking: { select: { moduleCode: true, examId: true } },
        },
      },
    },
    orderBy: { startTime: 'desc' },
  })

  const userIds = [...new Set(sittings.flatMap((s) => s.assignments.map((a) => a.userId)))]
  const existingResults = userIds.length
    ? await prismaUnfiltered.examResult.findMany({
        where: { userId: { in: userIds }, examCategory: 'OFFICIAL_EASA' },
        select: { userId: true, moduleCode: true, examId: true, score: true, passed: true },
      })
    : []

  return apiSuccess({ sittings, existingResults })
})

export const POST = withErrorHandler(async (_req: NextRequest) => {
  return apiError('Use the server action submitExaminerResults instead', 405)
})
