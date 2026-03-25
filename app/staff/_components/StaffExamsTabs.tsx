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
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {TABS.map((t) => {
          const Icon = t.icon
          const isActive = currentTab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                isActive
                  ? 'text-aerojet-blue dark:text-white'
                  : 'text-slate-500 hover:bg-white/60 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-slate-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="staff-exams-tab"
                  className="absolute inset-0 bg-white shadow-sm dark:bg-slate-700"
                  style={{ borderRadius: 8, zIndex: 0 }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
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
