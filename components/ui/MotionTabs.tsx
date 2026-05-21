'use client'

import { useState } from 'react'
import { type LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface MotionTab {
  key: string
  label: string
  /** Short label for mobile screens (shown below sm: breakpoint) */
  shortLabel?: string
  icon?: LucideIcon
  badge?: number
}

interface MotionTabsProps {
  tabs: MotionTab[]
  activeTab: string
  onChange: (key: string) => void
  /**
   * Optional async guard called before `onChange`. Return `true` to allow the
   * tab switch, `false` to block it (e.g. show an unsaved-changes dialog).
   */
  onBeforeChange?: (key: string) => Promise<boolean>
  layoutId?: string
  className?: string
  /** ARIA label for the tablist */
  ariaLabel?: string
}

/**
 * Pill tab bar with framer-motion layoutId sliding indicator.
 * Clean Aerojet-branded colors with smooth spring animation.
 */
export default function MotionTabs({
  tabs,
  activeTab,
  onChange,
  onBeforeChange,
  layoutId = 'motion-pill',
  className,
  ariaLabel,
}: MotionTabsProps) {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null)

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      onMouseLeave={() => setHoveredTab(null)}
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-slate-100 p-1 dark:bg-slate-800',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key
        const isHovered = hoveredTab === tab.key && !isActive
        const Icon = tab.icon

        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            onClick={async () => {
              if (isActive) return
              if (onBeforeChange) {
                const allowed = await onBeforeChange(tab.key)
                if (!allowed) return
              }
              onChange(tab.key)
            }}
            onMouseEnter={() => setHoveredTab(tab.key)}
            className={cn(
              'relative flex cursor-pointer items-center justify-center gap-2 rounded-full px-4 py-2 transition-colors sm:px-5',
              !isActive && 'hover:text-slate-700 dark:hover:text-slate-300'
            )}
          >
            {/* Hover highlight */}
            {isHovered && (
              <motion.div
                layoutId={`${layoutId}-hover`}
                className="absolute inset-0 rounded-full bg-slate-200/50 dark:bg-slate-700/50"
                style={{ zIndex: 0 }}
                transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
              />
            )}

            {/* Active pill indicator */}
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-white shadow-sm dark:bg-slate-900"
                style={{ zIndex: 0 }}
                transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
              />
            )}

            {Icon && (
              <Icon
                className={cn(
                  'relative z-10 h-3.5 w-3.5 transition-colors',
                  isActive
                    ? 'text-aerojet-blue dark:text-white'
                    : 'text-slate-400 dark:text-slate-500'
                )}
                aria-hidden="true"
              />
            )}
            {tab.shortLabel ? (
              <>
                <span
                  className={cn(
                    'relative z-10 hidden text-xs font-semibold leading-tight transition-colors sm:inline sm:text-[13px]',
                    isActive
                      ? 'text-aerojet-blue dark:text-white'
                      : 'text-slate-500 dark:text-slate-400'
                  )}
                >
                  {tab.label}
                </span>
                <span
                  className={cn(
                    'relative z-10 text-xs font-semibold leading-tight transition-colors sm:hidden',
                    isActive
                      ? 'text-aerojet-blue dark:text-white'
                      : 'text-slate-500 dark:text-slate-400'
                  )}
                >
                  {tab.shortLabel}
                </span>
              </>
            ) : (
              <span
                className={cn(
                  'relative z-10 text-xs font-semibold leading-tight transition-colors sm:text-[13px]',
                  isActive
                    ? 'text-aerojet-blue dark:text-white'
                    : 'text-slate-500 dark:text-slate-400'
                )}
              >
                {tab.label}
              </span>
            )}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className={cn(
                  'relative z-10 rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                  isActive
                    ? 'bg-aerojet-blue text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
