'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Users, UserCheck, GraduationCap, UserCog, ShieldCheck } from 'lucide-react'
import MotionTabs from '@/components/ui/MotionTabs'
import UsersTable from './UsersTable'
import ApplicantsQueue from './ApplicantsQueue'
import StudentsTable from './StudentsTable'
import InstructorsTable from './InstructorsTable'
import ExaminersTable from './ExaminersTable'
import type { ApplicantSummary, ApplicantCounts } from '@/lib/types/staff'

const TAB_DEFS = [
  { key: 'all', label: 'All Users', icon: Users },
  { key: 'applicants', label: 'Applicants', icon: UserCheck },
  { key: 'students', label: 'Students', icon: GraduationCap },
  { key: 'instructors', label: 'Instructors', icon: UserCog },
  { key: 'examiners', label: 'Examiners', icon: ShieldCheck },
] as const

type TabKey = (typeof TAB_DEFS)[number]['key']

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

export default function PeopleTabs({
  initialTab,
  _initialApplicants,
  _initialTotal,
  initialApplicantCounts,
}: {
  initialTab?: string
  _initialApplicants?: ApplicantSummary[]
  _initialTotal?: number
  initialApplicantCounts?: ApplicantCounts
}) {
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

  const tabs = TAB_DEFS.map((t) => ({
    ...t,
    badge:
      t.key === 'applicants'
        ? counts.applicantAll
        : t.key === 'examiners'
          ? counts.examinerAll
          : undefined,
  }))

  const studentCounts = {
    all: counts.studentAll,
    active: counts.studentActive,
    suspended: counts.studentSuspended,
    archived: counts.studentArchived,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-aerojet-blue text-2xl font-black tracking-tight uppercase dark:text-white">
          People
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage all users, applicants, students, and instructors
        </p>
      </div>

      <MotionTabs
        tabs={tabs}
        activeTab={currentTab}
        onChange={(tab) => router.push(`/staff/users?tab=${tab}`, { scroll: false })}
        layoutId="people-tab"
        ariaLabel="People management"
      />

      <div>
        {currentTab === 'all' && <UsersTable initialTotal={counts.total} />}
        {currentTab === 'applicants' && (
          <ApplicantsQueue
            initialCounts={
              initialApplicantCounts ?? { all: 0, pending_payment: 0, pending_approval: 0 }
            }
          />
        )}
        {currentTab === 'students' && <StudentsTable initialCounts={studentCounts} />}
        {currentTab === 'instructors' && <InstructorsTable />}
        {currentTab === 'examiners' && <ExaminersTable />}
      </div>
    </div>
  )
}
