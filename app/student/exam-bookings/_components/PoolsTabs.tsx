'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { FileCheck, Users, User, Layers, RefreshCcw } from 'lucide-react'
import MotionTabs, { type MotionTab } from '@/components/ui/MotionTabs'

const ALL_TABS: MotionTab[] = [
  { key: 'available', label: 'Join Available Exam Pools', shortLabel: 'Pools', icon: Users },
  { key: 'individual', label: 'Individual Booking', shortLabel: 'Individual', icon: User },
  { key: 'group', label: 'Group Booking', shortLabel: 'Group', icon: Layers },
  { key: 'resit', label: 'Exam Resit', shortLabel: 'Resit', icon: RefreshCcw },
  { key: 'my-bookings', label: 'My Bookings', shortLabel: 'My Bookings', icon: FileCheck },
]

export default function PoolsTabs({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'available'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-blue-800 sm:text-3xl dark:text-white">
          Exam Bookings
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Join a booking or create your own to secure your seat.
        </p>
      </div>

      <MotionTabs
        tabs={ALL_TABS}
        activeTab={currentTab}
        onChange={(tab) => router.push(`/student/exam-bookings?tab=${tab}`, { scroll: false })}
        layoutId="pools-tab"
        ariaLabel="Exam booking sections"
        className="flex-wrap"
      />

      <div role="tabpanel" id="pools-tabpanel" aria-labelledby={`tab-${currentTab}`}>
        {children}
      </div>
    </div>
  )
}
