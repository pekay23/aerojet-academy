'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
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
} from 'lucide-react'
import UserActionsMenu from './UserActionsMenu'

interface Student {
  id: string
  email: string
  status: string
  createdAt: string
  profile?: {
    firstName: string
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
  } | null
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
}

export default function StudentDetailPanel({ student, onClose, onActionComplete }: Props) {
  const [tab, setTab] = useState<Tab>('Overview')

  if (!student) {
    return (
      <div className="hidden flex-1 flex-col items-center justify-center bg-slate-50 text-center lg:flex dark:bg-slate-800/50">
        <GraduationCap className="mb-3 h-12 w-12 text-slate-200" />
        <p className="text-sm font-bold text-slate-400">Select a student to view details</p>
      </div>
    )
  }

  const fullName = student.profile
    ? `${student.profile.firstName} ${student.profile.lastName}`
    : student.email
  const initials = student.profile
    ? `${student.profile.firstName[0]}${student.profile.lastName[0]}`
    : student.email[0].toUpperCase()
  const statusStyle = STATUS_STYLE[student.status] ?? 'bg-slate-100 text-slate-500'
  const walletBal = Number(student.wallet?.availableBalance ?? 0)

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
              {student.profile?.profilePhotoUrl ? (
                <img
                  src={student.profile.profilePhotoUrl}
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
                <span className="font-mono">{student.studentProfile?.studentId ?? '—'}</span>
                {student.studentProfile?.cohort && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <span>{student.studentProfile.cohort}</span>
                  </>
                )}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${statusStyle}`}
                >
                  {student.status}
                </span>
                {student.studentProfile?.programType && (
                  <span className="rounded-full bg-[#002a5c]/10 px-2 py-0.5 text-[10px] font-black text-[#002a5c] uppercase">
                    {student.studentProfile.programType.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <UserActionsMenu
              userId={student.id}
              userStatus={student.status}
              userEmail={student.email}
              onActionComplete={onActionComplete}
            />
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
        {tab === 'Overview' && (
          <>
            <Section title="Personal Information">
              <Grid2>
                <Field icon={Mail} label="Email" value={student.email} />
                <Field icon={Phone} label="Phone" value={student.profile?.phone ?? '—'} />
                <Field
                  icon={Globe}
                  label="Nationality"
                  value={student.profile?.nationality ?? '—'}
                />
                <Field
                  icon={Calendar}
                  label="Date of Birth"
                  value={
                    student.profile?.dateOfBirth
                      ? new Date(student.profile.dateOfBirth).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
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
                  value={student.studentProfile?.programType?.replace(/_/g, ' ') ?? '—'}
                />
                <Field
                  icon={BookOpen}
                  label="Licence Category"
                  value={student.studentProfile?.licenceCategory ?? '—'}
                />
                <Field
                  icon={Calendar}
                  label="Enrolled"
                  value={
                    student.studentProfile?.enrolledAt
                      ? new Date(student.studentProfile.enrolledAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'
                  }
                />
                <Field icon={User} label="Cohort" value={student.studentProfile?.cohort ?? '—'} />
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
                <p className="mb-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Available Balance
                </p>
                <p
                  className={`text-2xl font-black ${walletBal >= 0 ? 'text-emerald-700' : 'text-red-600'}`}
                >
                  GHS {walletBal.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                <p className="mb-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Total Balance
                </p>
                <p className="text-2xl font-black text-slate-700">
                  GHS{' '}
                  {Number(student.wallet?.balance ?? 0).toLocaleString('en-GH', {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Full transaction history available in Finance → Transactions.
            </p>
          </Section>
        )}

        {tab === 'Enrollments' && (
          <Section title="Current Enrollments">
            {!student.enrollments?.length ? (
              <EmptyState icon={BookOpen} message="No active enrollments" />
            ) : (
              <div className="space-y-2">
                {student.enrollments.map((e) => (
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
          <Section title="Exam History">
            <EmptyState icon={FileCheck} message="No exam records yet" />
          </Section>
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
