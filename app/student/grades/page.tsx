import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Award, FileText, TrendingUp } from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import {
  canAccessFeature,
  getEnrollmentMilestoneStatus,
  getStudentPaymentAccessLevel,
  getStudentStatus,
} from '@/lib/access-control'
import { PaymentRequiredBanner } from '../_components/PaymentRequiredBanner'
import GradesTable from './_components/GradesTable'

export const metadata: Metadata = {
  title: 'Grades | Student Portal',
  description: 'View your academic grades and assessment results.',
}

export default async function GradesPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const { isFullTime, isExamOnly, _isModular } = await getStudentStatus(session.user.id)

  // Exam-only students have no enrollment grades — redirect to transcript
  if (isExamOnly) {
    redirect('/student/transcript')
  }

  const hasAccess = await canAccessFeature(session.user.id, 'courses')

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
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-blue-800 dark:text-white">
            My Grades
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            View your assessment results and academic progress.
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

  const grades = await prisma.grade.findMany({
    where: { userId: session.user.id },
    include: {
      enrollment: {
        include: { course: true },
      },
    },
    orderBy: { assessmentDate: 'desc' },
    take: 100,
  })

  // Calculate Average Score
  const averageScore =
    grades.length > 0
      ? Math.round(grades.reduce((acc, g) => acc + Number(g.percentage), 0) / grades.length)
      : 0

  // Serialize for client component
  const serializedGrades = grades.map((g) => ({
    id: g.id,
    assessmentName: g.assessmentName,
    assessmentType: g.assessmentType,
    percentage: g.percentage.toString(),
    score: g.score.toString(),
    maxScore: g.maxScore.toString(),
    grade: g.grade,
    assessmentDate: g.assessmentDate.toISOString(),
    enrollment: {
      course: {
        name: g.enrollment.course.name,
        code: g.enrollment.course.code,
      },
    },
  }))

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-blue-800 dark:text-white">
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

      <GradesTable grades={serializedGrades} />
    </div>
  )
}

