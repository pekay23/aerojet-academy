'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface MotionTabsProps {
  tabs: string[]
  activeTab: string
  onChange: (tab: string) => void
  containerClassName?: string
  tabClassName?: string
  activeTabClassName?: string
  layoutId?: string
}

/**
 * Reusable MotionTabs component inspired by motion-tabs.vercel.app
 * Uses framer-motion layoutId for a sliding background effect.
 */
export default function MotionTabs({
  tabs,
  activeTab,
  onChange,
  containerClassName,
  tabClassName,
  activeTabClassName,
  layoutId = 'active-pill',
}: MotionTabsProps) {
  return (
    <div
      className={cn(
        'relative flex items-center gap-1 rounded-full p-1',
        'bg-slate-100/50 dark:bg-white/5',
        containerClassName
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab

        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={cn(
              'relative rounded-full px-4 py-1.5 text-xs font-bold tracking-tight transition-colors md:px-6',
              isActive
                ? cn('text-white dark:text-aerojet-blue', activeTabClassName)
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
              tabClassName
            )}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 bg-aerojet-blue dark:bg-white"
                style={{ borderRadius: 9999, zIndex: 0 }}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{tab}</span>
          </button>
        )
      })}
    </div>
  )
}
