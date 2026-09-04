import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { apiError, withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const _staff = await requireStaff()
  const { eventId } = ctx.params
  const format = req.nextUrl.searchParams.get('format') || 'csv'

  const event = await prismaUnfiltered.examEvent.findUnique({
    where: { id: eventId },
    include: {
      sittings: {
        include: {
          examComponent: true,
          assignments: {
            include: {
              user: {
                select: {
                  profile: { select: { firstName: true, lastName: true } },
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!event) return apiError('Event not found', 404)

  if (format === 'csv') {
    const rows = [
      ['Candidate Name', 'Email', 'Sitting', 'Component', 'Day', 'Session', 'Venue', 'Seat', 'Attendance'].join(','),
    ]

    for (const sitting of event.sittings) {
      for (const assignment of sitting.assignments) {
        const name = assignment.user.profile
          ? `${assignment.user.profile.firstName} ${assignment.user.profile.lastName}`
          : assignment.user.email
        rows.push([
          `"${name}"`,
          assignment.user.email,
          sitting.sessionType,
          sitting.examComponent.code,
          sitting.dayNumber,
          sitting.startTime.toISOString(),
          sitting.venue || '',
          assignment.seatId || '',
          assignment.attendanceStatus,
        ].join(','))
      }
    }

    const csv = rows.join('\n')
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="manifest-${eventId}.csv"`,
      },
    })
  }

  return apiError('Unsupported format', 400)
})
