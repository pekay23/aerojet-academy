import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireApplicant } from '@/lib/auth/helpers'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireApplicant()
  const applicant = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      profile: true,
      enrollments: { include: { course: { select: { code: true, name: true, price: true } } } },
    },
  })
  const availableCourses = await prisma.course.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } })
  const { password, ...safe } = applicant!
  return apiSuccess({ user: safe, availableCourses })
})

