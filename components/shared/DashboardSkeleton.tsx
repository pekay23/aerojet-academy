export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6" role="status" aria-label="Loading dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-48 rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="mt-2 h-4 w-64 rounded bg-slate-100 dark:bg-slate-800" />
        </div>
        <div className="h-9 w-28 rounded-lg bg-slate-200 dark:bg-slate-700" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-slate-100 dark:bg-slate-700" />
              <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-700" />
            </div>
            <div className="h-8 w-16 rounded bg-slate-200 dark:bg-slate-600" />
          </div>
        ))}
      </div>

      {/* Table placeholder */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-4 h-5 w-36 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export function TableSkeleton({ rows = 8, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="animate-pulse space-y-4" role="status" aria-label="Loading table">
      {/* Search/filter bar */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-64 rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="h-9 w-28 rounded-lg bg-slate-200 dark:bg-slate-700" />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-4 flex-1 rounded bg-slate-200 dark:bg-slate-600" />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-slate-100 px-4 py-3 last:border-0 dark:border-slate-700/50"
          >
            {Array.from({ length: columns }).map((_, j) => (
              <div key={j} className="h-4 flex-1 rounded bg-slate-100 dark:bg-slate-700" />
            ))}
          </div>
        ))}
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  )
}
