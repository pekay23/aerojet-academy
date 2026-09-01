'use client'

import { useEffect, useRef } from 'react'

export default function AntiCheatProvider({ children, sessionId }: { children: React.ReactNode, sessionId: string }) {
  const isDev = process.env.NODE_ENV === 'development'
  const isFullscreen = useRef(false)

  useEffect(() => {
    if (isDev) return // Don't enforce in dev

    const reportViolation = async (type: 'TAB_SWITCH' | 'FULLSCREEN_EXIT') => {
      await fetch('/api/applicant/aptitude/anti-cheat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, eventType: type })
      })
    }

    // Tab Switch Listener
    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportViolation('TAB_SWITCH')
      }
    }

    // Fullscreen Enter/Exit Listener
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        isFullscreen.current = false
        reportViolation('FULLSCREEN_EXIT')
      } else {
        isFullscreen.current = true
      }
    }

    // Prevent copy/paste/context menu
    const preventDefault = (e: Event) => e.preventDefault()

    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('contextmenu', preventDefault)
    document.addEventListener('copy', preventDefault)

    // Attempt to enter fullscreen initially
    const enterFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {})
      }
    }
    document.addEventListener('click', enterFullscreen, { once: true })

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('contextmenu', preventDefault)
      document.removeEventListener('copy', preventDefault)
    }
  }, [sessionId, isDev])

  return <>{children}</>
}
