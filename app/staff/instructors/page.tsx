import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap } from 'lucide-react'
import prisma from '@/lib/prisma/client'
import { Metadata } from 'next'
import { Prisma, UserRole } from '@prisma/client'

export const metadata: Metadata = { title: 'Instructors | Staff Portal' }

const instructorSelect = {
  where: { role: UserRole.INSTRUCTOR },
  include: {
    profile: { select: { firstName: true, lastName: true } },
    instructorProfile: { select: { employeeId: true, specialization: true } },
  },
  orderBy: { createdAt: 'desc' as const },
} satisfies Prisma.UserFindManyArgs

type InstructorWithRelations = Prisma.UserGetPayload<typeof instructorSelect>

export default async function InstructorsPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const instructors: InstructorWithRelations[] = await prisma.user.findMany(instructorSelect)

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#002a5c] dark:text-white">Instructors</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage teaching staff and their assignments</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Instructor</th>
                <th className="px-6 py-4">Employee ID</th>
                <th className="px-6 py-4">Specialization</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {instructors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50">
                      <GraduationCap className="h-6 w-6 text-slate-300" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">No instructors found</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Instructors will appear here once added to the system.
                    </p>
                  </td>
                </tr>
              ) : (
                instructors.map((instructor) => (
                  <tr key={instructor.id} className="group hover:bg-slate-50 dark:bg-slate-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-bold text-[#002a5c]">
                          {instructor.profile?.firstName?.charAt(0)}
                          {instructor.profile?.lastName?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {instructor.profile?.firstName} {instructor.profile?.lastName}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{instructor.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {instructor.instructorProfile?.employeeId ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {instructor.instructorProfile?.specialization ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {instructor.academyEmail ?? instructor.email}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/staff/users/${instructor.id}`}
                        className="text-xs font-bold text-[#002a5c] hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

