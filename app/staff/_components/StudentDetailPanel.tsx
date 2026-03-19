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
  KeyRound,
  Loader2,
} from 'lucide-react'
import UserActionsMenu from './UserActionsMenu'
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay'
import ManualWalletAdjustmentDialog from '../users/[id]/_components/ManualWalletAdjustmentDialog'

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
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  SUSPENDED: 'bg-amber-100 text-amber-700',
  ARCHIVED: 'bg-slate-100 text-slate-500',
  PENDING: 'bg-blue-100 text-blue-700',
}

const TABS = ['Overview', 'Wallet', 'Enrollments', 'Exams'] as const
type Tab = (typeof TABS)[number]

interface Props {
  student: Student | null
  onClose: () => void
  onActionComplete: () => void
  viewCurrency?: string
  onCurrencyChange?: (currency: string) => void
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

  // Separate completed exams (with results) from upcoming/pending bookings
  const completedExamResults = currentStudent.examResults?.map((r: any) => ({
    id: r.id,
    type: 'FORMAL',
    moduleCode: r.exam.examComponent?.course?.code || '—',
    examName: r.exam.name,
    date: r.exam.examDate,
    score: Number(r.score),
    passed: r.passed,
    result: r.passed ? 'PASS' : 'FAIL',
  })) || []

  // Only include exam bookings that have a result (PASS, FAIL, ABSENT) - not pending/upcoming
  const completedExamBookings = currentStudent.examBookings
    ?.filter((r: any) => r.result && ['PASS', 'FAIL', 'ABSENT'].includes(r.result))
    .map((r: any) => ({
      id: r.id,
      type: 'MANUAL',
      moduleCode: r.moduleCode || '—',
      examName: r.exam?.name || 'Manual Record',
      date: r.examDate || r.bookedAt,
      score: r.score ? Number(r.score) : null,
      passed: r.result === 'PASS',
      result: r.result,
    })) || []

  // Upcoming/pending exams (no result yet)
  const upcomingExams = currentStudent.examBookings
    ?.filter((r: any) => !r.result || !['PASS', 'FAIL', 'ABSENT'].includes(r.result))
    .map((r: any) => ({
      id: r.id,
      type: r.exam?.name ? 'BOOKED' : 'MANUAL',
      moduleCode: r.moduleCode || '—',
      examName: r.exam?.name || 'Exam Booking',
      date: r.examDate || r.bookedAt,
      status: r.status,
    })) || []

  const allExamHistory = [...completedExamResults, ...completedExamBookings].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div
      className="hidden flex-1 flex-col overflow-y-auto bg-slate-50 lg:flex dark:bg-slate-800/50"
      style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,0.08) transparent' }}
    >
      {/* Profile Header */}
      <div className="border-b border-slate-100 bg-white px-8 pt-8 pb-0 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-5">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#002a5c] text-xl font-black text-white">
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
                  <span className="rounded-full bg-[#002a5c]/10 px-2 py-0.5 text-[10px] font-black text-[#002a5c] uppercase">
                    {currentStudent.studentProfile.programType.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
              <button
                onClick={async () => {
                  const btn = document.getElementById(
                    `resend-btn-${currentStudent.id}`
                  ) as HTMLButtonElement
                  if (btn) btn.disabled = true
                  try {
                    const res = await fetch(
                      `/api/staff/users/${currentStudent.id}/resend-credentials`,
                      {
                        method: 'POST',
                      }
                    )
                    if (!res.ok) throw new Error()
                    toast.success('Login credentials resent')
                  } catch {
                    toast.error('Failed to resend credentials')
                  } finally {
                    if (btn) btn.disabled = false
                  }
                }}
                id={`resend-btn-${currentStudent.id}`}
                className="mt-3 flex w-fit items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black tracking-widest text-slate-500 uppercase shadow-sm transition-all hover:border-[#4c9ded] hover:text-[#4c9ded] disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800"
              >
                <KeyRound className="h-3 w-3" />
                Resend Credentials
              </button>
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
              href={`/staff/students/${currentStudent.id}`}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black tracking-widest text-slate-500 uppercase shadow-sm transition-all hover:border-[#4c9ded] hover:text-[#4c9ded] dark:border-slate-700 dark:bg-slate-800"
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
        <div className="flex gap-6 border-b border-slate-100 dark:border-slate-800">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative pb-3 text-sm font-bold transition-all ${
                tab === t ? 'text-[#002a5c]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab === t && (
                <motion.div
                  layoutId="student-detail-underline"
                  className="absolute bottom-0 left-0 h-0.5 w-full bg-[#002a5c]"
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
            <Loader2 className="h-8 w-8 animate-spin text-[#002a5c]" />
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
                  </Grid2>
                </Section>
              </>
            )}

            {tab === 'Wallet' && (
              <Section title="Wallet Balance">
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div
                    className={`rounded-xl p-4 ${walletBal >= 0 ? 'border border-emerald-100 bg-emerald-50' : 'border border-red-100 bg-red-50'}`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        Available Balance
                      </p>
                      <ManualWalletAdjustmentDialog
                        userId={currentStudent.id}
                        userName={fullName}
                        currentBalance={walletBal}
                        currency={currentStudent.wallet?.currency || 'EUR'}
                        onSuccess={() => {
                          onActionComplete()
                          // Trigger a re-fetch of full details
                          const fetchFullDetails = async () => {
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
                          fetchFullDetails()
                        }}
                      />
                    </div>
                    <CurrencyDisplay
                      amount={walletBal}
                      baseCurrency={currentStudent.wallet?.currency || 'EUR'}
                      currency={viewCurrency}
                      clickToToggle={true}
                      onCurrencyChange={onCurrencyChange}
                      size="lg"
                      amountClassName={walletBal >= 0 ? 'text-emerald-700!' : 'text-red-600!'}
                    />
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                    <p className="mb-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Total Balance
                    </p>
                    <CurrencyDisplay
                      amount={Number(currentStudent.wallet?.balance ?? 0)}
                      baseCurrency={currentStudent.wallet?.currency || 'EUR'}
                      currency={viewCurrency}
                      clickToToggle={true}
                      onCurrencyChange={onCurrencyChange}
                      size="lg"
                      amountClassName="text-slate-700!"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  Full transaction history available in Finance → Transactions.
                </p>
              </Section>
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
                            e.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-700'
                              : e.status === 'COMPLETED'
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
              <>
                {/* Upcoming/Pending Exams */}
                {upcomingExams.length > 0 && (
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
                            <p className="truncate text-xs text-slate-500">{exam.examName}</p>
                            <p className="mt-0.5 text-[10px] text-slate-400">
                              {exam.date ? new Date(exam.date).toLocaleDateString() : '—'}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase bg-amber-100 text-amber-700">
                              {exam.status || 'PENDING'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Completed Exam History */}
                <Section title="Exam History">
                  {!allExamHistory.length ? (
                    <EmptyState icon={FileCheck} message="No exam records yet" />
                  ) : (
                    <div className="space-y-2">
                      {allExamHistory.map((h, idx) => (
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
                            <p className="truncate text-xs text-slate-500">{h.examName}</p>
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
                                  : h.result === 'ABSENT'
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
              </>
            )}
          </>
        )}
      </div>
    </div>
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
