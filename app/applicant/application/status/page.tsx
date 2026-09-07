import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, User, CreditCard, ShieldCheck } from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { serializePrisma } from '@/lib/utils/serialization'
import { formatDateLong } from '@/lib/utils/date'
import {
  isPipelineEnabled,
  getPipelineStageConfig,
  calculateProgress,
} from '@/lib/admissions/state-machine'
import {
  STAGE_INFO,
  getMilestoneStages,
  getActiveStagesForConfig,
} from '@/lib/admissions/constants'
import type { ApplicationStage as _ApplicationStage } from '@prisma/client'
import PipelineTracker from './_components/PipelineTracker'
import { PageTransition } from '@/components/shared/PageTransition'

export const metadata: Metadata = { title: 'Application Status | Applicant Portal' }
export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Programme labels
// ---------------------------------------------------------------------------

const PROGRAMME_LABELS: Record<string, string> = {
  FULL_TIME_4YEAR: 'Full-Time 4-Year',
  FULL_TIME_2YEAR: 'Full-Time 2-Year',
  MILITARY_1YEAR: 'Military 1-Year',
  MODULAR: 'Modular',
  EXAM_ONLY: 'Exam Only',
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ApplicationStatusPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const userId = session.user.id

  // Fetch user + application data in parallel with the pipeline feature flag
  const [applicant, pipelineEnabled] = await Promise.all([
    prismaUnfiltered.user.findUnique({
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
        application: {
          select: {
            id: true,
            stage: true,
            previousStage: true,
            programmeChoice: true,
            rejectionReason: true,
            createdAt: true,
            stageLogs: {
              orderBy: { createdAt: 'desc' },
              take: 50,
              select: {
                id: true,
                fromStage: true,
                toStage: true,
                actorId: true,
                metadata: true,
                createdAt: true,
              },
            },
          },
        },
      },
    }),
    isPipelineEnabled(),
  ])

  if (!applicant) redirect('/login')

  const application = applicant.application

  // ---------------------------------------------------------------------------
  // Pipeline enabled + application exists => dynamic tracker
  // ---------------------------------------------------------------------------
  if (pipelineEnabled && application) {
    const config = await getPipelineStageConfig(application.programmeChoice)
    const activeStages = getActiveStagesForConfig(config)
    const milestones = getMilestoneStages(config)
    const progress = calculateProgress(application.stage, activeStages)

    // Build a serializable stage info map for the client component
    const stageInfoMap: Record<
      string,
      {
        label: string
        shortLabel: string
        description: string
        color: string
        textColor: string
        applicantInstruction: string
        group: string
      }
    > = {}

    for (const [stage, info] of Object.entries(STAGE_INFO)) {
      stageInfoMap[stage] = {
        label: info.label,
        shortLabel: info.shortLabel,
        description: info.description,
        color: info.color,
        textColor: info.textColor,
        applicantInstruction: info.applicantInstruction,
        group: info.group,
      }
    }

    return (
      <PipelineTracker
        currentStage={application.stage}
        previousStage={application.previousStage}
        programmeLabel={
          PROGRAMME_LABELS[application.programmeChoice] ?? application.programmeChoice
        }
        registrationCode={applicant.registrationCode}
        rejectionReason={application.rejectionReason}
        progress={progress}
        milestones={milestones}
        activeStages={activeStages}
        stageLogs={serializePrisma(application.stageLogs)}
        stageInfo={stageInfoMap}
        paymentProofUrl={applicant.paymentProofUrl}
        createdAt={serializePrisma(application.createdAt)}
      />
    )
  }

  // ---------------------------------------------------------------------------
  // Fallback: pipeline NOT enabled — original 4-step tracker
  // ---------------------------------------------------------------------------

  const isApproved = applicant.status === 'ACTIVE'
  const isRejected = applicant.status === 'SUSPENDED'
  const paymentSubmitted = !!applicant.paymentProofUrl
  const paymentVerified = applicant.registrationPaid

  const steps = [
    {
      label: 'Account Created',
      description: `Registered on ${formatDateLong(applicant.createdAt)}`,
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
        ? `Verified on ${formatDateLong(applicant.paymentApprovedAt) ?? 'N/A'}`
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
    <PageTransition className="max-w-7xl space-y-8">
      <div>
        <h1 className="text-aerojet-blue text-3xl font-black tracking-tight dark:text-white">
          Application Status
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Track every step of your registration journey.
        </p>
      </div>

      {/* Application Reference */}
      {applicant.registrationCode && (
        <div className="bg-aerojet-blue flex flex-wrap items-center justify-between gap-4 rounded-2xl p-6 text-white">
          <div>
            <p className="mb-1 text-xs font-semibold tracking-widest text-white/60 uppercase">
              Registration Code
            </p>
            <p className="font-mono text-2xl font-black tracking-widest">
              {applicant.registrationCode}
            </p>
          </div>
          <div className="text-right">
            <p className="mb-1 text-xs font-semibold tracking-widest text-white/60 uppercase">
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
      <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
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
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {step.description}
                  </p>
                  {step.action && (
                    <Link
                      href={step.action.href}
                      className="text-aerojet-blue hover:text-aerojet-sky mt-2 inline-flex items-center gap-1.5 text-xs font-bold underline underline-offset-2"
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
      <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 dark:text-slate-100">Personal Details</h2>
          <Link
            href="/applicant/profile"
            className="text-aerojet-blue text-xs font-bold hover:underline"
          >
            Edit Profile
          </Link>
        </div>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          {[
            {
              label: 'Full Name',
              value: applicant.profile
                ? `${applicant.profile.firstName} ${applicant.profile.lastName}`
                : '\u2014',
            },
            { label: 'Email', value: applicant.email },
            { label: 'Phone', value: applicant.profile?.phone ?? '\u2014' },
            { label: 'Nationality', value: applicant.profile?.nationality ?? '\u2014' },
            { label: 'Country', value: applicant.profile?.country ?? '\u2014' },
            { label: 'City', value: applicant.profile?.city ?? '\u2014' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <div>
                <dt className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                  {label}
                </dt>
                <dd className="mt-0.5 font-medium text-slate-700 dark:text-slate-300">{value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </PageTransition>
  )
}
