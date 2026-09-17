import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'
import { Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { SortableTh } from '@/components/ui/sortable-th'
import { buildOrderBy } from '@/lib/utils/build-order-by'
import type { Prisma } from '@prisma/client'
import CreateRevisionRunDialog from './_components/CreateRevisionRunDialog'
import EditRevisionRunDialog from './_components/EditRevisionRunDialog'

export const metadata: Metadata = {
  title: 'Revision Support | Staff Portal',
}

const ALLOWED_SORT_KEYS = {
  title: 'title',
  module: 'moduleTag',
  schedule: 'startDatetime',
  capacity: 'capacity',
  price: 'price',
  status: 'status',
} as const
type SortKey = keyof typeof ALLOWED_SORT_KEYS

interface RevisionRunsPageProps {
  searchParams: Promise<{ sort?: string; order?: string }>
}

export default async function RevisionRunsPage({ searchParams }: RevisionRunsPageProps) {
  const session = await getAuthSession()
  if (!session || !['ADMIN', 'STAFF'].includes(session.user.role)) {
    redirect('/login')
  }

  const params = await searchParams
  const orderBy = buildOrderBy<SortKey>(params, ALLOWED_SORT_KEYS, { startDatetime: 'desc' })

  const runs = await prismaUnfiltered.tuitionRun.findMany({
    include: {
      _count: { select: { bookings: true } },
    },
    orderBy: orderBy as Prisma.TuitionRunOrderByWithRelationInput,
  })

  const plainRuns = runs.map((run) => ({
    ...run,
    price: Number(run.price),
  }))

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white uppercase">
            Revision Support
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Manage paid revision classes and module support runs</p>
        </div>
        <CreateRevisionRunDialog />
      </div>

      <div className="grid gap-6">
        {plainRuns.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white py-20 text-center dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 rounded-full bg-slate-50 p-4 dark:bg-slate-800">
              <Calendar className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No Revision Runs Scheduled</h3>
            <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500">
              Create your first revision support run to allow students to book extra module support.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-black text-slate-500 uppercase dark:bg-slate-800/50 dark:text-slate-400">
                  <tr>
                    <SortableTh sortKey="title" label="Run Details" />
                    <SortableTh sortKey="module" label="Module Tag" />
                    <SortableTh sortKey="schedule" label="Schedule" />
                    <SortableTh sortKey="capacity" label="Capacity" />
                    <SortableTh sortKey="price" label="Price" align="right" />
                    <SortableTh sortKey="status" label="Status" />
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50">
                  {plainRuns.map((run) => (
                    <tr key={run.id} className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{run.title}</div>
                        {run.description && (
                          <div className="text-xs text-slate-500 line-clamp-1">{run.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-700 uppercase">
                          {run.moduleTag || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-700 dark:text-slate-300">
                          {format(run.startDatetime, 'MMM d, yyyy')}
                        </div>
                        <div className="text-xs text-slate-500">
                          {format(run.startDatetime, 'HH:mm')} - {format(run.endDatetime, 'HH:mm')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={run.currentEnrollments >= run.minClassSize ? 'bg-emerald-500' : 'bg-amber-500'}
                              style={{ width: `${Math.min(100, (run.currentEnrollments / run.capacity) * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-600">
                            {run.currentEnrollments}/{run.capacity}
                          </span>
                        </div>
                        {run.currentEnrollments < run.minClassSize && (
                          <div className="mt-1 text-[10px] text-amber-600 font-bold">
                            Min: {run.minClassSize}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900 tabular-nums dark:text-slate-100">
                        €{run.price.toString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                          run.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' :
                          run.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                          run.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {run.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <EditRevisionRunDialog run={run} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
