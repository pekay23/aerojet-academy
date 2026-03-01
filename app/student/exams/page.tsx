import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import {
  FileText,
  ClipboardCheck,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import ResitBookingButton from './_components/ResitBookingButton'

export const metadata: Metadata = { title: 'My Exams | Student Portal' }

export default async function ExamsPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
          My Exams
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Track your exam bookings, schedules, and results.
        </p>
      </div>

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

      {/* Upcoming/Pending Bookings */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <h2 className="font-bold text-slate-900 dark:text-slate-100">Exam Bookings</h2>
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
              <tbody className="divide-y divide-slate-50">
                {bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="transition-colors hover:bg-slate-50 dark:bg-slate-800/50"
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
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          booking.status === 'COMPLETED' || booking.status === 'APPROVED'
                            ? 'bg-green-50 text-green-600'
                            : booking.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-red-50 text-red-600'
                        }`}
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

      {/* Exam Results */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <h2 className="font-bold text-slate-900 dark:text-slate-100">Exam Results</h2>
        </div>

        {results.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold tracking-widest text-slate-400 uppercase dark:border-slate-800">
                  <th className="px-6 py-4">Exam / Module</th>
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4">Grade</th>
                  <th className="px-6 py-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {results.map((result) => (
                  <tr
                    key={result.id}
                    className="transition-colors hover:bg-slate-50 dark:bg-slate-800/50"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {result.exam.examComponent.course.name}
                      </div>
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {result.exam.examComponent.course.code}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-black ${result.passed ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {result.percentage.toString()}%
                        </span>
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${result.passed ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${result.percentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black ${
                          result.passed ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {result.grade || (result.passed ? 'P' : 'F')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col items-end gap-2">
                        <span>{result.createdAt.toLocaleDateString()}</span>
                        {!result.passed && (
                          <ResitBookingButton examId={result.examId} examName={result.exam.name} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center font-medium text-slate-500 italic dark:text-slate-400">
            No results available yet.
          </div>
        )}
      </div>
    </div>
  )
}
