import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  className?: string
}

const STATUS_STYLES: Record<string, string> = {
  PRESENT: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  ABSENT: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
  LATE: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400',
  EXCUSED: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
  PASS: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  FAIL: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = STATUS_STYLES[status.toUpperCase()] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase',
        style,
        className
      )}
    >
      {status}
    </span>
  )
}
