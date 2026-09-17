import { Metadata } from 'next'
import { Suspense } from 'react'
import { getMyClassesGroupedByIntake, getMyClassesFilterOptions } from '@/lib/actions/instructor'
import { School } from 'lucide-react'
import IntakeGroupTable from './_components/IntakeGroupTable'
import ClassFilters from './_components/ClassFilters'

export const metadata: Metadata = { title: 'My Modules | Instructor Portal' }
export const dynamic = 'force-dynamic'

interface SearchParams {
  academicYear?: string
  semester?: string
  category?: string
  status?: string
}

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams

  const [groupsData, filterOptions] = await Promise.all([
    getMyClassesGroupedByIntake({
      academicYearId: params.academicYear,
      semesterId: params.semester,
      categoryId: params.category,
      status: params.status as 'upcoming' | 'active' | 'completed' | undefined,
    }),
    getMyClassesFilterOptions(),
  ])

  const totalClasses = groupsData?.reduce((sum, g) => sum + g.classes.length, 0) || 0

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col space-y-6 duration-700">
      {/* Header section */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-aerojet-blue text-3xl font-black tracking-tight dark:text-white">
            Course Management
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Oversee your assigned instructional classes grouped by intake period.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-2 dark:bg-slate-800/50">
          <School className="h-4 w-4 text-blue-500" />
          <span className="text-xs font-black text-slate-600 uppercase dark:text-slate-400">
            {totalClasses} Assigned Class{totalClasses !== 1 ? 'es' : ''}
          </span>
        </div>
      </div>

      {/* Filters */}
      <Suspense fallback={<ClassFiltersSkeleton />}>
        <ClassFilters
          options={filterOptions}
          current={{
            academicYear: params.academicYear,
            semester: params.semester,
            category: params.category,
            status: params.status,
          }}
        />
      </Suspense>

      {/* Intake Groups Table */}
      <Suspense fallback={<IntakeTableSkeleton />}>
        <IntakeGroupTable groups={groupsData || []} />
      </Suspense>
    </div>
  )
}

function ClassFiltersSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="h-10 w-40 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
      <div className="h-10 w-40 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
      <div className="h-10 w-40 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
      <div className="h-10 w-40 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
    </div>
  )
}

function IntakeTableSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="bg-slate-100 px-4 py-3 dark:bg-slate-800/50" />
          <div className="px-4 py-3">
            <div className="mb-4 h-4 w-1/4 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="space-y-2">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-14 rounded-xl bg-slate-50 dark:bg-slate-800/50" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
