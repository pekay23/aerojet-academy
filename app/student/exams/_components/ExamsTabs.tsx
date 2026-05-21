'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { History, FileCheck, Calendar, RefreshCcw } from 'lucide-react'
import MotionTabs, { type MotionTab } from '@/components/ui/MotionTabs'

interface Props {
  isFullTime?: boolean
  canBookExams?: boolean
  children: React.ReactNode
}

const ALL_TABS: MotionTab[] = [
  { key: 'records', label: 'Exam Records', shortLabel: 'Records', icon: History },
  { key: 'bookings', label: 'My Bookings', shortLabel: 'My Bookings', icon: FileCheck },
  { key: 'book', label: 'Book Exam', shortLabel: 'Book', icon: Calendar },
  { key: 'resit', label: 'Resit', shortLabel: 'Resit', icon: RefreshCcw },
]

const FULL_TIME_TABS: MotionTab[] = [
  { key: 'records', label: 'Exam Records', shortLabel: 'Records', icon: History },
]

const HISTORY_ONLY_TABS: MotionTab[] = [
  { key: 'records', label: 'Exam Records', shortLabel: 'Records', icon: History },
  { key: 'bookings', label: 'My Bookings', shortLabel: 'My Bookings', icon: FileCheck },
]

export default function ExamsTabs({ isFullTime, canBookExams = false, children }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'records'

  const tabs = isFullTime ? FULL_TIME_TABS : canBookExams ? ALL_TABS : HISTORY_ONLY_TABS

  return (
    <div className="space-y-6">
      <MotionTabs
        tabs={tabs}
        activeTab={currentTab}
        onChange={(tab) => router.push(`/student/exams?tab=${tab}`, { scroll: false })}
        layoutId="exams-tab"
        ariaLabel="Exam sections"
      />

      <div role="tabpanel" id="exams-tabpanel" aria-labelledby={`tab-${currentTab}`}>
        {children}
      </div>
    </div>
  )
}
