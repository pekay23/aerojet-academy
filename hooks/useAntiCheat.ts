'use client'

import { useEffect, useRef, useCallback } from 'react'

export interface UseAntiCheatOptions {
  /** Session or attempt ID for violation logging */
  sessionId: string
  /** API route to POST violations to */
  violationEndpoint?: string
  /** Whether to enforce fullscreen */
  enforceFullscreen?: boolean
  /** Whether to block clipboard */
  blockClipboard?: boolean
  /** Whether to block keyboard shortcuts */
  blockKeyboardShortcuts?: boolean
  /** Whether to detect DevTools */
  detectDevTools?: boolean
  /** Whether to prevent multi-tab */
  preventMultiTab?: boolean
  /** Whether to log page unload violations */
  logUnload?: boolean
  /** Whether to detect tab switches */
  detectTabSwitch?: boolean
  /** Callback when a critical violation occurs */
  onCriticalViolation?: (type: string, detail?: string) => void
}

export interface UseAntiCheatReturn {
  isFullscreen: boolean
  tabSwitchCount: number
  devToolsDetected: boolean
  logViolation: (type: string, detail?: string, opts?: { severity?: 'WARNING' | 'NOTICE' | 'CRITICAL' }) => Promise<void>
}

export function useAntiCheat(options: UseAntiCheatOptions): UseAntiCheatReturn {
  const {
    sessionId,
    violationEndpoint = '/api/student/exams/internal/violation',
    enforceFullscreen = true,
    blockClipboard = true,
    blockKeyboardShortcuts = true,
    detectDevTools = true,
    preventMultiTab = true,
    logUnload = true,
    detectTabSwitch = true,
    onCriticalViolation,
  } = options

  const isFullscreen = useRef(false)
  const tabSwitchCount = useRef(0)
  const devToolsDetected = useRef(false)
  const multiTabDetected = useRef(false)
  const warnedTabSwitch = useRef(false)
  const isDev = process.env.NODE_ENV === 'development'

  const logViolation = useCallback(
    async (type: string, detail?: string, opts?: { severity?: 'WARNING' | 'NOTICE' | 'CRITICAL' }) => {
      try {
        await fetch(violationEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({
            sessionId,
            type,
            detail,
            severity: opts?.severity || 'WARNING',
            deviceInfo: {
              userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
              platform: typeof navigator !== 'undefined' ? (navigator as any).platform : undefined,
              language: typeof navigator !== 'undefined' ? navigator.language : undefined,
            },
          }),
        })
      } catch {
        // best-effort logging
      }

      if (opts?.severity === 'CRITICAL' && onCriticalViolation) {
        onCriticalViolation(type, detail)
      }
    },
    [sessionId, violationEndpoint, onCriticalViolation]
  )

  useEffect(() => {
    if (isDev) return

    // ─── Fullscreen enforcement ───
    if (enforceFullscreen) {
      const enterFullscreen = () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {})
        }
      }

      const handleFullscreenChange = () => {
        const inFS = !!document.fullscreenElement
        isFullscreen.current = inFS
        if (!inFS) {
          void logViolation('FULLSCREEN_EXIT', 'Student exited fullscreen mode during exam')
        }
      }

      document.addEventListener('click', enterFullscreen, { once: true })
      document.addEventListener('fullscreenchange', handleFullscreenChange)
      document.documentElement.requestFullscreen().catch(() => {})

      return () => {
        document.removeEventListener('click', enterFullscreen)
        document.removeEventListener('fullscreenchange', handleFullscreenChange)
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {})
        }
      }
    }
  }, [enforceFullscreen, logViolation, isDev])

  useEffect(() => {
    if (isDev) return

    // ─── Tab switch detection ───
    if (detectTabSwitch) {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          tabSwitchCount.current += 1
          if (!warnedTabSwitch.current) {
            warnedTabSwitch.current = true
            void logViolation('TAB_SWITCH', 'Student navigated away from exam tab')
          }
        } else {
          warnedTabSwitch.current = false
        }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [detectTabSwitch, logViolation, isDev])

  useEffect(() => {
    if (isDev) return

    // ─── Clipboard block ───
    if (blockClipboard) {
      const onClipboard = (event: ClipboardEvent) => {
        event.preventDefault()
        void logViolation('KEYBOARD_SHORTCUT', `Clipboard event blocked: ${event.type}`)
      }

      document.addEventListener('copy', onClipboard)
      document.addEventListener('cut', onClipboard)
      document.addEventListener('paste', onClipboard)
      return () => {
        document.removeEventListener('copy', onClipboard)
        document.removeEventListener('cut', onClipboard)
        document.removeEventListener('paste', onClipboard)
      }
    }
  }, [blockClipboard, logViolation, isDev])

  useEffect(() => {
    if (isDev) return

    // ─── Keyboard shortcut block ───
    if (blockKeyboardShortcuts) {
      const onKeyDown = (event: KeyboardEvent) => {
        // Ctrl/Cmd combinations
        if (event.ctrlKey || event.metaKey) {
          const key = event.key.toLowerCase()
          if (['c', 'v', 'p', 's', 'u', 'shift', 'i'].includes(key)) {
            event.preventDefault()
            void logViolation('KEYBOARD_SHORTCUT', `Blocked Ctrl+${event.key}`)
          }
        }
        // F12 (DevTools)
        if (event.key === 'F12') {
          event.preventDefault()
          void logViolation('KEYBOARD_SHORTCUT', 'Blocked F12')
        }
        // PrintScreen
        if (event.key === 'PrintScreen') {
          event.preventDefault()
          void logViolation('KEYBOARD_SHORTCUT', 'Blocked PrintScreen')
        }
      }

      document.addEventListener('keydown', onKeyDown)
      return () => document.removeEventListener('keydown', onKeyDown)
    }
  }, [blockKeyboardShortcuts, logViolation, isDev])

  useEffect(() => {
    if (isDev) return

    // ─── DevTools detection (heuristic) ───
    if (detectDevTools) {
      const devToolsCheckInterval: NodeJS.Timeout = setInterval(checkDevTools, 2000)

      const checkDevTools = () => {
        const threshold = 160
        const devToolsOpen = window.outerWidth - window.innerWidth > threshold || window.outerHeight - window.innerHeight > threshold
        if (devToolsOpen && !devToolsDetected.current) {
          devToolsDetected.current = true
          void logViolation('DEVTOOLS_OPEN', 'Developer tools detected', { severity: 'CRITICAL' })
        }
      }

      return () => clearInterval(devToolsCheckInterval)
    }
  }, [detectDevTools, logViolation, isDev])

  useEffect(() => {
    if (isDev) return

    // ─── Multi-tab prevention ───
    if (preventMultiTab) {
      const channel = new BroadcastChannel('exam_lockdown')
      channel.postMessage({ type: 'HELLO', sessionId })

      const onMessage = (event: MessageEvent) => {
        if (event.data?.type === 'HELLO' && event.data?.sessionId === sessionId) {
          if (!multiTabDetected.current) {
            multiTabDetected.current = true
            void logViolation('MULTI_TAB', 'Multiple tabs detected for the same exam session', { severity: 'CRITICAL' })
          }
        }
      }

      channel.addEventListener('message', onMessage)

      // Also set a localStorage heartbeat
      const heartbeatKey = `exam_heartbeat_${sessionId}`
      const heartbeat = setInterval(() => {
        try {
          localStorage.setItem(heartbeatKey, Date.now().toString())
        } catch {
          // storage may be blocked
        }
      }, 1000)

      // Check for existing heartbeat from another tab
      const checkExisting = () => {
        try {
          const last = localStorage.getItem(heartbeatKey)
          if (last && Date.now() - parseInt(last, 10) < 2000) {
            if (!multiTabDetected.current) {
              multiTabDetected.current = true
              void logViolation('MULTI_TAB', 'Multiple tabs detected via localStorage heartbeat', { severity: 'CRITICAL' })
            }
          }
        } catch {
          // storage may be blocked
        }
      }

      checkExisting()
      const storageHandler = (event: StorageEvent) => {
        if (event.key === heartbeatKey) {
          checkExisting()
        }
      }
      window.addEventListener('storage', storageHandler)

      return () => {
        channel.close()
        clearInterval(heartbeat)
        window.removeEventListener('storage', storageHandler)
      }
    }
  }, [preventMultiTab, sessionId, logViolation, isDev])

  useEffect(() => {
    if (isDev) return

    // ─── Page unload logging ───
    if (logUnload) {
      const onUnload = () => {
        void fetch(violationEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          keepalive: true,
          body: JSON.stringify({
            sessionId,
            type: 'EXAM_INTERFACE_UNLOAD',
            detail: 'Student navigated away or closed the exam interface during an active session',
            severity: 'WARNING',
            deviceInfo: {
              userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
              platform: typeof navigator !== 'undefined' ? (navigator as any).platform : undefined,
            },
          }),
        })
      }

      document.addEventListener('beforeunload', onUnload)
      document.addEventListener('pagehide', onUnload)
      return () => {
        document.removeEventListener('beforeunload', onUnload)
        document.removeEventListener('pagehide', onUnload)
      }
    }
  }, [logUnload, sessionId, violationEndpoint, isDev])

  return {
    isFullscreen: isFullscreen.current,
    get tabSwitchCount() { return tabSwitchCount.current },
    get devToolsDetected() { return devToolsDetected.current },
    logViolation,
  }
}
