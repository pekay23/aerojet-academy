'use client'

import { useCallback, useRef, useState } from 'react'

/**
 * Hook that manages "unsaved changes" state and provides a tab-switch guard.
 *
 * Usage:
 *   const { isDirty, markDirty, markClean, confirmLeave, pendingTab, cancelLeave } = useUnsavedChanges()
 *
 * - Call `markDirty()` whenever a form field changes.
 * - Call `markClean()` after a successful save.
 * - Pass `confirmLeave` as the `onBeforeChange` prop to MotionTabs.
 * - Render a dialog when `pendingTab` is not null, with Proceed/Cancel buttons.
 */
export function useUnsavedChanges() {
  const [isDirty, setIsDirty] = useState(false)
  const [pendingTab, setPendingTab] = useState<string | null>(null)
  // Callback to resolve after user confirms/cancels
  const resolveRef = useRef<((proceed: boolean) => void) | null>(null)

  const markDirty = useCallback(() => setIsDirty(true), [])
  const markClean = useCallback(() => setIsDirty(false), [])

  /**
   * Guard function to pass as `onBeforeChange` to MotionTabs.
   * Returns a Promise<boolean> — true = allow navigation, false = block it.
   */
  const confirmLeave = useCallback(
    (targetTab: string): Promise<boolean> => {
      if (!isDirty) return Promise.resolve(true)

      return new Promise<boolean>((resolve) => {
        setPendingTab(targetTab)
        resolveRef.current = (proceed: boolean) => {
          setPendingTab(null)
          resolveRef.current = null
          resolve(proceed)
        }
      })
    },
    [isDirty]
  )

  const proceedLeave = useCallback(() => {
    resolveRef.current?.(true)
    setIsDirty(false)
  }, [])

  const cancelLeave = useCallback(() => {
    resolveRef.current?.(false)
  }, [])

  return { isDirty, markDirty, markClean, confirmLeave, pendingTab, proceedLeave, cancelLeave }
}
