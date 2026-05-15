export default function Loading() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6 animate-pulse">
      <div>
        <div className="h-4 w-32 rounded bg-slate-100 dark:bg-slate-800" />
        <div className="mt-2 h-8 w-72 rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="mt-2 h-4 w-64 rounded bg-slate-100 dark:bg-slate-800" />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex gap-8">
          <div className="h-6 w-40 rounded bg-slate-100 dark:bg-slate-700" />
          <div className="h-6 w-32 rounded bg-slate-100 dark:bg-slate-700" />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-slate-100 dark:bg-slate-700" />
          ))}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
          <div className="grid grid-cols-8 gap-1.5 mx-auto max-w-fit">
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} className="h-16 w-16 rounded-lg bg-slate-200 dark:bg-slate-700" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
