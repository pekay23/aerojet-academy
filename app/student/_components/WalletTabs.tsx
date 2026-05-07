'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Wallet, PlusCircle, History, CreditCard } from 'lucide-react'
import MotionTabs from '@/components/ui/MotionTabs'

const ALL_TABS = [
  { key: 'overview', label: 'Overview', icon: Wallet },
  { key: 'top-up', label: 'Top Up', icon: PlusCircle },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'transactions', label: 'Transactions', icon: History },
]

export default function WalletTabs({
  children,
  studyMode,
}: {
  children: React.ReactNode
  studyMode?: string | null
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'overview'

  const showPaymentsTab = studyMode === 'FULL_TIME'
  const tabs = showPaymentsTab ? ALL_TABS : ALL_TABS.filter((t) => t.key !== 'payments')

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

      <MotionTabs
        tabs={tabs}
        activeTab={currentTab}
        onChange={(tab) => router.push(`/student/wallet?tab=${tab}`, { scroll: false })}
        layoutId="wallet-tab"
        ariaLabel="Wallet sections"
      />

      <div role="tabpanel" id="wallet-tabpanel" aria-labelledby={`tab-${currentTab}`}>
        {children}
      </div>
    </div>
  )
}
