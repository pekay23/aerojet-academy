import { redirectToLogin } from '@/lib/auth/redirect-to-login'
import { Metadata } from 'next'
import { Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import {
  canAccessFeature,
  getEnrollmentMilestoneStatus,
  getStudentPaymentAccessLevel,
  getStudentStatus,
} from '@/lib/access-control'
import { PaymentRequiredBanner } from '../_components/PaymentRequiredBanner'
import AttendanceTable from './_components/AttendanceTable'

export const metadata: Metadata = {
  title: 'Attendance Registry | Student Portal',
  description: 'Track your class and exam attendance records.',
}

export default async function AttendancePage() {
  const session = await getAuthSession()
  if (!session) return await redirectToLogin()

  const { isFullTime } = await getStudentStatus(session.user.id)
  const hasAccess = await canAccessFeature(session.user.id, 'classes')

  if (isFullTime && !hasAccess) {
    const [milestoneStatus, wallet, accessLevel] = await Promise.all([
      getEnrollmentMilestoneStatus(session.user.id),
      prisma.wallet.findUnique({
        where: { userId: session.user.id },
        select: { availableBalance: true, reservedBalance: true, currency: true },
      }),
      getStudentPaymentAccessLevel(session.user.id),
    ])

    const walletBalance = {
      available: Number(wallet?.availableBalance ?? 0),
      held: Number(wallet?.reservedBalance ?? 0),
      currency: wallet?.currency ?? 'EUR',
    }

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-700">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-blue-800 dark:text-white">
            Attendance Registry
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track your class attendance and participation.
          </p>
        </div>

        <PaymentRequiredBanner
          accessLevel={accessLevel}
          milestoneStatus={milestoneStatus}
          walletBalance={walletBalance}
        />
      </div>
    )
  }

  const [classAttendance, examAttendance] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: { userId: session.user.id },
      include: {
        class: {
          include: { course: true },
        },
      },
      orderBy: { date: 'desc' },
      take: 200,
    }),
    prisma.examAttendance.findMany({
      where: { userId: session.user.id },
      include: {
        examComponent: { include: { course: true } },
        sitting: true,
      },
      orderBy: { attendanceDate: 'desc' },
      take: 100,
    }),
  ])

  // Merge and normalize records
  const allRecords = [
    ...classAttendance.map((r) => ({
      id: r.id,
      type: 'CLASS' as const,
      status: r.status,
      date: r.date.toISOString(),
      notes: r.notes,
      minutesLate: r.minutesLate,
      label: r.class.name,
      subLabel: r.class.course.code,
    })),
    ...examAttendance.map((r) => ({
      id: `exam_${r.id}`,
      type: 'EXAM' as const,
      status: r.status,
      date: r.attendanceDate.toISOString(),
      notes: r.notes,
      minutesLate: null,
      label: r.examComponent?.course?.name || r.examComponent?.code || 'Official Exam',
      subLabel: r.examComponent?.course?.code || 'EXAM',
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const stats = {
    total: allRecords.length,
    present: allRecords.filter((r) => r.status === 'PRESENT').length,
    late: allRecords.filter((r) => r.status === 'LATE').length,
    absent: allRecords.filter((r) => r.status === 'ABSENT').length,
    excused: allRecords.filter((r) => r.status === 'EXCUSED').length,
  }

  const attendanceRate =
    stats.total > 0 ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 0

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-700">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-blue-800 dark:text-white">
          Attendance Registry
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Comprehensive log of your participation in classes and exam sittings.
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Overall Attendance',
            value: `${attendanceRate}%`,
            icon: Calendar,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'Present',
            value: stats.present,
            icon: CheckCircle2,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            label: 'Punctual / Late',
            value: stats.late,
            icon: Clock,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
          {
            label: 'Absent',
            value: stats.absent,
            icon: XCircle,
            color: 'text-rose-600',
            bg: 'bg-rose-50',
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
                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
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

      <AttendanceTable records={allRecords} />
    </div>
  )
}
