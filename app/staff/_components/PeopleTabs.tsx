'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Users, UserCheck, GraduationCap, UserCog, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import UsersTable from './UsersTable'
import ApplicantsQueue from './ApplicantsQueue'
import StudentsTable from './StudentsTable'
import InstructorsTable from './InstructorsTable'
import ExaminersTable from './ExaminersTable'

const TABS = [
  { key: 'all', label: 'All Users', icon: Users },
  { key: 'applicants', label: 'Applicants', icon: UserCheck },
  { key: 'students', label: 'Students', icon: GraduationCap },
  { key: 'instructors', label: 'Instructors', icon: UserCog },
  { key: 'examiners', label: 'Examiners', icon: ShieldCheck },
] as const

type TabKey = (typeof TABS)[number]['key']

interface Counts {
  total: number
  applicantAll: number
  applicantPendingPayment: number
  applicantPendingApproval: number
  studentAll: number
  studentActive: number
  studentSuspended: number
  studentArchived: number
  examinerAll: number
}

const DEFAULT_COUNTS: Counts = {
  total: 0,
  applicantAll: 0,
  applicantPendingPayment: 0,
  applicantPendingApproval: 0,
  studentAll: 0,
  studentActive: 0,
  studentSuspended: 0,
  studentArchived: 0,
  examinerAll: 0,
}

interface PeopleTabsProps {
  initialTab?: string
}

export default function PeopleTabs({ initialTab }: PeopleTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = (searchParams.get('tab') as TabKey) || initialTab || 'all'
  const [counts, setCounts] = useState<Counts>(DEFAULT_COUNTS)

  useEffect(() => {
    fetch('/api/staff/users/counts')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) setCounts(data.data)
      })
      .catch(() => {})
  }, [])

  const setTab = (tab: string) => {
    router.push(`/staff/users?tab=${tab}`, { scroll: false })
  }

  const applicantCounts = {
    all: counts.applicantAll,
    pending_payment: counts.applicantPendingPayment,
    pending_approval: counts.applicantPendingApproval,
  }

  const studentCounts = {
    all: counts.studentAll,
    active: counts.studentActive,
    suspended: counts.studentSuspended,
    archived: counts.studentArchived,
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
      <div className="relative inline-flex gap-1 rounded-2xl bg-slate-100 p-1.5 shadow-inner ring-1 ring-black/5 dark:bg-slate-800/80 dark:ring-white/5">
        {TABS.map((t) => {
          const Icon = t.icon
          const isActive = currentTab === t.key
          const badge =
            t.key === 'applicants' && counts.applicantAll > 0 ? counts.applicantAll :
            t.key === 'examiners' && counts.examinerAll > 0 ? counts.examinerAll :
            undefined

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
        {currentTab === 'all' && <UsersTable initialTotal={counts.total} />}
        {currentTab === 'applicants' && <ApplicantsQueue initialCounts={applicantCounts} />}
        {currentTab === 'students' && <StudentsTable initialCounts={studentCounts} />}
        {currentTab === 'instructors' && <InstructorsTable />}
        {currentTab === 'examiners' && <ExaminersTable />}
      </div>
    </div>
  )
}
