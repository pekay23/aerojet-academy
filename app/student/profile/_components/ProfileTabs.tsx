'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { User, Settings, Lock } from 'lucide-react'
import { motion } from 'framer-motion'

const TABS = [
  { key: 'info', label: 'Personal Info', icon: User },
  { key: 'settings', label: 'Settings', icon: Settings },
  { key: 'password', label: 'Password', icon: Lock },
] as const

export default function ProfileTabs({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'info'

  const setTab = (tab: string) => {
    router.push(`/student/profile?tab=${tab}`, { scroll: false })
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-aerojet-blue sm:text-3xl dark:text-white">
          My Profile
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage your personal and academic information.
        </p>
      </div>

      {/* Tab Bar */}
      <div className="relative flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800" role="tablist" aria-label="Profile sections">
        {TABS.map((t) => {
          const Icon = t.icon
          const isActive = currentTab === t.key
          return (
            <button
              key={t.key}
              id={`tab-${t.key}`}
              role="tab"
              aria-selected={isActive}
              aria-controls="profile-tabpanel"
              onClick={() => setTab(t.key)}
              className={`relative flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-aerojet-blue/50 ${
                isActive
                  ? 'text-aerojet-blue dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="profile-tab"
                  className="absolute inset-0 bg-white shadow-sm dark:bg-slate-700"
                  style={{ borderRadius: 8, zIndex: 0 }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon className="relative z-10 h-3.5 w-3.5" aria-hidden="true" />
              <span className="relative z-10">{t.label}</span>
            </button>
          )
        })}
      </div>

      <div role="tabpanel" id="profile-tabpanel" aria-labelledby={`tab-${currentTab}`}>
        {children}
      </div>
    </div>
  )
}
