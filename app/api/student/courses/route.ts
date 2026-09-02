import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStudent } from '@/lib/auth/helpers'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireStudent()
  const enrollments = await prismaUnfiltered.enrollment.findMany({
    where: { userId: user.id },
    include: {
      course: true,
      grades: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return apiSuccess(enrollments)
})

