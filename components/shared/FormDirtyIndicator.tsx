'use client'

import { Circle } from 'lucide-react'

interface FormDirtyIndicatorProps {
  isDirty: boolean
  className?: string
}

/**
 * Visual indicator for unsaved form changes.
 * Shows a pulsing dot next to the save button when there are unsaved changes.
 */
export function FormDirtyIndicator({ isDirty, className }: FormDirtyIndicatorProps) {
  if (!isDirty) return null

  return (
    <span className={`flex items-center gap-1.5 text-amber-600 dark:text-amber-400 ${className || ''}`}>
      <Circle className="h-2 w-2 fill-amber-500 animate-pulse" aria-hidden="true" />
      <span className="text-xs font-medium">Unsaved</span>
    </span>
  )
}