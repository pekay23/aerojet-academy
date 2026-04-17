'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, ClipboardList, Trophy, FilePlus2 } from 'lucide-react'
import { motion } from 'framer-motion'

const TABS = [
  { key: 'events', label: 'Events', icon: Calendar },
  { key: 'bookings', label: 'Bookings', icon: ClipboardList },
  { key: 'results', label: 'Results', icon: Trophy },
  { key: 'records', label: 'Records', icon: FilePlus2 },
] as const

export default function StaffExamsTabs({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'events'

  const setTab = (tab: string) => {
    router.push(`/staff/exams?tab=${tab}`, { scroll: false })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-aerojet-blue sm:text-3xl dark:text-white">
          Exams
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage exam events, student bookings, and results.
        </p>
      </div>

      {/* Tab Bar */}
      <div className="relative flex gap-1 rounded-2xl bg-slate-100 p-1.5 shadow-inner ring-1 ring-black/5 dark:bg-slate-800/80 dark:ring-white/5">
        {TABS.map((t) => {
          const Icon = t.icon
          const isActive = currentTab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors duration-150 ${
                isActive
                  ? 'text-aerojet-blue dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="staff-exams-tab"
                  className="absolute inset-0 bg-white shadow-md ring-1 ring-black/5 dark:bg-slate-700 dark:ring-white/10"
                  style={{ borderRadius: 9999, zIndex: 0 }}
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                />
              )}
              <Icon className="relative z-10 h-3.5 w-3.5" />
              <span className="relative z-10">{t.label}</span>
            </button>
          )
        })}
      </div>

      {children}
    </div>
  )
}
