export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-pulse" role="status" aria-label="Loading interview page">
      <div className="h-8 w-56 rounded-lg bg-slate-200 dark:bg-slate-700" />
      <div className="h-4 w-72 rounded bg-slate-100 dark:bg-slate-800" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="h-5 w-24 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mt-3 h-4 w-full rounded bg-slate-100 dark:bg-slate-800" />
            <div className="mt-2 h-8 w-20 rounded-lg bg-slate-200 dark:bg-slate-700" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  )
}
