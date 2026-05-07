'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, ClipboardList, Trophy, FilePlus2 } from 'lucide-react'
import MotionTabs from '@/components/ui/MotionTabs'

const TABS = [
  { key: 'events', label: 'Events', icon: Calendar },
  { key: 'bookings', label: 'Bookings', icon: ClipboardList },
  { key: 'results', label: 'Results', icon: Trophy },
  { key: 'records', label: 'Records', icon: FilePlus2 },
]

export default function StaffExamsTabs({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'events'

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

      <MotionTabs
        tabs={TABS}
        activeTab={currentTab}
        onChange={(tab) => router.push(`/staff/exams?tab=${tab}`, { scroll: false })}
        layoutId="staff-exams-tab"
        ariaLabel="Exam management"
      />

      {children}
    </div>
  )
}
