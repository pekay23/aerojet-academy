import { Metadata } from 'next'
import { GraduationCap, Users, CheckCircle2, BarChart3 } from 'lucide-react'

import { requireInstructor } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { getInstructorProfileByUserId } from '@/lib/instructor/profile'

export const metadata: Metadata = { title: 'My Metrics | Instructor Portal' }
export const dynamic = 'force-dynamic'

export default async function InstructorMetricsPage() {
  const user = await requireInstructor()
  const profile = await getInstructorProfileByUserId(user.id)

  const classes = profile
    ? await prismaUnfiltered.class.findMany({
        where: { instructorId: profile.id },
        select: { id: true, courseId: true },
      })
    : []
  const courseIds = [...new Set(classes.map((c) => c.courseId))]

  const [enrollments, grades] = await Promise.all([
    courseIds.length
      ? prismaUnfiltered.enrollment.count({
          where: { courseId: { in: courseIds }, status: { in: ['ENROLLED', 'ACTIVE', 'APPROVED', 'GRADUATED'] } },
        })
      : Promise.resolve(0),
    profile
      ? prismaUnfiltered.grade.findMany({
          where: { gradedBy: profile.id, deletedAt: null },
          select: { percentage: true },
        })
      : Promise.resolve([]),
  ])

  const gradeCount = grades.length
  const avgGrade =
    gradeCount > 0
      ? Math.round(
          grades.reduce((s, g) => s + Number(g.percentage), 0) / gradeCount
        )
      : null
  const passRate =
    gradeCount > 0
      ? Math.round(
          (grades.filter((g) => Number(g.percentage) >= 75).length / gradeCount) * 100
        )
      : null

  const cards = [
    { label: 'Classes', value: String(classes.length), icon: GraduationCap, color: 'text-blue-600' },
    { label: 'Students', value: String(enrollments), icon: Users, color: 'text-indigo-600' },
    {
      label: 'Avg Internal Grade',
      value: avgGrade != null ? `${avgGrade}%` : 'N/A',
      icon: BarChart3,
      color: 'text-emerald-600',
    },
    {
      label: 'Pass Rate (≥75%)',
      value: passRate != null ? `${passRate}%` : 'N/A',
      icon: CheckCircle2,
      color: 'text-amber-600',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
          My Metrics
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Performance across the classes assigned to you. Based on internal continuous-assessment
          grades you have recorded.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <c.icon className={`h-5 w-5 ${c.color}`} />
            <p className="mt-3 text-3xl font-black text-slate-900 dark:text-slate-100">
              {c.value}
            </p>
            <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
              {c.label}
            </p>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400">
        Note: official EASA results are recorded separately by staff/examiners and are not included
        in these internal metrics.
      </p>
    </div>
  )
}
