import { Metadata } from 'next'
import { getAuthSession } from '@/lib/auth/helpers'
import { redirect, notFound } from 'next/navigation'
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
  if (!session || !['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(session.user.role)) redirect('/login')

  const { id } = await params

  const cls = await prismaUnfiltered.class.findUnique({
    where: { id },
    include: {
      course: true,
      academicYear: true,
    },
  })

  if (!cls) notFound()

  // Get current enrollments for this class
  const classRecords = await prismaUnfiltered.attendanceRecord.findMany({
    where: { classId: id },
    distinct: ['userId'],
    select: { userId: true },
  })
  
  const enrolledUserIds = classRecords.map(r => r.userId)
  
  const roster = await prismaUnfiltered.studentProfile.findMany({
    where: { userId: { in: enrolledUserIds } },
    include: {
      user: {
        include: { profile: true }
      },
      pathwayRel: true,
    },
    orderBy: { user: { profile: { firstName: 'asc' } } }
  })

  // Get available cohorts (academic years) for batch enrollment
  const cohorts = await prismaUnfiltered.academicYear.findMany({
    orderBy: { startDate: 'desc' }
  })

  return (
    <div className="mx-auto max-w-[1800px] space-y-8">
      <div className="mb-6">
        <Link
          href={`/staff/classes/${id}`}
          className="mb-4 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-bold text-slate-400 transition-all hover:bg-slate-100 hover:text-aerojet-blue dark:hover:bg-slate-800/60"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Class
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black tracking-tight text-aerojet-blue sm:text-4xl dark:text-white">
              Class Roster
            </h1>
            <p className="flex items-center gap-2 text-base font-medium text-slate-500 dark:text-slate-400">
              <Users className="h-5 w-5 text-aerojet-sky" />
              Manage students enrolled in {cls.name}.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Roster List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-aerojet-blue dark:text-white">
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
                {roster.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {student.user.profile?.firstName} {student.user.profile?.lastName}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                      {student.studentId || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="text-[10px] font-black uppercase">
                        {student.pathwayRel?.name || 'Standard'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 text-[10px] uppercase border-none">
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
                <h3 className="font-black text-aerojet-blue dark:text-white">Batch Enrollment</h3>
                <p className="text-xs text-slate-500">Add an entire cohort to this class</p>
              </div>
            </div>

            <BatchEnrollmentForm 
              classId={cls.id} 
              cohorts={cohorts.map(c => ({ id: c.id, name: c.name }))} 
              currentOccupancy={roster.length}
              maxCapacity={cls.maxStudents}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
