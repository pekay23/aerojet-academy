'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, FileBarChart2, History, Users, User, Layers, RefreshCcw, FileCheck } from 'lucide-react'
import { motion } from 'framer-motion'

interface Props {
  isFullTime?: boolean
  children: React.ReactNode
}

const ALL_TABS = [
  { key: 'available', label: 'Join Pools', shortLabel: 'Pools', icon: Users },
  { key: 'bookings', label: 'My Bookings', shortLabel: 'My Bookings', icon: FileCheck },
  { key: 'individual', label: 'Individual', shortLabel: 'Individual', icon: User },
  { key: 'group', label: 'Group', shortLabel: 'Group', icon: Layers },
  { key: 'resit', label: 'Resit', shortLabel: 'Resit', icon: RefreshCcw },
  { key: 'records', label: 'Exam Records', shortLabel: 'Records', icon: History },
] as const

// Full-time students can only view their exam records - admin books exams for them
const FULL_TIME_TABS = [
  { key: 'records', label: 'Exam Records', shortLabel: 'Records', icon: History },
] as const

export default function ExamsTabs({ isFullTime, children }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'available'

  // For full-time students, only show records tab - admin books exams for them
  const TABS = isFullTime ? FULL_TIME_TABS : ALL_TABS

  const setTab = (tab: string) => {
    router.push(`/student/exams?tab=${tab}`, { scroll: false })
  }

  return (
    <div className="space-y-6">

      {/* Tab Bar */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800" role="tablist" aria-label="Exam sections">
        {TABS.map((t) => {
          const Icon = t.icon
          const isActive = currentTab === t.key
          return (
            <button
              key={t.key}
              id={`tab-${t.key}`}
              role="tab"
              aria-selected={isActive}
              aria-controls="exams-tabpanel"
              onClick={() => setTab(t.key)}
              className={`relative flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-aerojet-blue/50 ${
                isActive
                  ? 'text-aerojet-blue dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="exams-tab"
                  className="absolute inset-0 bg-white shadow-sm dark:bg-slate-700"
                  style={{ borderRadius: 8, zIndex: 0 }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon className="relative z-10 h-3.5 w-3.5" aria-hidden="true" />
              <span className="relative z-10 hidden sm:inline">{t.label}</span>
              <span className="relative z-10 sm:hidden">{t.shortLabel}</span>
            </button>
          )
        })}
      </div>

      <div role="tabpanel" id="exams-tabpanel" aria-labelledby={`tab-${currentTab}`}>
        {children}
      </div>
    </div>
  )
}
