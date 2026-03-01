import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStudent } from '@/lib/auth/helpers'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireStudent()
  const passedExams = await prisma.examResult.findMany({
    where: { userId: user.id, passed: true },
    include: {
      exam: {
        include: { examComponent: { include: { course: { select: { code: true, name: true } } } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  return apiSuccess(passedExams)
})

