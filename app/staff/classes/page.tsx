import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Calendar, Users, MoreVertical, BookOpen } from 'lucide-react'
import ClassActionsMenu from '../_components/ClassActionsMenu'
import prisma from '@/lib/prisma/client'
import { format } from 'date-fns'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Classes | Staff Portal' }

export default async function ClassesPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const classes = await prisma.class.findMany({
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      maxStudents: true,
      currentStudents: true,
      course: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      instructor: {
        select: {
          id: true,
          user: {
            select: {
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { startDate: 'desc' },
  })

  return (
    <div className="mx-auto max-w-[1800px]">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
            Classes
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Manage class schedules and rosters</p>
        </div>
        <Link
          href="/staff/classes/create"
          className="flex items-center gap-2 rounded-xl bg-aerojet-blue px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-aerojet-blue/90"
        >
          <Plus className="h-4 w-4" />
          Schedule Class
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Class / Course</th>
                <th className="px-6 py-4">Schedule</th>
                <th className="px-6 py-4">Instructor</th>
                <th className="px-6 py-4">Enrollment</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50">
              {classes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50">
                      <Calendar className="h-6 w-6 text-slate-300" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      No classes scheduled
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Click "Schedule Class" to create your first class.
                    </p>
                  </td>
                </tr>
              ) : (
                classes.map((cls) => (
                  <tr key={cls.id} className="group transition-all duration-150 ease-out hover:bg-white/80 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{cls.name}</div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <BookOpen className="h-3 w-3" />
                        {cls.course.code} - {cls.course.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-700">
                        {format(cls.startDate, 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        to {format(cls.endDate, 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {cls.instructor ? (
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700 uppercase">
                            {cls.instructor.user.profile?.firstName?.charAt(0) || 'I'}
                          </div>
                          <span className="font-medium text-slate-700">
                            {cls.instructor.user.profile?.firstName}{' '}
                            {cls.instructor.user.profile?.lastName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="bg-aerojet-blue"
                            style={{
                              width: `${Math.min(100, (cls.currentStudents / cls.maxStudents) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                          {cls.currentStudents}/{cls.maxStudents}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ClassActionsMenu classId={cls.id} className={cls.name || ''} />
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
