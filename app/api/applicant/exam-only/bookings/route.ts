import { NextResponse } from 'next/server'
import { requireApplicant } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async () => {
  const user = await requireApplicant()

  const bookings = await prismaUnfiltered.examBooking.findMany({
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
    take: 100,
  })

  return NextResponse.json(
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
    }))
  )
})
