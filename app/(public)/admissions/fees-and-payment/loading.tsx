export default function Loading() {
  return (
    <div
      className="mx-auto max-w-4xl animate-pulse space-y-8 px-4 py-12"
      role="status"
      aria-label="Loading fees information"
    >
      <div className="h-10 w-64 rounded-lg bg-slate-200 dark:bg-slate-700" />
      <div className="h-5 w-80 rounded bg-slate-100 dark:bg-slate-800" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="h-5 w-48 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mt-3 h-4 w-full rounded bg-slate-100 dark:bg-slate-800" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  )
}
