'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { BarChart3, ArrowLeftRight, Wallet, FileCheck, FileBarChart2 } from 'lucide-react'
import MotionTabs from '@/components/ui/MotionTabs'

const TAB_DEFS = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { key: 'wallet-topups', label: 'Wallet Top-ups', icon: Wallet },
  { key: 'reconciliation', label: 'Reconciliation', icon: FileCheck },
  { key: 'reports', label: 'Reports', icon: FileBarChart2 },
]

export default function FinanceTabs({
  children,
  pendingTopupCount = 0,
}: {
  children: React.ReactNode
  pendingTopupCount?: number
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'overview'

  const tabs = TAB_DEFS.map((t) => ({
    ...t,
    badge: t.key === 'wallet-topups' ? pendingTopupCount : undefined,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-aerojet-blue sm:text-3xl dark:text-white">
          Finance
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Revenue overview, transactions, wallet top-ups, reconciliation, and reports.
        </p>
      </div>

      <MotionTabs
        tabs={tabs}
        activeTab={currentTab}
        onChange={(tab) => router.push(`/staff/finance?tab=${tab}`, { scroll: false })}
        layoutId="finance-tab"
        ariaLabel="Finance sections"
      />

      {children}
    </div>
  )
}
