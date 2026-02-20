'use client'

import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { cn } from '@/lib/utils'

interface SubmitButtonProps {
  children: React.ReactNode
  loading?: boolean
  disabled?: boolean
  className?: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary'
}

export function SubmitButton({ children, loading, disabled, className, variant = 'default' }: SubmitButtonProps) {
  return (
    <Button type="submit" variant={variant} disabled={loading || disabled} className={cn('relative', className)}>
      {loading && <LoadingSpinner size="sm" className="mr-2" />}
      {children}
    </Button>
  )
}
