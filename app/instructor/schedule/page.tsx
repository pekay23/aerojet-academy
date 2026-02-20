import { Metadata } from 'next'
import { getInstructorSchedule } from '@/lib/actions/instructor'
import CalendarGrid from './_components/CalendarGrid'
import { startOfWeek, endOfWeek } from 'date-fns'

export const metadata: Metadata = { title: 'Teaching Schedule | Instructor Portal' }

export default async function Page() {
  const now = new Date()
  const start = startOfWeek(now, { weekStartsOn: 1 })
  const end = endOfWeek(now, { weekStartsOn: 1 })

  // We fetch a 1-week range by default.
  // In a real app, we might want to fetch more or use search params.
  const schedule = await getInstructorSchedule(start, end)

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col space-y-6 overflow-hidden">
      <div className="shrink-0">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
          Teaching Schedule
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage your weekly training sessions and student rosters.
        </p>
      </div>

      <div className="min-h-0 flex-1">
        <CalendarGrid schedule={schedule || []} initialDate={now} />
      </div>
    </div>
  )
}
