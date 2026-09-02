import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStudent } from '@/lib/auth/helpers'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireStudent()
  const bookings = await prismaUnfiltered.poolMembership.findMany({
    where: { userId: user.id },
    include: { pool: { include: { event: { select: { name: true, startDate: true } } } } },
    orderBy: { createdAt: 'desc' },
  })
  return apiSuccess(bookings)
})

