import { Metadata } from 'next'
import { Suspense } from 'react'
import { getMyClasses, getMyClassesFilterOptions } from '@/lib/actions/instructor'
import { School, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import ModuleCard from './_components/ModuleCard'
import ModuleCardSkeleton from './_components/ModuleCardSkeleton'
import ClassFilters from './_components/ClassFilters'
import Pagination from './_components/Pagination'

export const metadata: Metadata = { title: 'My Modules | Instructor Portal' }
export const dynamic = 'force-dynamic'

interface SearchParams {
  academicYear?: string
  semester?: string
  category?: string
  status?: string
  sortBy?: string
  sortOrder?: string
  page?: string
}

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const page = parseInt(params.page || '1', 10)
  const pageSize = 12

  const [classesData, filterOptions] = await Promise.all([
    getMyClasses({
      academicYearId: params.academicYear,
      semesterId: params.semester,
      categoryId: params.category,
      status: params.status as 'upcoming' | 'active' | 'completed' | undefined,
      sortBy: params.sortBy as 'startDate' | 'name' | 'enrollment' | undefined,
      sortOrder: params.sortOrder as 'asc' | 'desc' | undefined,
      page,
      pageSize,
    }),
    getMyClassesFilterOptions(),
  ])

  const { classes, total } = classesData || { classes: [], total: 0 }
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col space-y-6 duration-700">
      {/* Header section */}
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
            {total} Assigned Module{total !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Filters & Sorting */}
      <Suspense fallback={<ClassFiltersSkeleton />}>
        <ClassFilters
          options={filterOptions}
          current={{
            academicYear: params.academicYear,
            semester: params.semester,
            category: params.category,
            status: params.status,
            sortBy: params.sortBy || 'startDate',
            sortOrder: params.sortOrder || 'desc',
          }}
        />
      </Suspense>

      {/* Grid of Modules */}
      <Suspense fallback={<ModuleCardsSkeleton />}>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {classes && classes.length > 0 ? (
            classes.map((cls) => (
              <ModuleCard
                key={cls.id}
                cls={{
                  ...cls,
                  course: { ...cls.course, duration: cls.course.duration ?? undefined },
                }}
              />
            ))
          ) : (
            <div className="col-span-full rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-20 text-center dark:border-slate-800 dark:bg-slate-900/50">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800">
                <School className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                No assigned modules
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500 dark:text-slate-400">
                {params.academicYear || params.semester || params.category || params.status
                  ? 'No modules match your current filters.'
                  : 'You haven&apos;t been assigned to any instructional modules for the current academic period.'}
              </p>
            </div>
          )}
        </div>
      </Suspense>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          baseParams={params as Record<string, string | undefined>}
        />
      )}
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

function ModuleCardsSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <ModuleCardSkeleton key={i} />
      ))}
    </div>
  )
}
