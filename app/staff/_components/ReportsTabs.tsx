'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { BarChart3, TrendingUp, DollarSign, Users, Calendar, Award, GitCompareArrows } from 'lucide-react'
import MotionTabs from '@/components/ui/MotionTabs'

const TABS = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'enrollment', label: 'Enrollment', icon: TrendingUp },
  { key: 'revenue', label: 'Revenue', icon: DollarSign },
  { key: 'pools', label: 'Pools', icon: Users },
  { key: 'attendance', label: 'Attendance', icon: Calendar },
  { key: 'exams', label: 'Exams', icon: Award },
  { key: 'yoy', label: 'Year-on-Year', icon: GitCompareArrows },
]

export default function ReportsTabs({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'overview'

  return (
    <div className="space-y-6">
      <MotionTabs
        tabs={TABS}
        activeTab={currentTab}
        onChange={(tab) => router.push(`/staff/reports?tab=${tab}`, { scroll: false })}
        layoutId="reports-tab"
        ariaLabel="Report sections"
      />
      {children}
    </div>
  )
}
