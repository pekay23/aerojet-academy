import { LucideIcon, Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 text-center"
    >
      <Icon className="h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
