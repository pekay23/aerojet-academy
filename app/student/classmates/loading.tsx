export default function ClassmatesLoading() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-8 animate-pulse">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="h-10 w-64 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-5 w-96 rounded-lg bg-slate-100 dark:bg-slate-800/50" />
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="h-12 flex-1 rounded-2xl bg-slate-100 dark:bg-slate-800" />
        <div className="flex gap-2">
          <div className="h-8 w-32 rounded-full bg-slate-100 dark:bg-slate-800" />
          <div className="h-8 w-32 rounded-full bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div 
            key={i}
            className="flex flex-col items-center rounded-3xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-4 h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800" />
            <div className="mb-2 h-6 w-32 rounded-lg bg-slate-100 dark:bg-slate-800" />
            <div className="mb-4 h-4 w-48 rounded-md bg-slate-50 dark:bg-slate-800/50" />
            <div className="flex gap-2">
              <div className="h-6 w-20 rounded-full bg-slate-50 dark:bg-slate-800/50" />
              <div className="h-6 w-20 rounded-full bg-slate-50 dark:bg-slate-800/50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
