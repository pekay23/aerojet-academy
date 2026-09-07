import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireApplicant } from '@/lib/auth/helpers'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async (_req: NextRequest) => {
  const user = await requireApplicant()
  const [applicant, availableCourses] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      include: {
        profile: true,
        enrollments: { include: { course: { select: { code: true, name: true, price: true } } } },
      },
    }),
    prisma.course.findMany({ where: { isActive: true }, orderBy: { code: 'asc' }, take: 50 }),
  ])
  const { password: _password, ...safe } = applicant!
  return apiSuccess({ user: safe, availableCourses })
})
