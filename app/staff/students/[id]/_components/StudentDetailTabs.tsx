'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { User, ClipboardCheck, Wallet, BookOpen, FileText } from 'lucide-react'

import ProfileTab from './ProfileTab'
import ExamsTab from './ExamsTab'
import WalletTab from './WalletTab'
import AcademicTab from './AcademicTab'
import AdminNotesTab from './AdminNotesTab'

const TABS = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'exams', label: 'Exams', icon: ClipboardCheck },
  { key: 'wallet', label: 'Wallet', icon: Wallet },
  { key: 'academic', label: 'Academic', icon: BookOpen },
  { key: 'notes', label: 'Admin Notes', icon: FileText },
] as const

type TabKey = (typeof TABS)[number]['key']

interface Props {
  student: any
  examComponents: any[]
  upcomingEvents: any[]
  academicYears: any[]
  semesters: any[]
  studyPathways: any[]
  initialTab: string
}

export default function StudentDetailTabs({
  student,
  examComponents,
  upcomingEvents,
  academicYears,
  semesters,
  studyPathways,
  initialTab,
}: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>(
    TABS.find((t) => t.key === initialTab)?.key || 'profile'
  )

  const handleTabChange = useCallback(
    (tab: TabKey) => {
      setActiveTab(tab)
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
        <div className="flex gap-0 border-b border-slate-100 dark:border-slate-800">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`relative flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all ${
                  isActive
                    ? 'text-[#002a5c] dark:text-white'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="student-tab-underline"
                    className="absolute bottom-0 left-0 h-0.5 w-full bg-[#002a5c] dark:bg-white"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            )
          })}
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
          {activeTab === 'notes' && <AdminNotesTab student={student} onRefresh={handleRefresh} />}
        </div>
      </div>
    </div>
  )
}
