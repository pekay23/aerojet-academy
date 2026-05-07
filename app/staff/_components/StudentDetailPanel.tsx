'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  X,
  User,
  Mail,
  Phone,
  Globe,
  Calendar,
  BookOpen,
  Wallet,
  GraduationCap,
  FileCheck,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import UserActionsMenu from './UserActionsMenu'
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay'
import ManualWalletAdjustmentDialog from '../users/[id]/_components/ManualWalletAdjustmentDialog'
import { UserStatus, EnrollmentStatus, PaymentStatus } from '@/types/enums'

interface Student {
  id: string
  email: string
  personalEmail?: string | null
  academyEmail?: string | null
  status: string
  emailVerified?: string | null
  createdAt: string
  profile?: {
    firstName: string
    middleName?: string | null
    lastName: string
    phone?: string | null
    nationality?: string | null
    dateOfBirth?: string | null
    profilePhotoUrl?: string | null
  } | null
  studentProfile?: {
    studentId?: string | null
    programType?: string | null
    cohort?: string | null
    licenceCategory?: string | null
    enrolledAt?: string | null
    fundingSource?: string | null
    academicYear?: { name: string } | null
    semester?: { name: string } | null
    pathwayRel?: { name: string; code: string } | null
  } | null
  wallet?: {
    availableBalance: number
    balance: number
    currency: string
  } | null
  examResults?: {
    id: string
    score: number
    passed: boolean
    exam: {
      name: string
      examDate: Date
      examComponent?: { course?: { name: string; code: string } }
    }
    certificateUrl?: string | null
  }[]
  examBookings?: {
    id: string
    moduleCode?: string | null
    examDate?: Date | null
    bookedAt: Date
    status: string
    result?: string | null
    score?: number | null
    examCategory?: string | null
    attemptType?: string | null
    exam?: {
      name: string
      examComponent?: { course?: { name: string; code: string } }
    }
  }[]
  enrollments?: {
    id: string
    status: string
    course: { code: string; name: string }
  }[]
}

const STATUS_STYLE: Record<string, string> = {
  [UserStatus.ACTIVE]: 'bg-emerald-100 text-emerald-700',
  [UserStatus.SUSPENDED]: 'bg-amber-100 text-amber-700',
  [UserStatus.ARCHIVED]: 'bg-slate-100 text-slate-500',
  [UserStatus.PENDING]: 'bg-blue-100 text-blue-700',
}

const TABS = ['Overview', 'Enrollments', 'Exams'] as const
type Tab = (typeof TABS)[number]

interface Props {
  student: Student | null
  onClose: () => void
  onActionComplete: () => void
  viewCurrency?: string
  onCurrencyChange?: (currency: string) => void
}


function slugify(text: string) {
  return text?.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-') || '';
}

export default function StudentDetailPanel({
  student: initialStudent,
  onClose,
  onActionComplete,
  viewCurrency,
  onCurrencyChange,
}: Props) {
  const [tab, setTab] = useState<Tab>('Overview')
  const [student, setStudent] = useState<Student | null>(initialStudent)
  const [loading, setLoading] = useState(false)

  // Fetch full student details when selected
  useEffect(() => {
    if (!initialStudent) {
      setStudent(null)
      return
    }

    const fetchFullDetails = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/staff/students/${initialStudent.id}`)
        if (res.ok) {
          const data = await res.json()
          setStudent(data.data) // apiSuccess wraps in 'data'
        }
      } catch (err) {
        console.error('Failed to fetch student details:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchFullDetails()
  }, [initialStudent])

  if (!initialStudent) {
    return (
      <div className="hidden flex-1 flex-col items-center justify-center bg-slate-50 text-center lg:flex dark:bg-slate-800/50">
        <GraduationCap className="mb-3 h-12 w-12 text-slate-200" />
        <p className="text-sm font-bold text-slate-400">Select a student to view details</p>
      </div>
    )
  }

  const currentStudent = student || initialStudent
  const fullName = currentStudent.profile
    ? [
        currentStudent.profile.firstName,
        currentStudent.profile.middleName,
        currentStudent.profile.lastName,
      ]
        .filter(Boolean)
        .join(' ')
    : currentStudent.email
  const initials = currentStudent.profile
    ? `${currentStudent.profile.firstName[0]}${currentStudent.profile.lastName[0]}`
    : currentStudent.email[0].toUpperCase()
  const statusStyle = STATUS_STYLE[currentStudent.status] ?? 'bg-slate-100 text-slate-500'
  const walletBal = Number(currentStudent.wallet?.availableBalance ?? 0)

  // Helper: check if a result string means the exam is completed (case-insensitive)
  const COMPLETED_RESULT_VALUES = ['pass', 'fail', 'absent', 'no_show', 'noshow', 'withdrawn']
  const isCompletedResult = (result: string | null | undefined) =>
    !!result && COMPLETED_RESULT_VALUES.includes(result.toLowerCase())

  // Helper: check if a booking status means it's still upcoming/pending
  const UPCOMING_STATUSES = ['APPROVED', 'PENDING', 'CONFIRMED']
  const isUpcomingBooking = (booking: any) =>
    !isCompletedResult(booking.result) && 
    booking.score == null && 
    (UPCOMING_STATUSES.includes(booking.status) || (!booking.result && booking.status !== 'COMPLETED'))

  // ---- Build separate lists ----

  // 1. Exam Results from the ExamResult table (formal grades)
  const formalResults = (currentStudent.examResults || []).map((r: any) => ({
    id: r.id,
    source: 'result' as const,
    type: 'FORMAL',
    moduleCode: r.moduleCode || r.exam?.examComponent?.course?.code || '—',
    examName: r.exam?.name || 'Exam Result',
    date: r.exam?.examDate || r.createdAt,
    score: r.score != null ? Number(r.score) : null,
    passed: r.passed,
    result: r.passed ? 'PASS' : 'FAIL',
    examCategory: r.examCategory,
    attemptType: r.attemptType,
  }))

  // 2. Completed bookings (have a definitive result like pass/fail, or a score)
  const completedBookings = (currentStudent.examBookings || [])
    .filter((b: any) => isCompletedResult(b.result) || (b.score != null && b.status === 'COMPLETED'))
    .map((b: any) => ({
      id: b.id,
      source: 'booking' as const,
      type: 'MANUAL',
      moduleCode: b.moduleCode || '—',
      examName: b.exam?.name || 'Exam Booking',
      date: b.examDate || b.bookedAt,
      score: b.score != null ? Number(b.score) : null,
      passed: b.result?.toLowerCase() === 'pass',
      result: b.result?.toUpperCase() || (b.score != null ? 'SCORED' : null),
      examCategory: b.examCategory,
      attemptType: b.attemptType,
    }))

  // 3. Upcoming bookings — no completed result, still pending/approved
  const upcomingExamsList = (currentStudent.examBookings || [])
    .filter((b: any) => isUpcomingBooking(b))
    .map((b: any) => ({
      id: b.id,
      source: 'booking' as const,
      type: b.exam?.name ? 'BOOKED' : 'MANUAL',
      moduleCode: b.moduleCode || '—',
      examName: b.exam?.name || 'Upcoming Exam',
      date: b.examDate || b.bookedAt,
      paymentStatus: b.status,
      examCategory: b.examCategory,
      attemptType: b.attemptType,
    }))
    .sort((a: any, b: any) => {
      const da = a.date ? new Date(a.date).getTime() : 0
      const db = b.date ? new Date(b.date).getTime() : 0
      return da - db
    })

  // ---- Consolidate completed history (deduplicate results + bookings for same module) ----
  const allExamHistory: any[] = []
  const usedResultIds = new Set<string>()

  // For each completed booking, try to find a matching formal result
  completedBookings.forEach((booking) => {
    const matchingResult = formalResults.find(
      (r) =>
        !usedResultIds.has(r.id) &&
        r.moduleCode?.toUpperCase() === booking.moduleCode?.toUpperCase() &&
        ((r.attemptType || 'FIRST') === (booking.attemptType || 'FIRST') ||
         r.attemptType === 'MIGRATED' || booking.attemptType === 'MIGRATED' ||
         !r.attemptType || !booking.attemptType)
    )

    if (matchingResult) {
      usedResultIds.add(matchingResult.id)
      // Merge: prefer formal result data but keep booking metadata
      allExamHistory.push({
        ...booking,
        type: 'FORMAL',
        score: matchingResult.score ?? booking.score,
        passed: matchingResult.passed,
        result: matchingResult.result,
        examCategory: matchingResult.examCategory || booking.examCategory,
        isConsolidated: true,
      })
    } else {
      allExamHistory.push(booking)
    }
  })

  // Add any remaining formal results that weren't matched to a booking
  formalResults.forEach((r) => {
    if (!usedResultIds.has(r.id)) {
      allExamHistory.push(r)
    }
  })

  // Sort by date descending
  allExamHistory.sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0
    const db = b.date ? new Date(b.date).getTime() : 0
    return db - da
  })

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-1 flex-col overflow-y-auto bg-white dark:bg-slate-900 lg:static lg:z-0 lg:flex lg:bg-slate-50 dark:lg:bg-slate-800/50 ${
        student ? 'flex' : 'hidden'
      }`}
      style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,0.08) transparent' }}
    >
      {/* Profile Header */}
      <div className="border-b border-slate-100 bg-white px-8 pt-8 pb-0 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-5">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-aerojet-blue text-xl font-black text-white">
              {currentStudent.profile?.profilePhotoUrl ? (
                <img
                  src={currentStudent.profile.profilePhotoUrl}
                  alt={fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-200">{fullName}</h2>
              <p className="mt-0.5 flex items-center gap-2 text-sm text-slate-400">
                <span className="font-mono">{currentStudent.studentProfile?.studentId ?? '—'}</span>
                {currentStudent.studentProfile?.cohort && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <span>{currentStudent.studentProfile.cohort}</span>
                  </>
                )}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${statusStyle}`}
                >
                  {currentStudent.status}
                </span>
                {currentStudent.studentProfile?.programType && (
                  <span className="rounded-full bg-aerojet-blue/10 px-2 py-0.5 text-[10px] font-black text-aerojet-blue uppercase">
                    {currentStudent.studentProfile.programType.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <UserActionsMenu
              userId={currentStudent.id}
              userStatus={currentStudent.status}
              userEmail={currentStudent.email}
              isEmailVerified={!!currentStudent.emailVerified}
              onActionComplete={onActionComplete}
            />
            <a
              href={`/staff/students/${slugify(currentStudent.profile ? `${currentStudent.profile.firstName} ${currentStudent.profile.lastName}` : currentStudent.email.split('@')[0])}`}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black tracking-widest text-slate-500 uppercase shadow-sm transition-all hover:border-aerojet-sky hover:text-aerojet-sky dark:border-slate-700 dark:bg-slate-800"
              title="Open Full Profile"
            >
              <ExternalLink className="h-3 w-3" />
              Full Profile
            </a>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="relative flex gap-6 border-b border-slate-100 dark:border-slate-800">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative pb-3 text-sm font-bold transition-all ${
                tab === t ? 'text-aerojet-blue' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab === t && (
                <motion.div
                  layoutId="student-detail-underline"
                  className="absolute bottom-0 left-0 h-0.5 w-full bg-aerojet-blue"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6 px-8 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-aerojet-blue" />
            <p className="mt-2 text-sm font-bold text-slate-400">Loading student details...</p>
          </div>
        ) : (
          <>
            {tab === 'Overview' && (
              <>
                <Section title="Personal Information">
                  <Grid2>
                    {currentStudent.academyEmail && (
                      <Field
                        icon={Mail}
                        label="Academy Email"
                        value={currentStudent.academyEmail}
                      />
                    )}
                    {currentStudent.personalEmail ? (
                      <Field
                        icon={Mail}
                        label="Personal Email"
                        value={currentStudent.personalEmail}
                      />
                    ) : (
                      !currentStudent.academyEmail && (
                        <Field icon={Mail} label="Email" value={currentStudent.email} />
                      )
                    )}
                    <Field
                      icon={Phone}
                      label="Phone"
                      value={currentStudent.profile?.phone ?? '—'}
                    />
                    <Field
                      icon={Globe}
                      label="Nationality"
                      value={currentStudent.profile?.nationality ?? '—'}
                    />
                    <Field
                      icon={Calendar}
                      label="Date of Birth"
                      value={
                        currentStudent.profile?.dateOfBirth
                          ? new Date(currentStudent.profile.dateOfBirth).toLocaleDateString(
                              'en-GB',
                              {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              }
                            )
                          : '—'
                      }
                    />
                  </Grid2>
                </Section>

                <Section title="Programme Details">
                  <Grid2>
                    <Field
                      icon={GraduationCap}
                      label="Programme"
                      value={currentStudent.studentProfile?.programType?.replace(/_/g, ' ') ?? '—'}
                    />
                    <Field
                      icon={BookOpen}
                      label="Licence Category"
                      value={currentStudent.studentProfile?.licenceCategory ?? '—'}
                    />
                    <Field
                      icon={Globe}
                      label="Pathway"
                      value={currentStudent.studentProfile?.pathwayRel?.name ?? '—'}
                    />
                    <Field
                      icon={Calendar}
                      label="Enrolled"
                      value={
                        currentStudent.studentProfile?.enrolledAt
                          ? new Date(currentStudent.studentProfile.enrolledAt).toLocaleDateString(
                              'en-GB',
                              {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              }
                            )
                          : '—'
                      }
                    />
                    <Field
                      icon={User}
                      label="Cohort"
                      value={currentStudent.studentProfile?.cohort ?? '—'}
                    />
                    <Field
                      icon={Wallet}
                      label="Funding Source"
                      value={currentStudent.studentProfile?.fundingSource?.replace(/_/g, ' ') ?? '—'}
                    />
                    {currentStudent.studentProfile?.academicYear && (
                      <Field
                        icon={Calendar}
                        label="Academic Period"
                        value={`${currentStudent.studentProfile.academicYear.name}${currentStudent.studentProfile.semester ? ` / ${currentStudent.studentProfile.semester.name}` : ''}`}
                      />
                    )}
                  </Grid2>
                </Section>

                {/* Wallet Summary on Overview */}
                <Section title="Wallet Summary">
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className={`rounded-xl p-3 ${(Number(currentStudent.wallet?.availableBalance ?? 0)) >= 0 ? 'border border-emerald-100 bg-emerald-50' : 'border border-red-100 bg-red-50'}`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                          Available
                        </p>
                        <ManualWalletAdjustmentDialog
                          userId={currentStudent.id}
                          userName={fullName}
                          currentBalance={walletBal}
                          currency={currentStudent.wallet?.currency || 'EUR'}
                          onSuccess={() => {
                            onActionComplete()
                            const refetch = async () => {
                              try {
                                const res = await fetch(`/api/staff/students/${currentStudent.id}`)
                                if (res.ok) {
                                  const data = await res.json()
                                  setStudent(data.data)
                                }
                              } catch (err) {
                                console.error(err)
                              }
                            }
                            refetch()
                          }}
                        />
                      </div>
                      <CurrencyDisplay
                        amount={Number(currentStudent.wallet?.availableBalance ?? 0)}
                        baseCurrency={currentStudent.wallet?.currency || 'EUR'}
                        currency={viewCurrency}
                        clickToToggle={true}
                        onCurrencyChange={onCurrencyChange}
                        size="sm"
                        amountClassName={
                          (Number(currentStudent.wallet?.availableBalance ?? 0)) >= 0
                            ? 'text-emerald-700!'
                            : 'text-red-600!'
                        }
                      />
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                      <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        Total
                      </p>
                      <CurrencyDisplay
                        amount={Number(currentStudent.wallet?.balance ?? 0)}
                        baseCurrency={currentStudent.wallet?.currency || 'EUR'}
                        currency={viewCurrency}
                        clickToToggle={true}
                        onCurrencyChange={onCurrencyChange}
                        size="sm"
                        amountClassName="text-slate-700!"
                      />
                    </div>
                  </div>
                </Section>
              </>
            )}

            {tab === 'Enrollments' && (
              <Section title="Current Enrollments">
                {!currentStudent.enrollments?.length ? (
                  <EmptyState icon={BookOpen} message="No active enrollments" />
                ) : (
                  <div className="space-y-2">
                    {currentStudent.enrollments.map((e) => (
                      <div
                        key={e.id}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            {e.course.name}
                          </p>
                          <p className="font-mono text-xs text-slate-400">{e.course.code}</p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                            e.status === EnrollmentStatus.ACTIVE
                              ? 'bg-emerald-100 text-emerald-700'
                              : e.status === EnrollmentStatus.GRADUATED
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {e.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            )}

            {tab === 'Exams' && (
              <ExamTabContent
                upcomingExams={upcomingExamsList}
                allExamHistory={allExamHistory}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

type ExamFilter = 'ALL' | 'PASSED' | 'FAILED' | 'PENDING'

function ExamTabContent({
  upcomingExams,
  allExamHistory,
}: {
  upcomingExams: any[]
  allExamHistory: any[]
}) {
  const [filter, setFilter] = useState<ExamFilter>('ALL')

  const filteredHistory = allExamHistory.filter((h) => {
    if (filter === 'ALL') return true
    if (filter === 'PASSED') return h.passed
    if (filter === 'FAILED') return !h.passed && h.result !== 'ABSENT' && h.result !== 'SCORED'
    return false
  })

  const showUpcoming = filter === 'ALL' || filter === 'PENDING'

  const filters: { key: ExamFilter; label: string; count: number }[] = [
    { key: 'ALL', label: 'All', count: allExamHistory.length + upcomingExams.length },
    { key: 'PASSED', label: 'Passed', count: allExamHistory.filter((h) => h.passed).length },
    { key: 'FAILED', label: 'Failed', count: allExamHistory.filter((h) => !h.passed && h.result !== 'ABSENT').length },
    { key: 'PENDING', label: 'Pending', count: upcomingExams.length },
  ]

  return (
    <>
      {/* Filter Chips */}
      <div className="flex flex-wrap gap-1.5">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
              filter === f.key
                ? 'bg-aerojet-blue text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Upcoming/Pending Exams */}
      {showUpcoming && upcomingExams.length > 0 && (
        <Section title="Upcoming / Pending Exams">
          <div className="space-y-2">
            {upcomingExams.map((exam, idx) => (
              <div
                key={`upcoming-${exam.id}-${idx}`}
                className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 dark:border-blue-900/30 dark:bg-blue-900/20"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {exam.moduleCode}
                    </span>
                    <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase bg-blue-100 text-blue-600">
                      {exam.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate text-xs text-slate-500">
                    <span>{exam.examName}</span>
                    {exam.examCategory && (
                      <span className={`shrink-0 rounded-full px-1 py-0.5 text-[8px] font-bold ${
                        exam.examCategory === 'INTERNAL' 
                          ? 'bg-amber-100/50 text-amber-700' 
                          : 'bg-blue-100/50 text-blue-700'
                      }`}>
                        {exam.examCategory === 'INTERNAL' ? 'INT' : 'EASA'}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {exam.date ? new Date(exam.date).toLocaleDateString() : '—'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                    exam.paymentStatus === PaymentStatus.APPROVED || exam.paymentStatus === PaymentStatus.COMPLETED
                      ? 'bg-blue-100 text-blue-700'
                      : exam.paymentStatus === PaymentStatus.REJECTED
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                  }`}>
                    {exam.paymentStatus === PaymentStatus.APPROVED || exam.paymentStatus === PaymentStatus.COMPLETED
                      ? 'UPCOMING'
                      : exam.paymentStatus === PaymentStatus.REJECTED
                        ? 'REJECTED'
                        : 'PAYMENT PENDING'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Completed Exam History */}
      {(filter === 'ALL' || filter === 'PASSED' || filter === 'FAILED') && (
        <Section title="Exam History">
          {!filteredHistory.length ? (
            <EmptyState icon={FileCheck} message="No exam records match this filter" />
          ) : (
            <div className="space-y-2">
              {filteredHistory.map((h, idx) => (
                <div
                  key={`${h.type}-${h.id}-${idx}`}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {h.moduleCode}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                          h.type === 'FORMAL'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-slate-50 text-slate-500'
                        }`}
                      >
                        {h.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate text-xs text-slate-500">
                      <span>{h.examName}</span>
                      {h.examCategory && (
                        <span className={`shrink-0 rounded-full px-1 py-0.5 text-[8px] font-bold ${
                          h.examCategory === 'INTERNAL' 
                            ? 'bg-amber-100/50 text-amber-700' 
                            : 'bg-blue-100/50 text-blue-700'
                        }`}>
                          {h.examCategory === 'INTERNAL' ? 'INT' : 'EASA'}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {h.date ? new Date(h.date).toLocaleDateString() : '—'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-mono text-xs font-black">
                      {h.score !== null ? `${h.score}%` : '—'}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                        h.passed
                          ? 'bg-emerald-100 text-emerald-700'
                          : h.result === 'ABSENT' || h.result === 'SCORED' || h.result === 'PENDING' || h.result === 'BOOKED'
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {h.result || (h.passed ? 'PASS' : 'FAIL')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">
        {title}
      </h3>
      {children}
    </div>
  )
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4">{children}</div>
}

function Field({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
      <p className="mb-1 flex items-center gap-1.5 text-[10px] font-black tracking-widest text-slate-400 uppercase">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <p className="truncate text-sm font-bold text-slate-700">{value}</p>
    </div>
  )
}

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <Icon className="mb-2 h-8 w-8 text-slate-200" />
      <p className="text-sm font-bold text-slate-400">{message}</p>
    </div>
  )
}
