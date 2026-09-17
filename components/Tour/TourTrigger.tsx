'use client'

import { Info } from 'lucide-react'

/**
 * Reusable "Take a tour" trigger. Dispatches a `start-app-tour` custom event
 * that `<AppTour>` listens for, so any portal topbar can start the tour
 * without importing joyride machinery.
 */
export default function TourTrigger({
  className,
  title = 'Take a guided tour',
  label,
}: {
  className?: string
  title?: string
  label?: string
}) {
  return (
    <button
      type="button"
      data-tour-id="topbar-tour-trigger"
      onClick={() => window.dispatchEvent(new CustomEvent('start-app-tour'))}
      className={
        className ??
        'relative flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-all duration-150 ease-out hover:border-slate-200 hover:bg-white hover:text-slate-600 hover:shadow-sm dark:hover:border-slate-700 dark:hover:bg-slate-800/80 dark:hover:text-slate-300'
      }
      aria-label={title}
      title={title}
    >
      <Info className="h-4 w-4" />
      {label ? <span className="ml-2 text-xs font-bold">{label}</span> : null}
    </button>
  )
}
