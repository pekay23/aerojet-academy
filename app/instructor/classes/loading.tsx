export default function Loading() {
  return (
    <div className="space-y-4">
      {/* Filters Skeleton */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="h-10 w-40 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="h-10 w-40 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="h-10 w-40 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="h-10 w-40 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
      </div>

      {/* Table Skeleton */}
      <div className="animate-pulse overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="bg-slate-100 px-4 py-3 dark:bg-slate-800/50" />
        <div className="px-4 py-3">
          <div className="mb-2 h-14 rounded-xl bg-slate-50 dark:bg-slate-800/50" />
          <div className="mb-2 h-14 rounded-xl bg-slate-50 dark:bg-slate-800/50" />
          <div className="mb-2 h-14 rounded-xl bg-slate-50 dark:bg-slate-800/50" />
          <div className="mb-2 h-14 rounded-xl bg-slate-50 dark:bg-slate-800/50" />
        </div>
      </div>
    </div>
  )
}
