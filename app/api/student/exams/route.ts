import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStudent } from '@/lib/auth/helpers'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async (_req: NextRequest) => {
  const user = await requireStudent()
  const bookings = await prismaUnfiltered.examBooking.findMany({
    where: { userId: user.id },
    include: {
      exam: {
        include: {
          examComponent: { include: { course: { select: { code: true, name: true } } } },
        },
      },
      examComponent: { include: { course: { select: { code: true, name: true } } } },
    },
    orderBy: { bookedAt: 'desc' },
    take: 100,
  })
  return apiSuccess(bookings)
})
