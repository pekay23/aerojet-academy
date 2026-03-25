export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" role="status" aria-label="Loading dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-4 w-64 bg-slate-100 dark:bg-slate-800 rounded mt-2" />
        </div>
        <div className="h-9 w-28 bg-slate-200 dark:bg-slate-700 rounded-lg" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-4 w-24 bg-slate-100 dark:bg-slate-700 rounded" />
              <div className="h-8 w-8 bg-slate-100 dark:bg-slate-700 rounded-lg" />
            </div>
            <div className="h-8 w-16 bg-slate-200 dark:bg-slate-600 rounded" />
          </div>
        ))}
      </div>

      {/* Table placeholder */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="h-5 w-36 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-4 animate-pulse" role="status" aria-label="Loading table">
      {/* Search/filter bar */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-64 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        <div className="h-9 w-28 bg-slate-200 dark:bg-slate-700 rounded-lg" />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 flex-1 bg-slate-200 dark:bg-slate-600 rounded" />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="h-4 flex-1 bg-slate-100 dark:bg-slate-700 rounded" />
            ))}
          </div>
        ))}
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  )
}
