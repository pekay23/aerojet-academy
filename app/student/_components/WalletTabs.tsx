'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Wallet, PlusCircle, History, CreditCard } from 'lucide-react'
import { motion } from 'framer-motion'

const ALL_TABS = [
  { key: 'overview', label: 'Overview', icon: Wallet },
  { key: 'top-up', label: 'Top Up', icon: PlusCircle },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'transactions', label: 'Transactions', icon: History },
] as const

export default function WalletTabs({ children, enrollmentType }: { children: React.ReactNode; enrollmentType?: string | null }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'overview'

  // Hide Payments tab for MODULAR and EXAM_ONLY students
  const hideMilestones = enrollmentType === 'EXAM_ONLY' || enrollmentType === 'MODULAR'
  const tabs = hideMilestones ? ALL_TABS.filter((t) => t.key !== 'payments') : ALL_TABS

  const setTab = (tab: string) => {
    router.push(`/student/wallet?tab=${tab}`, { scroll: false })
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-aerojet-blue sm:text-3xl dark:text-white">
          My Wallet
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage your training funds and track your transactions.
        </p>
      </div>

      {/* Tab Bar */}
      <div className="relative flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800" role="tablist" aria-label="Wallet sections">
        {tabs.map((t) => {
          const Icon = t.icon
          const isActive = currentTab === t.key
          return (
            <button
              key={t.key}
              id={`tab-${t.key}`}
              role="tab"
              aria-selected={isActive}
              aria-controls="wallet-tabpanel"
              aria-label={t.label}
              onClick={() => setTab(t.key)}
              className={`relative flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-aerojet-blue/50 ${
                isActive
                  ? 'text-aerojet-blue dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="wallet-tab"
                  className="absolute inset-0 bg-white shadow-sm dark:bg-slate-700"
                  style={{ borderRadius: 8, zIndex: 0 }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon className="relative z-10 h-3.5 w-3.5" aria-hidden="true" />
              <span className="relative z-10 hidden sm:inline">{t.label}</span>
            </button>
          )
        })}
      </div>

      <div role="tabpanel" id="wallet-tabpanel" aria-labelledby={`tab-${currentTab}`}>
        {children}
      </div>
    </div>
  )
}
