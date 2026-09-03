import { Metadata } from 'next'
import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import ManifestPreview from '../_components/ManifestPreview'

export const metadata: Metadata = { title: 'Exam Manifest | Staff Portal' }
export const dynamic = 'force-dynamic'

export default async function ExamManifestPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  await requireStaff()
  const { eventId } = await params

  const event = await prismaUnfiltered.examEvent.findUnique({
    where: { id: eventId },
    include: {
      sittings: {
        include: {
          examComponent: {
            include: {
              course: { select: { code: true } },
            },
          },
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

  if (!event) return notFound()

  const sittings = event.sittings.map((s) => ({
    id: s.id,
    dayNumber: s.dayNumber,
    sessionType: s.sessionType,
    startTime: s.startTime.toISOString(),
    capacity: s.capacity,
    status: s.status,
    examComponent: {
      course: s.examComponent.course ? { code: s.examComponent.course.code } : undefined,
      code: s.examComponent.code,
    },
    assignments: s.assignments.map((a) => ({
      id: a.id,
      userId: a.userId,
      seatId: a.seatId,
      attendanceStatus: a.attendanceStatus ?? '',
      user: {
        profile: a.user.profile,
        email: a.user.email,
      },
    })),
  }))

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-aerojet-blue text-3xl font-black tracking-tight dark:text-white">
            Exam Manifest
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {event.name} · {format(new Date(event.startDate), 'dd MMM yyyy')}
          </p>
        </div>
      </div>
      <ManifestPreview sittings={sittings} />
    </div>
  )
}
