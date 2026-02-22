import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Calendar, Clock, MapPin, AlertCircle } from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'

export const metadata: Metadata = { title: 'Exam Schedule | Student Portal' }
export const dynamic = 'force-dynamic'

export default async function ExamSchedulePage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const bookings = await prisma.examBooking.findMany({
    where: {
      userId: session.user.id,
      status: { in: ['APPROVED', 'PENDING'] },
      examDate: { gte: new Date() },
    },
    include: {
      exam: {
        include: { course: true },
      },
      event: true,
    },
    orderBy: { examDate: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Exam Schedule
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Your upcoming examination dates and locations.
        </p>
      </div>

      {bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50">
            <Calendar className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No Exams Scheduled</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            You don&apos;t have any upcoming exams scheduled at the moment.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all hover:shadow-md"
            >
              <div>
                <div className="mb-4 flex items-start justify-between">
                  <div className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-600">
                <h3 className="mb-1 text-lg font-bold text-slate-900 dark:text-slate-100">
                  {booking.exam?.course?.name || 'Unknown Course'}
                </h3>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {booking.exam?.name || 'Individual Exam'}
                </p>
              </div>

              <div className="mt-6 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>
                    {booking.examDate?.toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }) || 'Date Not Set'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span>
                    {booking.examDate
                      ? booking.examDate.toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'N/A'}
                    {booking.examDate && booking.exam && (
                      <>
                        {' - '}
                        {new Date(
                          booking.examDate.getTime() + booking.exam.duration * 60000
                        ).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </>
                    )}
                  </span>
                </div>
                {booking.event?.location && (
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span>{booking.event.location}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
