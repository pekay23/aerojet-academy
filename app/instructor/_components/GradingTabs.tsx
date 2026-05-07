'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ClipboardList, History } from 'lucide-react'
import MotionTabs from '@/components/ui/MotionTabs'

const TABS = [
  { key: 'pending', label: 'Pending', icon: ClipboardList },
  { key: 'history', label: 'History', icon: History },
]

export default function GradingTabs({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'pending'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
          Grading
        </h1>
        <p className="mt-2 text-lg font-medium text-slate-500 dark:text-slate-400">
          Review, submit, and manage student assessment results.
        </p>
      </div>

      <MotionTabs
        tabs={TABS}
        activeTab={currentTab}
        onChange={(tab) => router.push(`/instructor/grading?tab=${tab}`, { scroll: false })}
        layoutId="grading-tab"
        ariaLabel="Grading sections"
      />

      {children}
    </div>
  )
}
