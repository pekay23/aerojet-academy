export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-12 animate-pulse" role="status" aria-label="Loading article">
      <div className="h-10 w-72 rounded-lg bg-slate-200 dark:bg-slate-700" />
      <div className="h-5 w-96 rounded bg-slate-100 dark:bg-slate-800" />
      <div className="h-96 w-full rounded-2xl bg-slate-100 dark:bg-slate-800" />
      <span className="sr-only">Loading...</span>
    </div>
  )
}
