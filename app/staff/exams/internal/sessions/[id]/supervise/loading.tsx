import { TableSkeleton } from '@/components/shared/DashboardSkeleton'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <div className="h-7 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
        </div>
        <TableSkeleton rows={10} columns={6} />
      </div>
    </div>
  )
}
