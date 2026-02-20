import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStudent } from '@/lib/auth/helpers'
import { apiSuccess, apiNotFound, withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
  const user = await requireStudent()
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: ctx?.params?.id! } },
    include: { course: true, grades: { orderBy: { createdAt: 'desc' } } },
  })
  if (!enrollment) return apiNotFound('Enrollment not found')
  return apiSuccess(enrollment)
})
