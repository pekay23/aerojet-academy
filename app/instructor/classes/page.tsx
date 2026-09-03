import { Metadata } from 'next'
import { getMyClasses } from '@/lib/actions/instructor'
import { School } from 'lucide-react'
import ModuleCard from './_components/ModuleCard'

export const metadata: Metadata = { title: 'My Modules | Instructor Portal' }
export const dynamic = 'force-dynamic'

export default async function Page() {
  const classes = await getMyClasses()

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col space-y-8 duration-700">
      {/* Header section with Stats or Context if needed */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-aerojet-blue text-3xl font-black tracking-tight dark:text-white">
            Course Management
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Oversee your assigned instructional modules and manage student progress.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-2 dark:bg-slate-800/50">
          <School className="h-4 w-4 text-blue-500" />
          <span className="text-xs font-black text-slate-600 uppercase dark:text-slate-400">
            {classes?.length || 0} Assigned Modules
          </span>
        </div>
      </div>

      {/* Grid of Modules */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {classes && classes.length > 0 ? (
          classes.map((cls) => <ModuleCard key={cls.id} cls={cls} />)
        ) : (
          <div className="col-span-full rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-20 text-center dark:border-slate-800 dark:bg-slate-900/50">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800">
              <School className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              No assigned modules
            </h3>
            <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500 dark:text-slate-400">
              You haven&apos;t been assigned to any instructional modules for the current academic
              period.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
