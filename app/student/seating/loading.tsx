export default function Loading() {
  return (
    <div className="mx-auto max-w-350 animate-pulse space-y-6">
      <div>
        <div className="h-8 w-64 rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="mt-2 h-4 w-96 rounded bg-slate-100 dark:bg-slate-800" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-4 h-5 w-40 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mx-auto grid max-w-fit grid-cols-6 gap-1.5">
              {Array.from({ length: 24 }).map((_, j) => (
                <div key={j} className="h-12 w-12 rounded-lg bg-slate-100 dark:bg-slate-700" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
