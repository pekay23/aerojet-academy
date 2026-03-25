import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Calendar, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import { canAccessFeature, getEnrollmentMilestoneStatus, getStudentStatus } from '@/lib/access-control'
import { PaymentRequiredBanner } from '../_components/PaymentRequiredBanner'
import AttendanceTable from './_components/AttendanceTable'

export const metadata: Metadata = {
  title: 'Attendance | Student Portal',
  description: 'Track your class attendance records.',
}

export default async function AttendancePage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const { isFullTime, isExamOnly, isModular } = await getStudentStatus(session.user.id)
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
          <h1 className="text-2xl font-black tracking-tight text-aerojet-blue sm:text-3xl dark:text-white">
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
    take: 200,
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

  // Serialize records for client component
  const serializedRecords = attendanceRecords.map((r) => ({
    id: r.id,
    status: r.status,
    date: r.date.toISOString(),
    notes: r.notes,
    minutesLate: r.minutesLate,
    class: {
      name: r.class.name,
      course: { code: r.class.course.code },
    },
  }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-aerojet-blue sm:text-3xl dark:text-white">
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

      <AttendanceTable records={serializedRecords} />
    </div>
  )
}

