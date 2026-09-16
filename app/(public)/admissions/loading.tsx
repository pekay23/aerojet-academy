export default function Loading() {
  return (
    <div
      className="mx-auto max-w-7xl animate-pulse space-y-8 px-4 py-12"
      role="status"
      aria-label="Loading admissions"
    >
      <div className="h-10 w-72 rounded-lg bg-slate-200 dark:bg-slate-700" />
      <div className="h-5 w-96 rounded bg-slate-100 dark:bg-slate-800" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-40 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="h-6 w-32 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mt-3 h-4 w-full rounded bg-slate-100 dark:bg-slate-800" />
            <div className="mt-2 h-4 w-2/3 rounded bg-slate-100 dark:bg-slate-800" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  )
}
