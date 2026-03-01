import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import {
  ClipboardCheck,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Award,
  FileBarChart2,
} from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import ResitBookingButton from './_components/ResitBookingButton'
import ExamsTabs from './_components/ExamsTabs'

export const metadata: Metadata = { title: 'My Exams | Student Portal' }
export const dynamic = 'force-dynamic'

export default async function ExamsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab: tabParam } = await searchParams
  const tab = tabParam || 'bookings'

  const session = await getAuthSession()

  const [bookings, results] = await Promise.all([
    prisma.examBooking.findMany({
      where: { userId: session.user.id },
      include: {
        exam: { include: { examComponent: { include: { course: true } } } },
        event: true,
      },
      orderBy: { bookedAt: 'desc' },
    }),
    prisma.examResult.findMany({
      where: { userId: session.user.id },
      include: {
        exam: { include: { examComponent: { include: { course: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const upcomingExams = bookings.filter((b) => b.status === 'APPROVED' || b.status === 'COMPLETED')
  const pendingExams = bookings.filter((b) => b.status === 'PENDING')

  return (
    <ExamsTabs>
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Upcoming',
            value: upcomingExams.length,
            icon: Calendar,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'Pending Payment',
            value: pendingExams.length,
            icon: Clock,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
          {
            label: 'Total Results',
            value: results.length,
            icon: ClipboardCheck,
            color: 'text-green-600',
            bg: 'bg-green-50',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}
              >
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                  {stat.label}
                </p>
                <p className="text-xl font-black text-slate-900 dark:text-slate-100">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bookings Tab ── */}
      {tab === 'bookings' && (
        <>
          {/* Upcoming Schedule Cards */}
          {bookings.filter(
            (b) =>
              (b.status === 'APPROVED' || b.status === 'PENDING') &&
              b.examDate &&
              b.examDate >= new Date()
          ).length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {bookings
                .filter(
                  (b) =>
                    (b.status === 'APPROVED' || b.status === 'PENDING') &&
                    b.examDate &&
                    b.examDate >= new Date()
                )
                .sort((a, b) => (a.examDate?.getTime() || 0) - (b.examDate?.getTime() || 0))
                .map((booking) => (
                  <div
                    key={booking.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div>
                      <div className="mb-4 flex items-start justify-between">
                        {booking.exam?.examComponent?.course?.code && (
                          <div className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold tracking-wide text-blue-600 uppercase">
                            {booking.exam.examComponent.course.code}
                          </div>
                        )}
                        {booking.status === 'PENDING' && (
                          <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 uppercase">
                            <AlertCircle className="h-3 w-3" /> Pending
                          </div>
                        )}
                      </div>
                      <h3 className="mb-1 text-lg font-bold text-slate-900 dark:text-slate-100">
                        {booking.exam?.examComponent?.course?.name || 'Unknown Course'}
                      </h3>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {booking.exam?.name || 'Individual Exam'}
                      </p>
                    </div>
                    <div className="mt-6 space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
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

          {/* All Bookings Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
              <h2 className="font-bold text-slate-900 dark:text-slate-100">All Bookings</h2>
            </div>
            {bookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-bold tracking-widest text-slate-400 uppercase dark:border-slate-800">
                      <th className="px-6 py-4">Exam / Module</th>
                      <th className="px-6 py-4">Event</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {bookings.map((booking) => (
                      <tr
                        key={booking.id}
                        className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {booking.exam?.examComponent?.course?.name || booking.moduleCode}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {booking.bookingType}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                          {booking.event?.name || 'Individual Booking'}
                        </td>
                        <td className="px-6 py-4 font-medium whitespace-nowrap text-slate-600 dark:text-slate-400">
                          {booking.examDate ? booking.examDate.toLocaleDateString() : 'TBD'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${booking.status === 'COMPLETED' || booking.status === 'APPROVED' ? 'bg-green-50 text-green-600' : booking.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}
                          >
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 italic dark:text-slate-400">
                No bookings found.
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Results Tab ── */}
      {tab === 'results' && (
        <>
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50">
                <FileBarChart2 className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                No Results Available
              </h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                You haven&apos;t taken any exams yet, or your results are pending publication.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div>
                    <div className="mb-4 flex items-start justify-between">
                      <div className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold tracking-wide text-blue-600 uppercase">
                        {result.exam.examComponent?.course?.code || '—'}
                      </div>
                      {result.passed ? (
                        <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 uppercase">
                          <CheckCircle2 className="h-3 w-3" /> Passed
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 uppercase">
                          <XCircle className="h-3 w-3" /> Failed
                        </div>
                      )}
                    </div>
                    <h3 className="mb-1 text-lg font-bold text-slate-900 dark:text-slate-100">
                      {result.exam.examComponent?.course?.name || 'Unknown'}
                    </h3>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {result.exam.name}
                    </p>
                  </div>
                  <div className="mt-6 space-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Score</p>
                        <p className="text-xl font-black text-slate-900 dark:text-slate-100">
                          {Number(result.score)} / {Number(result.maxScore)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Grade</p>
                        <p
                          className={`text-xl font-black ${result.passed ? 'text-emerald-600' : 'text-red-600'}`}
                        >
                          {result.grade || '-'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        {result.createdAt.toLocaleDateString()}
                      </span>
                      {!result.passed && (
                        <ResitBookingButton examId={result.examId} examName={result.exam.name} />
                      )}
                    </div>
                    {result.certificateUrl && (
                      <a
                        href={result.certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2 text-xs font-bold text-white uppercase transition-colors hover:bg-slate-800"
                      >
                        <Award className="h-4 w-4" /> Download Certificate
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </ExamsTabs>
  )
}
