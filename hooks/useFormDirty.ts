'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Enhanced unsaved-changes hook with beforeunload browser guard.
 *
 * Differs from `useUnsavedChanges` (which is tab-switch focused) by also
 * intercepting browser-level navigation (refresh, close tab, back button).
 *
 * Usage:
 *   const { isDirty, markDirty, markClean } = useFormDirty()
 *
 *   // Call markDirty() on every form field change
 *   // Call markClean() after a successful save
 *
 * VISUAL FEEDBACK PATTERN (recommended):
 *   // Save button with dirty indicator dot
 *   <Button disabled={!isDirty}>
 *     Save
 *     {isDirty && <span className="ml-2 h-2 w-2 rounded-full bg-destructive" />}
 *   </Button>
 *
 *   // Or use with UnsavedChangesDialog pattern:
 *   <UnsavedChangesDialog isOpen={isDirty} onSave={handleSave} onDiscard={markClean} />
 *
 * The beforeunload listener provides browser-level protection (refresh/close tab).
 * Components MUST use `isDirty` to show visual feedback — the browser dialog alone
 * is hostile UX. Combine with save-button indicators, banners, or dialogs.
 */
export function useFormDirty() {
  const [isDirty, setIsDirty] = useState(false)
  const dirtyRef = useRef(false)

  // Keep ref in sync with state for the beforeunload handler
  useEffect(() => {
    dirtyRef.current = isDirty
  }, [isDirty])

  // Browser-level guard: warn on refresh/close tab
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [])

  const markDirty = useCallback(() => setIsDirty(true), [])
  const markClean = useCallback(() => setIsDirty(false), [])

  return { isDirty, markDirty, markClean }
}
