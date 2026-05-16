export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-12 animate-pulse" role="status" aria-label="Loading newsroom">
      <div className="h-10 w-64 rounded-lg bg-slate-200 dark:bg-slate-700" />
      <div className="h-5 w-96 rounded bg-slate-100 dark:bg-slate-800" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
            <div className="h-48 bg-slate-200 dark:bg-slate-700" />
            <div className="space-y-3 p-5">
              <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800" />
              <div className="h-4 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  )
}
