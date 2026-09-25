import { redirectToLogin } from '@/lib/auth/redirect-to-login'
import { Metadata } from 'next'
import { getAuthSession } from '@/lib/auth/helpers'
import { notFound } from 'next/navigation'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { ArrowLeft, Users, UserPlus } from 'lucide-react'
import Link from 'next/link'
import BatchEnrollmentForm from './BatchEnrollmentForm'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = { title: 'Class Roster | Staff Portal' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function ClassRosterPage({ params }: Props) {
  const session = await getAuthSession()
  if (!session || !['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(session.user.role))
    return await redirectToLogin()

  const { id } = await params

  // Fetch class and cohorts in parallel (both independent of each other)
  const [cls, cohorts] = await Promise.all([
    prismaUnfiltered.class.findUnique({
      where: { id },
      include: { course: true, academicYear: true },
    }),
    prismaUnfiltered.academicYear.findMany({ orderBy: { startDate: 'desc' } }),
  ])

  if (!cls) notFound()

  // Get current enrollments for this class, then roster
  const classRecords = await prismaUnfiltered.attendanceRecord.findMany({
    where: { classId: id },
    distinct: ['userId'],
    select: { userId: true },
  })

  const enrolledUserIds = classRecords.map((r) => r.userId)

  const roster =
    enrolledUserIds.length > 0
      ? await prismaUnfiltered.studentProfile.findMany({
          where: { userId: { in: enrolledUserIds } },
          include: {
            user: { include: { profile: true } },
            pathwayRel: true,
          },
          orderBy: { user: { profile: { firstName: 'asc' } } },
        })
      : []

  return (
    <div className="mx-auto max-w-450 space-y-8">
      <div className="mb-6">
        <Link
          href={`/staff/classes/${id}`}
          className="hover:text-aerojet-blue mb-4 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-bold text-slate-400 transition-all hover:bg-slate-100 dark:hover:bg-slate-800/60"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Class
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-aerojet-blue text-3xl font-black tracking-tight sm:text-4xl dark:text-white">
              Class Roster
            </h1>
            <p className="flex items-center gap-2 text-base font-medium text-slate-500 dark:text-slate-400">
              <Users className="text-aerojet-sky h-5 w-5" />
              Manage students enrolled in {cls.name}.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Roster List */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-aerojet-blue text-lg font-black dark:text-white">
              Enrolled Students ({roster.length} / {cls.maxStudents})
            </h2>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:bg-slate-800/20">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Student ID</th>
                  <th className="px-6 py-4">Pathway</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {roster.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {student.user.profile?.firstName} {student.user.profile?.lastName}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {student.studentId || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="text-[10px] font-black uppercase">
                        {student.pathwayRel?.name || 'Standard'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className="border-none bg-emerald-50 text-[10px] text-emerald-600 uppercase dark:bg-emerald-900/20 dark:text-emerald-400">
                        Active
                      </Badge>
                    </td>
                  </tr>
                ))}
                {roster.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      No students currently enrolled in this class.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Batch Enrollment Tool */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-aerojet-blue font-black dark:text-white">Batch Enrollment</h3>
                <p className="text-xs text-slate-500">Add an entire cohort to this class</p>
              </div>
            </div>

            <BatchEnrollmentForm
              classId={cls.id}
              cohorts={cohorts.map((c) => ({ id: c.id, name: c.name }))}
              currentOccupancy={roster.length}
              maxCapacity={cls.maxStudents}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
