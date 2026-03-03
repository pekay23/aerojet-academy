import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'

export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    const bookings = await prisma.examBooking.findMany({
      where: {
        userId,
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
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
