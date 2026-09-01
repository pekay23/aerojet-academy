'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { User, ClipboardCheck, Wallet, BookOpen, FileText, Route, ClipboardList } from 'lucide-react'
import MotionTabs from '@/components/ui/MotionTabs'

import ProfileTab from './ProfileTab'
import ExamsTab from './ExamsTab'
import WalletTab from './WalletTab'
import AcademicTab from './AcademicTab'
import AdminNotesTab from './AdminNotesTab'
import JourneyTab from './JourneyTab'

const TABS = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'journey', label: 'Journey', icon: Route },
  { key: 'exams', label: 'Exams', icon: ClipboardCheck },
  { key: 'wallet', label: 'Wallet', icon: Wallet },
  { key: 'academic', label: 'Academic', icon: BookOpen },
  { key: 'notes', label: 'Admin Notes', shortLabel: 'Notes', icon: FileText },
]

type TabKey = (typeof TABS)[number]['key']

interface Props {
  student: any
  examComponents: any[]
  upcomingEvents: any[]
  academicYears: any[]
  semesters: any[]
  studyPathways: any[]
  initialTab: string
  staffId: string
  staffRole: string
}

export default function StudentDetailTabs({
  student,
  examComponents,
  upcomingEvents,
  academicYears,
  semesters,
  studyPathways,
  initialTab,
  staffId,
  staffRole,
}: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>(
    TABS.find((t) => t.key === initialTab)?.key || 'profile'
  )

  const handleTabChange = useCallback(
    (tab: string) => {
      setActiveTab(tab as TabKey)
      router.replace(`/staff/students/${student.id}?tab=${tab}`, { scroll: false })
    },
    [router, student.id]
  )

  const handleRefresh = useCallback(() => {
    router.refresh()
  }, [router])

  return (
    <div className="-mx-4 md:-mx-6 lg:-mx-8">
      {/* Tab Navigation */}
      <div className="mb-6 overflow-hidden border-x-0 border-t-0 border-slate-100 bg-white px-4 md:px-6 dark:border-slate-800 dark:bg-slate-900 md:border-x md:border-t">
        <div className="py-4 px-2">
          <MotionTabs
            tabs={TABS}
            activeTab={activeTab}
            onChange={handleTabChange}
            layoutId="student-detail-tab"
            ariaLabel="Student detail sections"
            className="flex-wrap"
          />
        </div>

        {/* Tab Content */}
        <div className="p-4 md:p-6">
          {activeTab === 'profile' && (
            <ProfileTab
              student={student}
              academicYears={academicYears}
              semesters={semesters}
              studyPathways={studyPathways}
              onRefresh={handleRefresh}
            />
          )}
          {activeTab === 'journey' && <JourneyTab student={student} />}
          {activeTab === 'exams' && (
            <ExamsTab
              student={student}
              examComponents={examComponents}
              upcomingEvents={upcomingEvents}
              academicYears={academicYears}
              semesters={semesters}
              onRefresh={handleRefresh}
            />
          )}
          {activeTab === 'wallet' && <WalletTab student={student} onRefresh={handleRefresh} />}
          {activeTab === 'academic' && <AcademicTab student={student} onRefresh={handleRefresh} />}
          {activeTab === 'notes' && <AdminNotesTab student={student} onRefresh={handleRefresh} staffId={staffId} staffRole={staffRole} />}
          {activeTab === 'practical' && <PracticalTab student={student} onRefresh={handleRefresh} />}
        </div>
      </div>
    </div>
  )
}
