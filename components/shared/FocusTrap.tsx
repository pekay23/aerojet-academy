'use client'

import { useEffect, useRef, useCallback } from 'react'

interface FocusTrapProps {
  children: React.ReactNode
  onEscape?: () => void
  autoFocus?: boolean
}

export default function FocusTrap({ children, onEscape, autoFocus = true }: FocusTrapProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  const getFocusableElements = useCallback(() => {
    if (!rootRef.current) return []
    return Array.from(
      rootRef.current.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[]
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return

    previousActiveElement.current = document.activeElement as HTMLElement

    if (autoFocus && rootRef.current) {
      const focusable = getFocusableElements()
      if (focusable.length > 0) {
        focusable[0].focus()
      } else {
        rootRef.current.focus()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEscape?.()
        return
      }

      if (event.key !== 'Tab') return

      const focusable = getFocusableElements()
      if (focusable.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousActiveElement.current?.focus()
    }
  }, [autoFocus, getFocusableElements, onEscape])

  return (
    <div ref={rootRef} tabIndex={-1}>
      {children}
    </div>
  )
}
