import { TableSkeleton } from '@/components/shared/DashboardSkeleton'

export default function Loading() {
  return (
    <div className="mx-auto max-w-480 space-y-8">
      <div className="h-10 w-72 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
        ))}
      </div>
      <TableSkeleton rows={8} />
    </div>
  )
}
