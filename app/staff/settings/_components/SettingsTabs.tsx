'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  School,
  DollarSign,
  Mail,
  Globe,
  Sparkles,
  Send,
  Calendar,
  DatabaseBackup,
} from 'lucide-react'
import { motion } from 'framer-motion'

const TABS = [
  { key: 'general', label: 'General', icon: School },
  { key: 'finance', label: 'Finance', icon: DollarSign },
  { key: 'notifications', label: 'Notifications', icon: Mail },
  { key: 'system', label: 'System', icon: Globe },
  { key: 'welcome', label: 'Welcome', icon: Sparkles },
  { key: 'emails', label: 'Email Templates', icon: Send },
  { key: 'calendar', label: 'Calendar', icon: Calendar },
  { key: 'backup', label: 'Backup', icon: DatabaseBackup },
] as const

export default function SettingsTabs({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'general'

  const setTab = (tab: string) => {
    router.push(`/staff/settings?tab=${tab}`, { scroll: false })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[#002a5c] sm:text-3xl dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Configure your academy platform settings and preferences
        </p>
      </div>

      {/* Tab Bar */}
      <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {TABS.map((t) => {
          const Icon = t.icon
          const isActive = currentTab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                isActive
                  ? 'text-[#002a5c] dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="settings-tab"
                  className="absolute inset-0 bg-white shadow-sm dark:bg-slate-700"
                  style={{ borderRadius: 8, zIndex: 0 }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon className="relative z-10 h-3.5 w-3.5" />
              <span className="relative z-10 hidden sm:inline">{t.label}</span>
            </button>
          )
        })}
      </div>

      {children}
    </div>
  )
}
