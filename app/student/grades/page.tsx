import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { GraduationCap, Award, FileText, TrendingUp, AlertCircle } from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import { canAccessFeature, getEnrollmentMilestoneStatus } from '@/lib/access-control'
import { PaymentRequiredBanner } from '../_components/PaymentRequiredBanner'

export const metadata: Metadata = { title: 'Grades | Student Portal' }

export default async function GradesPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { enrollmentType: true },
  })

  const isFullTime = studentProfile?.enrollmentType === 'FULL_TIME'
  const hasAccess = await canAccessFeature(session.user.id, 'courses')

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
            My Grades
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            View your assessment results and academic progress.
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

  const grades = await prisma.grade.findMany({
    where: { userId: session.user.id },
    include: {
      enrollment: {
        include: { course: true },
      },
    },
    orderBy: { assessmentDate: 'desc' },
  })

  // Calculate Average Score
  const averageScore =
    grades.length > 0
      ? Math.round(grades.reduce((acc, g) => acc + Number(g.percentage), 0) / grades.length)
      : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
          My Grades
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          View your assessment results and academic progress.
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            label: 'Average Score',
            value: `${averageScore}%`,
            icon: TrendingUp,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'Assessments',
            value: grades.length,
            icon: FileText,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
          },
          {
            label: 'Modules Completed',
            value: grades.filter((g) => g.grade && ['A', 'B', 'C'].includes(g.grade)).length,
            icon: Award,
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

      {/* Grades Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <h2 className="font-bold text-slate-900 dark:text-slate-100">Academic Records</h2>
        </div>

        {grades.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold tracking-widest text-slate-400 uppercase dark:border-slate-800">
                  <th className="px-6 py-4">Assessment</th>
                  <th className="px-6 py-4">Course / Module</th>
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4">Grade</th>
                  <th className="px-6 py-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {grades.map((grade) => (
                  <tr
                    key={grade.id}
                    className="transition-colors hover:bg-slate-50 dark:bg-slate-800/50"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {grade.assessmentName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {grade.assessmentType}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {grade.enrollment.course.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {grade.enrollment.course.code}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${Number(grade.percentage) >= 75 ? 'bg-green-500' : Number(grade.percentage) >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${grade.percentage}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {grade.percentage.toString()}%
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {grade.score.toString()} / {grade.maxScore.toString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black ${
                          grade.grade === 'A'
                            ? 'bg-green-50 text-green-600'
                            : grade.grade === 'B'
                              ? 'bg-blue-50 text-blue-600'
                              : grade.grade === 'C'
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {grade.grade || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium whitespace-nowrap text-slate-500 dark:text-slate-400">
                      {grade.assessmentDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300 dark:bg-slate-800/50">
              <GraduationCap className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              No grades found
            </h3>
            <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500 dark:text-slate-400">
              Your grades will appear here once your assessments are marked by the instructors.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
