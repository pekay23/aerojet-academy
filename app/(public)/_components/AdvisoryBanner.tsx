'use client'

import { useState, useEffect, useRef } from 'react'
import { AlertCircle, X } from 'lucide-react'

/**
 * Sets a CSS custom property --advisory-banner-height on <html> so the
 * fixed navbar (z-50) can offset itself downward when the banner is visible.
 * The banner itself is fixed at top-0 with z-[60] (above the navbar).
 */
export default function AdvisoryBanner({ message }: { message: string }) {
  const [isVisible, setIsVisible] = useState(false)
  const bannerRef = useRef<HTMLDivElement>(null)
  const storageKey = 'aerojet-advisory-closed'

  // Sync the CSS variable with the banner's rendered height
  const syncHeight = () => {
    if (bannerRef.current && isVisible) {
      const h = bannerRef.current.offsetHeight
      document.documentElement.style.setProperty('--advisory-banner-height', `${h}px`)
    } else {
      document.documentElement.style.setProperty('--advisory-banner-height', '0px')
    }
  }

  useEffect(() => {
    if (!message) return
    const closedMessage = sessionStorage.getItem(storageKey)
    if (closedMessage !== message) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsVisible(true)
    }
  }, [message])

  // Update CSS variable whenever visibility or message changes
  useEffect(() => {
    syncHeight()
    // Re-measure on resize (banner text may wrap differently)
    window.addEventListener('resize', syncHeight)
    return () => {
      window.removeEventListener('resize', syncHeight)
      document.documentElement.style.setProperty('--advisory-banner-height', '0px')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible])

  if (!isVisible || !message) return null

  const handleClose = () => {
    sessionStorage.setItem(storageKey, message)
    setIsVisible(false)
    document.documentElement.style.setProperty('--advisory-banner-height', '0px')
  }

  return (
    <div
      ref={bannerRef}
      className="fixed top-0 right-0 left-0 z-[60] border-b border-amber-300 bg-amber-50 px-4 py-3 shadow-sm sm:px-6 lg:px-8"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
        <p className="text-center text-sm leading-snug font-semibold text-amber-900">{message}</p>
      </div>
      <button
        onClick={handleClose}
        type="button"
        className="absolute top-1/2 right-4 shrink-0 -translate-y-1/2 rounded-md p-1.5 text-amber-600 transition-colors hover:bg-amber-200/50 hover:text-amber-800 focus:ring-2 focus:ring-amber-500 focus:outline-none sm:right-6 lg:right-8"
        aria-label="Dismiss advisory"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  )
}
