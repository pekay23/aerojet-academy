import { cn } from '@/lib/utils'

/**
 * Shared page-entry animation wrapper.
 *
 * Centralises the `animate-in fade-in slide-in-from-bottom-4 duration-700`
 * transition that was previously repeated inline across applicant pages so it
 * can be changed in one place (L-1).
 */
export function PageTransition({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('animate-in fade-in slide-in-from-bottom-4 duration-700', className)}>
      {children}
    </div>
  )
}
