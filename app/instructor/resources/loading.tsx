import { TableSkeleton } from '@/components/shared/DashboardSkeleton'

export default function Loading() {
  return <TableSkeleton rows={8} columns={6} />
}
