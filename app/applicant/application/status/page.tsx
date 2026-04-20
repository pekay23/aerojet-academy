import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  ClipboardList,
  CreditCard,
  Calendar,
  User,
  Phone,
  Globe,
  MapPin,
} from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'

export const metadata: Metadata = { title: 'Application Status | Applicant Portal' }
export const dynamic = 'force-dynamic'

export default async function ApplicationStatusPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const userId = session.user.id

  const applicant = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      registrationPaid: true,
      paymentProofUrl: true,
      paymentApprovedAt: true,
      status: true,
      role: true,
      registrationCode: true,
      registrationFee: true,
      registrationCurrency: true,
      createdAt: true,
      email: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
          phone: true,
          nationality: true,
          country: true,
          city: true,
          dateOfBirth: true,
        },
      },
    },
  })

  if (!applicant) redirect('/login')

  const isApproved = applicant.status === 'ACTIVE'
  const isRejected = applicant.status === 'SUSPENDED'
  const paymentSubmitted = !!applicant.paymentProofUrl
  const paymentVerified = applicant.registrationPaid

  const steps = [
    {
      label: 'Account Created',
      description: `Registered on ${applicant.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      done: true,
      icon: User,
    },
    {
      label: 'Registration Payment Uploaded',
      description: paymentSubmitted
        ? 'Payment proof has been submitted for review.'
        : `Upload proof of payment for ${applicant.registrationFee} ${applicant.registrationCurrency}.`,
      done: paymentSubmitted,
      icon: CreditCard,
      action: !paymentSubmitted
        ? { label: 'Upload Now', href: '/applicant/application/payment' }
        : undefined,
    },
    {
      label: 'Payment Verified',
      description: paymentVerified
        ? `Verified on ${applicant.paymentApprovedAt?.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) ?? 'N/A'}`
        : 'Pending admissions review.',
      done: paymentVerified,
      icon: CheckCircle2,
    },
    {
      label: 'Application Approved',
      description: isApproved
        ? 'Your application has been approved! You can now enroll in a course.'
        : isRejected
          ? 'Your application was not accepted. Contact admissions.'
          : 'Pending final admissions decision.',
      done: isApproved,
      icon: ShieldCheck,
    },
  ]

  return (
    <div className="max-w-7xl space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-aerojet-blue dark:text-white sm:text-3xl">
          Application Status
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Track every step of your registration journey.
        </p>
      </div>

      {/* Application Reference */}
      {applicant.registrationCode && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-aerojet-blue p-6 text-white">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-white/60">
              Registration Code
            </p>
            <p className="font-mono text-2xl font-black tracking-widest">
              {applicant.registrationCode}
            </p>
          </div>
          <div className="text-right">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-white/60">
              Status
            </p>
            <span
              className={`rounded-full px-3 py-1.5 text-sm font-black uppercase ${
                isApproved
                  ? 'bg-green-500'
                  : isRejected
                    ? 'bg-red-500'
                    : paymentVerified
                      ? 'bg-purple-500'
                      : paymentSubmitted
                        ? 'bg-orange-500'
                        : 'bg-slate-500'
              }`}
            >
              {isApproved
                ? 'Approved'
                : isRejected
                  ? 'Rejected'
                  : paymentVerified
                    ? 'Under Review'
                    : paymentSubmitted
                      ? 'Payment Submitted'
                      : 'Payment Pending'}
            </span>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8">
        <h2 className="mb-6 font-bold text-slate-900 dark:text-slate-100">Application Progress</h2>
        <ol className="relative ml-3 space-y-8 border-l border-slate-200 dark:border-slate-700">
          {steps.map((step, i) => {
            const StepIcon = step.icon
            return (
              <li key={i} className="ml-6">
                <span
                  className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white ${
                    step.done ? 'bg-green-500' : 'bg-slate-200'
                  }`}
                >
                  <StepIcon className={`h-3 w-3 ${step.done ? 'text-white' : 'text-slate-400'}`} />
                </span>
                <div>
                  <h3
                    className={`text-sm font-bold ${step.done ? 'text-green-700' : 'text-slate-700'}`}
                  >
                    {step.label}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{step.description}</p>
                  {step.action && (
                    <Link
                      href={step.action.href}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-aerojet-blue underline underline-offset-2 hover:text-aerojet-sky"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      {step.action.label}
                    </Link>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      {/* Personal Details Summary */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 dark:text-slate-100">Personal Details</h2>
          <Link
            href="/applicant/profile"
            className="text-xs font-bold text-aerojet-blue hover:underline"
          >
            Edit Profile →
          </Link>
        </div>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          {[
            {
              label: 'Full Name',
              value: applicant.profile
                ? `${applicant.profile.firstName} ${applicant.profile.lastName}`
                : '—',
              icon: User,
            },
            { label: 'Email', value: applicant.email, icon: ClipboardList },
            { label: 'Phone', value: applicant.profile?.phone ?? '—', icon: Phone },
            { label: 'Nationality', value: applicant.profile?.nationality ?? '—', icon: Globe },
            { label: 'Country', value: applicant.profile?.country ?? '—', icon: MapPin },
            { label: 'City', value: applicant.profile?.city ?? '—', icon: MapPin },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-start gap-3">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {label}
                </dt>
                <dd className="mt-0.5 font-medium text-slate-700">{value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
