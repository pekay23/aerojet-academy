import { NextRequest } from 'next/server'
import { requireExaminer } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async (_req: NextRequest) => {
  const user = await requireExaminer()
  const examiner = await prismaUnfiltered.examiner.findUnique({
    where: { userId: user.id },
    include: {
      user: {
        include: {
          profile: { select: { firstName: true, lastName: true } },
        },
      },
    },
  })

  if (!examiner) return apiError('Examiner profile not found', 404)

  const [completedSittings, upcomingSittings] = await Promise.all([
    prismaUnfiltered.examSitting.count({
      where: { examinerId: examiner.id, status: 'COMPLETED' },
    }),
    prismaUnfiltered.examSitting.count({
      where: {
        examinerId: examiner.id,
        status: { in: ['DRAFT', 'OPEN', 'SCHEDULED', 'CONFIRMED'] },
        startTime: { gte: new Date() },
      },
    }),
  ])

  const fullName = examiner.user.profile
    ? `${examiner.user.profile.firstName} ${examiner.user.profile.lastName}`
    : examiner.user.email

  return apiSuccess({
    id: examiner.id,
    fullName,
    isActive: examiner.isActive,
    maxParallelSittings: examiner.maxParallelSittings,
    createdAt: examiner.createdAt,
    notes: examiner.notes,
    completedSittings,
    upcomingSittings,
  })
})
