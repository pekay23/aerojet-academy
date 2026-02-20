import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PAYMENT_PENDING: 'bg-orange-100 text-orange-800 border-orange-200',
  PAYMENT_REJECTED: 'bg-red-100 text-red-800 border-red-200',
  APPROVED: 'bg-green-100 text-green-800 border-green-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
  SUSPENDED: 'bg-red-100 text-red-800 border-red-200',
  DEACTIVATED: 'bg-gray-100 text-gray-800 border-gray-200',
  ENROLLED: 'bg-blue-100 text-blue-800 border-blue-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  OPEN: 'bg-blue-100 text-blue-800 border-blue-200',
  NEAR_FULL: 'bg-orange-100 text-orange-800 border-orange-200',
  CONFIRMED: 'bg-green-100 text-green-800 border-green-200',
  LOCKED: 'bg-purple-100 text-purple-800 border-purple-200',
  FAILED: 'bg-red-100 text-red-800 border-red-200',
  CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
  RESERVED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  REFUNDED: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  DRAFT: 'bg-gray-100 text-gray-600 border-gray-200',
  GO: 'bg-green-100 text-green-800 border-green-200',
  NO_GO: 'bg-red-100 text-red-800 border-red-200',
  PUBLISHED: 'bg-blue-100 text-blue-800 border-blue-200',
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  return (
    <Badge variant="outline" className={cn(colorClass, 'font-medium', className)}>
      {status.replace(/_/g, ' ')}
    </Badge>
  )
}
