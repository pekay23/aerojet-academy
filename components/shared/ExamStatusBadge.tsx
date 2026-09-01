import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  CheckCircle2,
  Clock,
  XCircle,
  FileBarChart2,
  AlertCircle,
  BookOpen,
  Tag,
} from 'lucide-react'

type StatusVariant = 'booking' | 'payment' | 'result' | 'visual'

interface StatusConfig {
  label: string
  className: string
  icon?: React.ElementType
  variant: StatusVariant
}

const bookingConfig: Record<string, StatusConfig> = {
  APPROVED: {
    label: 'Approved',
    className: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    icon: CheckCircle2,
    variant: 'booking',
  },
  PENDING: {
    label: 'Pending',
    className: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    icon: Clock,
    variant: 'booking',
  },
  REJECTED: {
    label: 'Rejected',
    className: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
    icon: XCircle,
    variant: 'booking',
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    icon: FileBarChart2,
    variant: 'booking',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    icon: XCircle,
    variant: 'booking',
  },
}

const paymentConfig: Record<string, StatusConfig> = {
  APPROVED: {
    label: 'Approved',
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    icon: CheckCircle2,
    variant: 'payment',
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    icon: CheckCircle2,
    variant: 'payment',
  },
  PENDING: {
    label: 'Pending',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    icon: Clock,
    variant: 'payment',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    icon: XCircle,
    variant: 'payment',
  },
  REJECTED: {
    label: 'Rejected',
    className: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    icon: XCircle,
    variant: 'payment',
  },
}

const resultConfig: Record<string, StatusConfig> = {
  PASS: {
    label: 'Pass',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    variant: 'result',
  },
  FAIL: {
    label: 'Fail',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    variant: 'result',
  },
  ABSENT: {
    label: 'Absent',
    className: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    variant: 'result',
  },
  PENDING: {
    label: 'Pending',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    variant: 'result',
  },
  EXCUSED: {
    label: 'Excused',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    variant: 'result',
  },
  MIGRATED: {
    label: 'Migrated',
    className: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    variant: 'result',
  },
  SCHEDULED: {
    label: 'Scheduled',
    className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    variant: 'result',
  },
  EXECUTED: {
    label: 'Executed',
    className: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    variant: 'result',
  },
  POSTPONED: {
    label: 'Postponed',
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    variant: 'result',
  },
  ROLLED_FORWARD: {
    label: 'Rolled Forward',
    className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    variant: 'result',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    variant: 'result',
  },
}

const visualConfig: Record<string, StatusConfig> = {
  CONFIRMED: {
    label: 'Confirmed',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    variant: 'visual',
  },
  EXECUTED: {
    label: 'Executed',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    variant: 'visual',
  },
  RESERVED: {
    label: 'Pending Confirmation',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    variant: 'visual',
  },
  SCHEDULED: {
    label: 'Scheduled',
    className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    variant: 'visual',
  },
  POSTPONED: {
    label: 'Postponed',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    variant: 'visual',
  },
  ROLLED: {
    label: 'Rolled Forward',
    className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    variant: 'visual',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    variant: 'visual',
  },
}

const allConfigs = [bookingConfig, paymentConfig, resultConfig, visualConfig]

export function getExamStatusConfig(status: string): StatusConfig {
  const upper = status.toUpperCase()
  for (const config of allConfigs) {
    if (config[upper]) return config[upper]
  }
  return {
    label: status.replace(/_/g, ' '),
    className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    variant: 'booking',
  }
}

interface ExamStatusBadgeProps {
  status: string
  className?: string
  showIcon?: boolean
  size?: 'sm' | 'md'
}

export function ExamStatusBadge({
  status,
  className,
  showIcon = true,
  size = 'md',
}: ExamStatusBadgeProps) {
  const config = getExamStatusConfig(status)
  const Icon = config.icon
  const sizeClasses =
    size === 'sm'
      ? 'rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wide'
      : 'rounded-full px-2.5 py-1 text-xs font-bold tracking-wide uppercase'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        sizeClasses,
        config.className,
        className
      )}
    >
      {showIcon && Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
      {config.label}
    </span>
  )
}
