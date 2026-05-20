import { Metadata } from 'next'
import { requireStaff } from '@/lib/auth/helpers'
import { findConflicts } from '@/lib/scheduling/conflicts'
import ConflictMatrix from './_components/ConflictMatrix'

export const metadata: Metadata = { title: 'Schedule Conflicts | Staff' }
export const dynamic = 'force-dynamic'

interface SP { searchParams?: Promise<Record<string, string | undefined>> }

export default async function ConflictsPage({ searchParams }: SP) {
  await requireStaff()
  const sp = (await searchParams) ?? {}
  const today = new Date()
  const defaultFrom = new Date(today)
  defaultFrom.setDate(today.getDate() - 7)
  const defaultTo = new Date(today)
  defaultTo.setDate(today.getDate() + 30)

  const from = sp.from ? new Date(sp.from) : defaultFrom
  const to = sp.to ? new Date(sp.to) : defaultTo

  const conflicts = await findConflicts({ from, to })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
          Schedule Conflicts
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Cross-class overlap detection for instructors and classrooms across a date range.
          Defaults to one week ago → thirty days ahead.
        </p>
      </div>

      <ConflictMatrix
        from={from.toISOString().slice(0, 10)}
        to={to.toISOString().slice(0, 10)}
        conflicts={conflicts.map((c) => ({
          kind: c.kind,
          resourceId: c.resourceId,
          resourceLabel: c.resourceLabel,
          date: c.date,
          a: {
            classId: c.a.classId,
            className: c.a.className,
            start: c.a.start.toISOString(),
            end: c.a.end.toISOString(),
          },
          b: {
            classId: c.b.classId,
            className: c.b.className,
            start: c.b.start.toISOString(),
            end: c.b.end.toISOString(),
          },
        }))}
      />
    </div>
  )
}
