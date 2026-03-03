'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { BarChart3, TrendingUp, DollarSign, Users, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'

const TABS = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'enrollment', label: 'Enrollment', icon: TrendingUp },
  { key: 'revenue', label: 'Revenue', icon: DollarSign },
  { key: 'pools', label: 'Pools', icon: Users },
  { key: 'attendance', label: 'Attendance', icon: Calendar },
] as const

export default function ReportsTabs({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'overview'

  const setTab = (tab: string) => {
    router.push(`/staff/reports?tab=${tab}`, { scroll: false })
  }

  return (
    <div className="space-y-6">
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
                  ? 'text-[#002a5c] dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="reports-tab"
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
