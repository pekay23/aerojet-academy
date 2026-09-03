import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronLeft, ClipboardCheck } from 'lucide-react'
import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { getClassAttendance } from '@/lib/actions/instructor'

export const metadata: Metadata = { title: 'Class Grades | Instructor Portal' }
export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getAuthSession()
  if (!session || session.user.role !== 'INSTRUCTOR') redirect('/login')

  const data = await getClassAttendance(id)
  if (!data) redirect('/instructor/classes')

  const { classData } = data

  const grades = await prismaUnfiltered.grade.findMany({
    where: { enrollment: { courseId: classData.course.id } },
    include: {
      user: { include: { profile: true } },
      enrollment: { include: { course: true } },
    },
    orderBy: { assessmentDate: 'desc' },
  })

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-700">
      <div>
        <Link
          href="/instructor/classes"
          className="hover:text-aerojet-sky mb-2 inline-flex items-center gap-1.5 text-xs font-bold tracking-widest text-slate-400 uppercase transition-colors dark:text-slate-300"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to My Classes
        </Link>
        <h1 className="text-aerojet-blue text-3xl font-black tracking-tight dark:text-white">
          Class Grades
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {classData.course.name} ({classData.course.code}) &middot; {classData.name}
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
        {grades.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                  <th className="px-6 py-4 text-left text-xs font-bold tracking-widest text-slate-400 uppercase">
                    Student Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold tracking-widest text-slate-400 uppercase">
                    Assessment
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold tracking-widest text-slate-400 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold tracking-widest text-slate-400 uppercase">
                    Score / Max
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold tracking-widest text-slate-400 uppercase">
                    Percentage
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold tracking-widest text-slate-400 uppercase">
                    Grade
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold tracking-widest text-slate-400 uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {grades.map((grade) => {
                  const pct = Number(grade.percentage) || 0
                  const passing = pct >= 75

                  return (
                    <tr
                      key={grade.id}
                      className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 uppercase dark:bg-slate-800">
                            {grade.user.profile?.firstName?.[0]}
                            {grade.user.profile?.lastName?.[0]}
                          </div>
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {grade.user.profile?.firstName} {grade.user.profile?.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                        {grade.assessmentName}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase dark:bg-slate-800 dark:text-slate-400">
                          {grade.assessmentType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-slate-700 tabular-nums dark:text-slate-300">
                        {Number(grade.score)} / {Number(grade.maxScore)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`text-sm font-black tabular-nums ${
                            passing
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {pct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black ${
                            passing
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                              : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                          }`}
                        >
                          {grade.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-xs font-medium text-slate-400">
                        {grade.assessmentDate
                          ? new Date(grade.assessmentDate).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            <ClipboardCheck className="mx-auto mb-4 h-12 w-12 opacity-10" />
            <p className="text-sm font-medium">No grades recorded for this class yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
