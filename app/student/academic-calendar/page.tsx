import { Metadata } from 'next'
import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import { Calendar as CalendarIcon, Clock, Layers } from 'lucide-react'

export const metadata: Metadata = { title: 'Academic Calendar | Student Portal' }
export const dynamic = 'force-dynamic'

export default async function StudentAcademicCalendarPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const academicYears = await prisma.academicYear.findMany({
    where: { isActive: true },
    include: {
      semesters: {
        where: { isActive: true },
        orderBy: { startDate: 'asc' },
      },
    },
    orderBy: { startDate: 'desc' },
  })

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
          <CalendarIcon className="h-8 w-8 text-[#4c9ded] dark:text-blue-400" />
          Academic Calendar
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          View all current and upcoming academic semesters and terms.
        </p>
      </div>

      {academicYears.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center dark:border-slate-800 dark:bg-slate-900/50">
          <CalendarIcon className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">
            No Active Academic Years
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Check back later for the finalized schedule.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {academicYears.map((year) => (
            <div
              key={year.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="border-b border-slate-100 bg-[#002a5c] px-6 py-4 dark:border-slate-800">
                <h2 className="text-xl font-bold tracking-tight text-white">{year.name}</h2>
                <div className="mt-1 flex items-center gap-2 text-sm text-blue-200">
                  <Clock className="h-4 w-4" />
                  {new Date(year.startDate).toLocaleDateString()} —{' '}
                  {new Date(year.endDate).toLocaleDateString()}
                </div>
              </div>
              <div className="p-6">
                {year.semesters.length === 0 ? (
                  <p className="text-sm text-slate-500 italic dark:text-slate-400">
                    No semesters announced for this year yet.
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {year.semesters.map((sem) => {
                      const now = new Date()
                      const start = new Date(sem.startDate)
                      const end = new Date(sem.endDate)
                      let status = 'UPCOMING'
                      if (now > end) status = 'COMPLETED'
                      else if (now >= start && now <= end) status = 'CURRENT'

                      const statusColors = {
                        UPCOMING:
                          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                        CURRENT:
                          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-2 ring-green-600',
                        COMPLETED:
                          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
                      }

                      return (
                        <div
                          key={sem.id}
                          className={`rounded-xl border border-slate-100 p-5 ${status === 'CURRENT' ? 'bg-green-50/50 dark:bg-green-900/10' : 'bg-white dark:bg-slate-900/50'}`}
                        >
                          <div className="flex items-start justify-between">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100">
                              {sem.name}
                            </h3>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-black tracking-widest uppercase ${statusColors[status]}`}
                            >
                              {status}
                            </span>
                          </div>
                          <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                            <Layers className="h-3 w-3" />
                            {start.toLocaleDateString()} — {end.toLocaleDateString()}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
