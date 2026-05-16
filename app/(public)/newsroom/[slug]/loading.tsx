export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12 animate-pulse" role="status" aria-label="Loading article">
      <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-10 w-3/4 rounded-lg bg-slate-200 dark:bg-slate-700" />
      <div className="h-5 w-48 rounded bg-slate-100 dark:bg-slate-800" />
      <div className="h-64 w-full rounded-2xl bg-slate-200 dark:bg-slate-700" />
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800" />
        ))}
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  )
}
