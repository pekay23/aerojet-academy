export default function Loading() {
  return (
    <div className="animate-pulse space-y-6" role="status" aria-label="Loading batch enrollment">
      <div>
        <div className="h-8 w-48 rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="mt-2 h-4 w-96 rounded bg-slate-100 dark:bg-slate-800" />
      </div>
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 h-5 w-40 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-10 w-full rounded-lg bg-slate-100 dark:bg-slate-800" />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 h-5 w-40 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="space-y-3">
            <div className="h-10 w-full rounded-lg bg-slate-100 dark:bg-slate-800" />
            <div className="h-10 w-full rounded-lg bg-slate-100 dark:bg-slate-800" />
            <div className="h-10 w-full rounded-lg bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 h-5 w-40 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="flex justify-end">
            <div className="h-10 w-32 rounded-lg bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  )
}
