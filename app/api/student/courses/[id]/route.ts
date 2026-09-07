import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStudent } from '@/lib/auth/helpers'
import { apiSuccess, apiNotFound, withErrorHandler , RouteContext } from '@/lib/api/response'

export const GET = withErrorHandler(async (req: NextRequest, ctx?: RouteContext) => {
  const user = await requireStudent()
  const enrollment = await prismaUnfiltered.enrollment.findFirst({
    where: { userId: user.id, courseId: (await ctx!.params).id! },
    include: { course: true, grades: { orderBy: { createdAt: 'desc' } } },
  })
  if (!enrollment) return apiNotFound('Enrollment not found')
  return apiSuccess(enrollment)
})
