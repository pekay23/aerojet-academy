import { NextRequest } from 'next/server'
import { requireApplicant } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { withErrorHandler, apiPaginated, parsePagination } from '@/lib/api/response'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireApplicant()
  const { page, limit, skip } = parsePagination(new URL(req.url).searchParams)

  const [bookings, total] = await Promise.all([
    prismaUnfiltered.examBooking.findMany({
      where: {
        userId: user.id,
        bookingType: 'INDIVIDUAL',
      },
      include: {
        examComponent: {
          include: {
            course: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip,
    }),
    prismaUnfiltered.examBooking.count({
      where: {
        userId: user.id,
        bookingType: 'INDIVIDUAL',
      },
    }),
  ])

  return apiPaginated(
    bookings.map((b) => ({
      id: b.id,
      status: b.status,
      amountPaid: Number(b.amountPaid),
      examDate: b.examDate?.toISOString() || null,
      examComponent: b.examComponent
        ? {
            course: {
              code: b.examComponent.course.code,
              name: b.examComponent.course.name,
            },
          }
        : undefined,
    })),
    total,
    page,
    limit,
  )
})
