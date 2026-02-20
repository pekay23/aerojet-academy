import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ClipboardList,
  CreditCard,
  BookOpen,
  FileCheck,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'

export const metadata: Metadata = { title: 'Dashboard | Applicant Portal' }
export const dynamic = 'force-dynamic'

type AppStatus =
  | 'registered'
  | 'payment_pending'
  | 'payment_submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'

const statusConfig: Record<
  AppStatus,
  {
    label: string
    color: string
    bg: string
    icon: any
    description: string
  }
> = {
  registered: {
    label: 'Registered',
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
    icon: ClipboardList,
    description: 'Your account has been created. Upload your registration payment to continue.',
  },
  payment_pending: {
    label: 'Payment Pending',
    color: 'text-orange-600',
    bg: 'bg-orange-50 border-orange-200',
    icon: Clock,
    description: 'Please upload your registration payment proof to proceed.',
  },
  payment_submitted: {
    label: 'Payment Submitted',
    color: 'text-purple-600',
    bg: 'bg-purple-50 border-purple-200',
    icon: AlertCircle,
    description: 'Your payment proof has been submitted. Our team is reviewing it.',
  },
  under_review: {
    label: 'Under Review',
    color: 'text-purple-600',
    bg: 'bg-purple-50 border-purple-200',
    icon: AlertCircle,
    description:
      'Your application and payment are being reviewed by our admissions team. We will notify you soon.',
  },
  approved: {
    label: 'Approved',
    color: 'text-green-600',
    bg: 'bg-green-50 border-green-200',
    icon: ShieldCheck,
    description:
      'Congratulations! Your registration has been approved. You may now enroll in a course.',
  },
  rejected: {
    label: 'Not Accepted',
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
    icon: AlertCircle,
    description:
      'Unfortunately, your application was not accepted. Please contact admissions for more information.',
  },
}

function deriveStatus(user: {
  registrationPaid: boolean
  paymentProofUrl: string | null
  status: string
  role: string
}): AppStatus {
  if (user.status === 'ACTIVE') return 'approved'
  if (user.status === 'SUSPENDED') return 'rejected'
  if (user.registrationPaid) return 'under_review'
  if (user.paymentProofUrl) return 'payment_submitted'
  return 'payment_pending'
}

export default async function ApplicantDashboard() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const userId = (session.user as any).id

  const applicant = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      registrationPaid: true,
      paymentProofUrl: true,
      status: true,
      role: true,
      registrationCode: true,
      registrationFee: true,
      registrationCurrency: true,
      createdAt: true,
      profile: { select: { firstName: true, lastName: true } },
    },
  })

  if (!applicant) redirect('/login')

  const firstName = applicant.profile?.firstName ?? 'Applicant'
  const appStatus = deriveStatus(applicant)
  const statusInfo = statusConfig[appStatus]
  const StatusIcon = statusInfo.icon

  const timelineSteps = [
    { step: 'Create Account', done: true },
    {
      step: `Upload Registration Payment (${applicant.registrationFee} ${applicant.registrationCurrency})`,
      done: appStatus !== 'payment_pending',
    },
    {
      step: 'Payment Verified by Admissions',
      done: applicant.registrationPaid || appStatus === 'approved',
    },
    { step: 'Application Approved', done: appStatus === 'approved' },
    { step: 'Course Enrollment', done: false },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Welcome, {firstName}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Here's an overview of your application status.
        </p>
      </div>

      {/* Status Card */}
      <div className={`${statusInfo.bg} rounded-2xl border p-6 sm:p-8`}>
        <div className="flex items-start gap-4">
          <div
            className={`h-12 w-12 rounded-xl ${statusInfo.color} flex shrink-0 items-center justify-center bg-white dark:bg-slate-900 shadow-sm`}
          >
            <StatusIcon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Application Status</h2>
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusInfo.color} border bg-white dark:bg-slate-900`}
              >
                {statusInfo.label}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">{statusInfo.description}</p>

            {applicant.registrationCode && (
              <p className="mt-2 text-xs text-slate-400">
                Registration Code:{' '}
                <span className="font-mono font-bold text-slate-600 dark:text-slate-400">
                  {applicant.registrationCode}
                </span>
              </p>
            )}

            {(appStatus === 'payment_pending' || appStatus === 'registered') && (
              <Link
                href="/applicant/application/payment"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white dark:bg-slate-900 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[#002a5c] shadow-sm transition-all hover:bg-[#002a5c] hover:text-white"
              >
                <CreditCard className="h-4 w-4" />
                Upload Payment Proof
              </Link>
            )}

            {appStatus === 'approved' && (
              <Link
                href="/applicant/courses"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white shadow-sm transition-all hover:bg-green-700"
              >
                <BookOpen className="h-4 w-4" />
                Browse Courses
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Journey Timeline */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8">
        <h3 className="mb-6 font-bold text-slate-900 dark:text-slate-100">Your Journey</h3>
        <div className="space-y-4">
          {timelineSteps.map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  item.done ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'
                }`}
              >
                {item.done ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-bold">{i + 1}</span>
                )}
              </div>
              <span
                className={`text-sm ${item.done ? 'font-semibold text-slate-700 line-through decoration-green-300' : 'text-slate-500'}`}
              >
                {item.step}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Application Status',
            href: '/applicant/application/status',
            icon: ClipboardList,
          },
          { label: 'Browse Courses', href: '/applicant/courses', icon: BookOpen },
          { label: 'Exam Pools', href: '/applicant/exam-pools', icon: FileCheck },
        ].map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="group flex items-center gap-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:border-[#4c9ded] hover:shadow-lg"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800/50 transition-colors group-hover:bg-[#002a5c]">
              <Icon className="h-5 w-5 text-slate-400 transition-colors group-hover:text-white" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-bold text-slate-700">{label}</span>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-[#4c9ded]" />
          </Link>
        ))}
      </div>
    </div>
  )
}
