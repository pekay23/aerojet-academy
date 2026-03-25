'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Users, UserCheck, GraduationCap, UserCog } from 'lucide-react'
import { motion } from 'framer-motion'
import { Suspense } from 'react'
import UsersTable from './UsersTable'
import ApplicantsQueue from './ApplicantsQueue'
import StudentsTable from './StudentsTable'
import InstructorsTable from './InstructorsTable'

const TABS = [
  { key: 'all', label: 'All Users', icon: Users },
  { key: 'applicants', label: 'Applicants', icon: UserCheck },
  { key: 'students', label: 'Students', icon: GraduationCap },
  { key: 'instructors', label: 'Instructors', icon: UserCog },
] as const

type TabKey = (typeof TABS)[number]['key']

interface PeopleTabsProps {
  initialTab?: string
  initialTotal: number
  applicantCounts: { all: number; pending_payment: number; pending_approval: number }
  studentCounts: { all: number; active: number; suspended: number; archived: number }
}

export default function PeopleTabs({
  initialTab,
  initialTotal,
  applicantCounts,
  studentCounts,
}: PeopleTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = (searchParams.get('tab') as TabKey) || initialTab || 'all'

  const setTab = (tab: string) => {
    router.push(`/staff/users?tab=${tab}`, { scroll: false })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-aerojet-blue uppercase dark:text-white">
          People
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage all users, applicants, students, and instructors
        </p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 rounded-2xl bg-slate-100 p-1.5 shadow-inner ring-1 ring-black/5 dark:bg-slate-800/80 dark:ring-white/5">
        {TABS.map((t) => {
          const Icon = t.icon
          const isActive = currentTab === t.key
          const badge =
            t.key === 'applicants' && applicantCounts.all > 0 ? applicantCounts.all : undefined

          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors duration-150 ${
                isActive
                  ? 'text-aerojet-blue dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="people-tab"
                  className="absolute inset-0 bg-white shadow-md ring-1 ring-black/5 dark:bg-slate-700 dark:ring-white/10"
                  style={{ borderRadius: 9999, zIndex: 0 }}
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                />
              )}
              <Icon className="relative z-10 h-3.5 w-3.5" />
              <span className="relative z-10 hidden sm:inline">{t.label}</span>
              {badge !== undefined && (
                <span className="relative z-10 rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-black text-white">
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div>
        {currentTab === 'all' && <UsersTable initialTotal={initialTotal} />}
        {currentTab === 'applicants' && <ApplicantsQueue initialCounts={applicantCounts} />}
        {currentTab === 'students' && <StudentsTable initialCounts={studentCounts} />}
        {currentTab === 'instructors' && <InstructorsTable />}
      </div>
    </div>
  )
}
