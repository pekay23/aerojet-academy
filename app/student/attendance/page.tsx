import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Calendar, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import { canAccessFeature, getEnrollmentMilestoneStatus } from '@/lib/access-control'
import { PaymentRequiredBanner } from '../_components/PaymentRequiredBanner'

export const metadata: Metadata = { title: 'Attendance | Student Portal' }

export default async function AttendancePage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { enrollmentType: true },
  })

  const isFullTime = studentProfile?.enrollmentType === 'FULL_TIME'
  const hasAccess = await canAccessFeature(session.user.id, 'classes')

  if (isFullTime && !hasAccess) {
    const [milestoneStatus, wallet] = await Promise.all([
      getEnrollmentMilestoneStatus(session.user.id),
      prisma.wallet.findUnique({
        where: { userId: session.user.id },
        select: { availableBalance: true, reservedBalance: true, currency: true },
      }),
    ])

    const walletBalance = {
      available: Number(wallet?.availableBalance ?? 0),
      held: Number(wallet?.reservedBalance ?? 0),
      currency: wallet?.currency ?? 'EUR',
    }

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
            Attendance
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track your class attendance and participation.
          </p>
        </div>

        <PaymentRequiredBanner
          accessLevel="SEAT_ONLY"
          milestoneStatus={milestoneStatus}
          walletBalance={walletBalance}
        />
      </div>
    )
  }

  const attendanceRecords = await prisma.attendanceRecord.findMany({
    where: { userId: session.user.id },
    include: {
      class: {
        include: { course: true },
      },
    },
    orderBy: { date: 'desc' },
  })

  const stats = {
    total: attendanceRecords.length,
    present: attendanceRecords.filter((r) => r.status === 'PRESENT').length,
    late: attendanceRecords.filter((r) => r.status === 'LATE').length,
    absent: attendanceRecords.filter((r) => r.status === 'ABSENT').length,
    excused: attendanceRecords.filter((r) => r.status === 'EXCUSED').length,
  }

  const attendanceRate =
    stats.total > 0 ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
          Attendance
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Track your class attendance and punctuality.
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Attendance Rate',
            value: `${attendanceRate}%`,
            icon: Calendar,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'Present',
            value: stats.present,
            icon: CheckCircle2,
            color: 'text-green-600',
            bg: 'bg-green-50',
          },
          {
            label: 'Late',
            value: stats.late,
            icon: Clock,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
          {
            label: 'Absent',
            value: stats.absent,
            icon: XCircle,
            color: 'text-red-600',
            bg: 'bg-red-50',
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

      {/* Attendance Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <h2 className="font-bold text-slate-900 dark:text-slate-100">Attendance History</h2>
        </div>

        {attendanceRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold tracking-widest text-slate-400 uppercase dark:border-slate-800">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Class / Module</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {attendanceRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="transition-colors hover:bg-slate-50 dark:bg-slate-800/50"
                  >
                    <td className="px-6 py-4 font-medium whitespace-nowrap text-slate-900 dark:text-slate-100">
                      {record.date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {record.class.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {record.class.course.code}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          record.status === 'PRESENT'
                            ? 'bg-green-50 text-green-600'
                            : record.status === 'LATE'
                              ? 'bg-amber-50 text-amber-600'
                              : record.status === 'ABSENT'
                                ? 'bg-red-50 text-red-600'
                                : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {record.status === 'LATE' && <Clock className="h-3 w-3" />}
                        {record.status}
                        {record.minutesLate && ` (${record.minutesLate}m)`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {record.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300 dark:bg-slate-800/50">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              No records found
            </h3>
            <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500 dark:text-slate-400">
              You don&apos;t have any attendance records yet. They will appear here once marked by
              your instructors.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
