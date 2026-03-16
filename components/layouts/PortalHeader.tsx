import { cn } from '@/lib/utils'

interface PortalHeaderProps {
  children?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export default function PortalHeader({ children, actions, className }: PortalHeaderProps) {
  return (
    <div className={cn('mb-6 flex items-center justify-between gap-4', className)}>
      <div className="min-w-0 flex-1">{children}</div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  )
}
