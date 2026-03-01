'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Wallet, PlusCircle, History } from 'lucide-react'
import { motion } from 'framer-motion'

const TABS = [
  { key: 'overview', label: 'Overview', icon: Wallet },
  { key: 'top-up', label: 'Top Up', icon: PlusCircle },
  { key: 'transactions', label: 'Transactions', icon: History },
] as const

export default function WalletTabs({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'overview'

  const setTab = (tab: string) => {
    router.push(`/student/wallet?tab=${tab}`, { scroll: false })
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl lg:text-3xl dark:text-slate-100">
          My Wallet
        </h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
          Manage your training funds and track your transactions.
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
                  ? 'text-[#002a5c] dark:text-white'
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
