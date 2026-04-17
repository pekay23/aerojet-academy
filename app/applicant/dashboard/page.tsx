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
  Mail,
  GraduationCap,
} from 'lucide-react'

import { getSystemSetting } from '@/lib/settings'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import RegistrationFeeDisplay from './_components/RegistrationFeeDisplay'

export const metadata: Metadata = { title: 'Dashboard | Applicant Portal' }
export const dynamic = 'force-dynamic'

type AppStatus =
  | 'email_unverified'
  | 'registered'
  | 'payment_pending'
  | 'payment_submitted'
  | 'under_review'
  | 'registration_approved'
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
  email_unverified: {
    label: 'Email Unverified',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800',
    icon: Mail,
    description:
      'Please check your inbox and verify your email address. A verification link was sent when you registered.',
  },
  registered: {
    label: 'Registered',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800',
    icon: ClipboardList,
    description: 'Your account has been created. Upload your registration payment to continue.',
  },
  payment_pending: {
    label: 'Payment Pending',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-800',
    icon: Clock,
    description: 'Please upload your registration payment proof to proceed.',
  },
  payment_submitted: {
    label: 'Payment Submitted',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 border-purple-200 dark:bg-purple-900/10 dark:border-purple-800',
    icon: AlertCircle,
    description: 'Your payment proof has been submitted. Our team is reviewing it.',
  },
  under_review: {
    label: 'Under Review',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 border-purple-200 dark:bg-purple-900/10 dark:border-purple-800',
    icon: AlertCircle,
    description:
      'Your application and payment are being reviewed by our admissions team. We will notify you soon.',
  },
  registration_approved: {
    label: 'Registration Approved',
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-50 border-teal-200 dark:bg-teal-900/10 dark:border-teal-800',
    icon: ShieldCheck,
    description:
      'Your registration fee has been verified. Complete your pathway payment below to become a full student.',
  },
  approved: {
    label: 'Student',
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800',
    icon: GraduationCap,
    description:
      'Congratulations! You are now a student. You will be redirected to your student portal.',
  },
  rejected: {
    label: 'Not Accepted',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800',
    icon: AlertCircle,
    description:
      'Unfortunately, your application was not accepted. Please contact admissions for more information.',
  },
}

function deriveStatus(user: {
  emailVerified: Date | null
  registrationPaid: boolean
  paymentProofUrl: string | null
  status: string
  role: string
}): AppStatus {
  if (user.role === 'STUDENT') return 'approved'
  if (user.status === 'SUSPENDED') return 'rejected'
  // ACTIVE applicant = registration fee approved, needs pathway payment
  if (user.status === 'ACTIVE' && user.role === 'APPLICANT') return 'registration_approved'
  if (!user.emailVerified) return 'email_unverified'
  if (user.registrationPaid) return 'under_review'
  if (user.paymentProofUrl) return 'payment_submitted'
  return 'payment_pending'
}

export default async function ApplicantDashboardPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const registrationFeeSetting = await getSystemSetting('registration_fee', '350')
  const registrationCurrencySetting = await getSystemSetting('registration_currency', 'EUR')

  const userId = session.user.id

  const applicant = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      emailVerified: true,
      registrationPaid: true,
      paymentProofUrl: true,
      status: true,
      role: true,
      registrationCode: true,
      registrationFee: true,
      registrationCurrency: true,
      programmeChoice: true,
      createdAt: true,
      profile: { select: { firstName: true, lastName: true } },
    },
  })

  if (!applicant) redirect('/login')

  // If user has been promoted to STUDENT, redirect to student portal
  if (applicant.role === 'STUDENT') {
    redirect('/student')
  }

  // If EXAM_ONLY pathway and registration is approved, redirect to exam-only dashboard
  if (applicant.programmeChoice === 'EXAM_ONLY' && applicant.status === 'ACTIVE') {
    redirect('/applicant/exam-only/dashboard')
  }

  const firstName = applicant.profile?.firstName ?? 'Applicant'
  const appStatus = deriveStatus(applicant)
  const statusInfo = statusConfig[appStatus]
  const StatusIcon = statusInfo.icon

  const formatProgramme = (choice: string | null) => {
    if (!choice) return 'Not Selected'
    const match = choice.match(/(.+)_(.YEAR)/)
    if (match) return `${match[1].replace('_', ' ')} (${match[2].replace('YEAR', ' YEARS')})`
    return choice.replace('_', ' ')
  }

  const getActionLink = (choice: string | null) => {
    switch (choice) {
      case 'EXAM_ONLY':
        return { href: '/applicant/exam-bookings', label: 'Browse Exams', icon: FileCheck }
      case 'MODULAR':
        return {
          href: '/applicant/courses',
          label: 'Browse Modules',
          icon: BookOpen,
        }
      default:
        // Full time / Military
        return { href: '/applicant/pathway', label: 'Complete Enrollment', icon: ArrowRight }
    }
  }

  const actionInfo = getActionLink(applicant.programmeChoice)

  const isEmailVerified = !!applicant.emailVerified
  const isRegApproved = appStatus === 'registration_approved' || appStatus === 'approved'
  const isStudent = (applicant.role as string) === 'STUDENT'

  const timelineSteps = [
    { step: 'Create Account', done: true },
    { step: 'Verify Email', done: isEmailVerified },
    {
      step: (
        <div className="flex flex-wrap items-center gap-2">
          <span>Upload Registration Payment</span>
          <RegistrationFeeDisplay
            fee={
              applicant.registrationPaid
                ? Number(applicant.registrationFee)
                : Number(registrationFeeSetting)
            }
            currency={
              applicant.registrationPaid ? applicant.registrationCurrency : registrationCurrencySetting
            }
          />
        </div>
      ),
      done: appStatus !== 'payment_pending' && appStatus !== 'email_unverified',
    },
    {
      step: 'Registration Fee Verified',
      done: isRegApproved,
    },
    {
      step: 'Pathway Payment',
      done: isStudent,
    },
    { step: 'Student Enrollment', done: isStudent },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-aerojet-blue sm:text-3xl dark:text-white">
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
            className={`h-12 w-12 rounded-xl ${statusInfo.color} flex shrink-0 items-center justify-center bg-white shadow-sm dark:bg-slate-900`}
          >
            <StatusIcon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Application Status
              </h2>
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-black tracking-widest uppercase ${statusInfo.color} border bg-white dark:bg-slate-900`}
              >
                {statusInfo.label}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">{statusInfo.description}</p>

            {applicant.registrationCode && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-slate-400">
                  Registration Code:{' '}
                  <span className="font-mono font-bold text-slate-600 dark:text-slate-400">
                    {applicant.registrationCode}
                  </span>
                </p>
                {applicant.programmeChoice && (
                  <p className="text-xs text-slate-400">
                    Selected Pathway:{' '}
                    <span className="font-bold text-slate-600 dark:text-slate-400">
                      {formatProgramme(applicant.programmeChoice)}
                    </span>
                  </p>
                )}
              </div>
            )}

            {appStatus === 'email_unverified' && (
              <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">
                Didn&apos;t receive the email? Check your spam folder or contact support.
              </p>
            )}

            {(appStatus === 'payment_pending' || appStatus === 'registered') && (
              <Link
                href="/applicant/application/payment"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold tracking-widest text-aerojet-blue uppercase shadow-sm transition-all hover:bg-aerojet-blue hover:text-white dark:bg-slate-900"
              >
                <CreditCard className="h-4 w-4" />
                Upload Payment Proof
              </Link>
            )}

            {appStatus === 'registration_approved' && (
              <Link
                href={actionInfo.href}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold tracking-widest text-white uppercase shadow-sm transition-all hover:bg-teal-700"
              >
                <actionInfo.icon className="h-4 w-4" />
                {actionInfo.label}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Journey Timeline */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
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
                className={`text-sm ${
                  item.done
                    ? 'font-semibold text-slate-700 line-through decoration-green-300 dark:text-slate-200'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
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
          { label: 'Exam Bookings', href: '/applicant/exam-bookings', icon: FileCheck },
        ].map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 transition-all hover:border-aerojet-sky hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 transition-colors group-hover:bg-aerojet-blue dark:bg-slate-800/50">
              <Icon className="h-5 w-5 text-slate-400 transition-colors group-hover:text-white" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{label}</span>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-aerojet-sky" />
          </Link>
        ))}
      </div>
    </div>
  )
}
