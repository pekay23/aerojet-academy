'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  Circle,
  Clock,
  XCircle,
  LogOut,
  CreditCard,
  ArrowRight,
  BrainCircuit,
  ListChecks,
  CalendarDays,
  type LucideIcon as _LucideIcon,
} from 'lucide-react'
import { format } from 'date-fns'

// ---------------------------------------------------------------------------
// Types (serialized versions — dates are ISO strings)
// ---------------------------------------------------------------------------

interface StageLogEntry {
  id: string
  fromStage: string
  toStage: string
  actorId: string
  metadata: unknown
  createdAt: string
}

interface Milestone {
  stage: string
  label: string
}

interface StageInfoMap {
  [stage: string]: {
    label: string
    shortLabel: string
    description: string
    color: string
    textColor: string
    applicantInstruction: string
    group: string
  }
}

export interface PipelineTrackerProps {
  currentStage: string
  previousStage: string | null
  programmeLabel: string
  registrationCode: string | null
  rejectionReason: string | null
  progress: number
  milestones: Milestone[]
  activeStages: string[]
  stageLogs: StageLogEntry[]
  stageInfo: StageInfoMap
  paymentProofUrl: string | null
  createdAt: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function _getStageStatus(
  milestoneStage: string,
  currentStage: string,
  activeStages: string[],
  isTerminal: boolean
): 'completed' | 'current' | 'upcoming' {
  if (isTerminal) return 'upcoming'

  const currentIdx = activeStages.indexOf(currentStage)
  const milestoneIdx = activeStages.indexOf(milestoneStage)

  if (milestoneIdx === -1 || currentIdx === -1) return 'upcoming'
  if (milestoneIdx < currentIdx) return 'completed'
  if (milestoneIdx === currentIdx) return 'current'

  // For milestones that represent the "end" of a group, check if current stage
  // is past the milestone's position
  return 'upcoming'
}

function _isMilestoneCompleted(
  milestoneStage: string,
  currentStage: string,
  activeStages: string[]
): boolean {
  const currentIdx = activeStages.indexOf(currentStage)
  const milestoneIdx = activeStages.indexOf(milestoneStage)
  if (milestoneIdx === -1 || currentIdx === -1) return false
  return currentIdx > milestoneIdx
}

function _isMilestoneCurrent(
  milestoneStage: string,
  currentStage: string,
  activeStages: string[]
): boolean {
  const currentIdx = activeStages.indexOf(currentStage)
  const milestoneIdx = activeStages.indexOf(milestoneStage)
  if (milestoneIdx === -1 || currentIdx === -1) return false
  return currentIdx === milestoneIdx
}

const TERMINAL_STAGES = ['REJECTED', 'WITHDRAWN']

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PipelineTracker({
  currentStage,
  previousStage: _previousStage,
  programmeLabel,
  registrationCode,
  rejectionReason,
  progress,
  milestones,
  activeStages,
  stageLogs,
  stageInfo,
  paymentProofUrl,
  createdAt,
}: PipelineTrackerProps) {
  const isTerminal = TERMINAL_STAGES.includes(currentStage)
  const isEnrolled = currentStage === 'ENROLLED'
  const currentInfo = stageInfo[currentStage]

  // Determine which milestone is "closest" to the current stage
  // This handles sub-stages (e.g., PAYMENT_SUBMITTED maps to PAYMENT_VERIFIED milestone)
  const currentMilestoneIndex = useMemo(() => {
    if (isTerminal) return -1
    if (isEnrolled) return milestones.length - 1

    const currentActiveIdx = activeStages.indexOf(currentStage)
    if (currentActiveIdx === -1) return 0

    // Find the milestone whose stage index is >= current stage index
    for (let i = milestones.length - 1; i >= 0; i--) {
      const milestoneActiveIdx = activeStages.indexOf(milestones[i].stage)
      if (milestoneActiveIdx !== -1 && currentActiveIdx >= milestoneActiveIdx) {
        return i
      }
    }
    // Current stage is before the first milestone's stage (it's a sub-stage in group)
    // Find the first milestone whose group stage is AFTER the current stage
    for (let i = 0; i < milestones.length; i++) {
      const milestoneActiveIdx = activeStages.indexOf(milestones[i].stage)
      if (milestoneActiveIdx !== -1 && milestoneActiveIdx >= currentActiveIdx) {
        return i
      }
    }
    return 0
  }, [currentStage, milestones, activeStages, isTerminal, isEnrolled])

  const needsPayment =
    (currentStage === 'REGISTERED' || currentStage === 'PAYMENT_PENDING') && !paymentProofUrl

  return (
    <div className="max-w-7xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-aerojet-blue dark:text-white sm:text-3xl">
          Application Status
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Track your progress through the {programmeLabel} admissions pipeline.
        </p>
      </div>

      {/* Registration Code Banner */}
      {registrationCode && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-aerojet-blue p-6 text-white">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-white/60">
              Registration Code
            </p>
            <p className="font-mono text-2xl font-black tracking-widest">
              {registrationCode}
            </p>
          </div>
          <div className="text-right">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-white/60">
              Status
            </p>
            <span
              className={`rounded-full px-3 py-1.5 text-sm font-black uppercase ${
                isEnrolled
                  ? 'bg-green-500'
                  : isTerminal
                    ? currentStage === 'REJECTED'
                      ? 'bg-red-500'
                      : 'bg-gray-500'
                    : 'bg-white/20'
              }`}
            >
              {currentInfo?.shortLabel ?? currentStage}
            </span>
          </div>
        </div>
      )}

      {/* Terminal State Banner */}
      {isTerminal && (
        <div
          className={`rounded-2xl border p-6 ${
            currentStage === 'REJECTED'
              ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30'
              : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900'
          }`}
        >
          <div className="flex items-start gap-3">
            {currentStage === 'REJECTED' ? (
              <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-500" />
            ) : (
              <LogOut className="mt-0.5 h-6 w-6 shrink-0 text-gray-500" />
            )}
            <div>
              <h3
                className={`text-lg font-bold ${
                  currentStage === 'REJECTED'
                    ? 'text-red-700 dark:text-red-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {currentInfo?.label}
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {currentInfo?.applicantInstruction}
              </p>
              {rejectionReason && (
                <p className="mt-3 rounded-lg bg-white/60 dark:bg-slate-800/60 px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-semibold">Reason: </span>
                  {rejectionReason}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {!isTerminal && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Pipeline Progress
            </span>
            <span className="font-bold text-aerojet-blue dark:text-aerojet-sky">
              {progress}%
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-linear-to-r from-aerojet-blue to-aerojet-sky transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Milestone Tracker */}
      {!isTerminal && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <h2 className="mb-6 font-bold text-slate-900 dark:text-slate-100">
            Admissions Pipeline
          </h2>

          {/* Horizontal milestones — desktop */}
          <div className="hidden md:block">
            <div className="relative flex items-start justify-between">
              {milestones.map((milestone, i) => {
                const isCompleted = i < currentMilestoneIndex || isEnrolled
                const isCurrent = i === currentMilestoneIndex && !isEnrolled
                const _isLast = i === milestones.length - 1

                return (
                  <div key={milestone.stage} className="relative flex flex-1 flex-col items-center">
                    {/* Connector line */}
                    {i < milestones.length - 1 && (
                      <div className="absolute left-1/2 top-4 h-0.5 w-full">
                        <div
                          className={`h-full ${
                            isCompleted
                              ? 'bg-green-500'
                              : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        />
                      </div>
                    )}
                    {/* Circle */}
                    <div
                      className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                        isCompleted
                          ? 'border-green-500 bg-green-500 text-white'
                          : isCurrent
                            ? 'border-aerojet-blue bg-aerojet-blue text-white ring-4 ring-aerojet-blue/20'
                            : 'border-slate-300 bg-white text-slate-400 dark:border-slate-600 dark:bg-slate-800'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : isCurrent ? (
                        <Clock className="h-4 w-4" />
                      ) : (
                        <Circle className="h-3 w-3" />
                      )}
                    </div>
                    {/* Label */}
                    <span
                      className={`mt-2 text-center text-xs font-semibold ${
                        isCompleted
                          ? 'text-green-700 dark:text-green-400'
                          : isCurrent
                            ? 'text-aerojet-blue dark:text-aerojet-sky'
                            : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {milestone.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Vertical milestones — mobile */}
          <ol className="relative ml-3 space-y-6 border-l border-slate-200 dark:border-slate-700 md:hidden">
            {milestones.map((milestone, i) => {
              const isCompleted = i < currentMilestoneIndex || isEnrolled
              const isCurrent = i === currentMilestoneIndex && !isEnrolled

              return (
                <li key={milestone.stage} className="ml-6">
                  <span
                    className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-900 ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isCurrent
                          ? 'bg-aerojet-blue text-white'
                          : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : isCurrent ? (
                      <Clock className="h-3 w-3" />
                    ) : (
                      <Circle className="h-2.5 w-2.5 text-slate-400" />
                    )}
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      isCompleted
                        ? 'text-green-700 dark:text-green-400'
                        : isCurrent
                          ? 'text-aerojet-blue dark:text-aerojet-sky'
                          : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {milestone.label}
                  </span>
                </li>
              )
            })}
          </ol>
        </div>
      )}

      {/* Current Stage Card */}
      {!isTerminal && currentInfo && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${currentInfo.color}`}
            >
              <Clock className={`h-5 w-5 ${currentInfo.textColor}`} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-slate-100">
                {currentInfo.label}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {currentInfo.description}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
              What to do next
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              {currentInfo.applicantInstruction}
            </p>
          </div>

          {needsPayment && (
            <Link
              href="/applicant/application/payment"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-aerojet-blue px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-aerojet-blue/90"
            >
              <CreditCard className="h-4 w-4" />
              Upload Payment Proof
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}

          {currentStage === 'APTITUDE_PENDING' && (
            <Link
              href="/applicant/application/aptitude-test"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-aerojet-blue px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-aerojet-blue/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-aerojet-blue/30"
            >
              <BrainCircuit className="h-4 w-4" />
              Take Aptitude Test
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}

          {currentStage === 'SHORTLISTED' && (
            <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-900/20">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                <ListChecks className="h-5 w-5" />
                <span className="font-bold">You've been shortlisted!</span>
              </div>
              <p className="mt-1 text-sm text-indigo-600 dark:text-indigo-300">
                Our admissions team will contact you shortly to schedule your interview.
              </p>
            </div>
          )}

          {currentStage === 'INTERVIEW_PENDING' && (
            <Link
              href="/applicant/application/interview"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-600/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-600/30"
            >
              <CalendarDays className="h-4 w-4" />
              Book Interview Slot
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}

      {/* Stage History Timeline */}
      {stageLogs.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <h2 className="mb-6 font-bold text-slate-900 dark:text-slate-100">
            Application Timeline
          </h2>
          <ol className="relative ml-3 space-y-6 border-l border-slate-200 dark:border-slate-700">
            {stageLogs.map((log) => {
              const toInfo = stageInfo[log.toStage]
              const fromInfo = stageInfo[log.fromStage]
              const isAutoSkipped = !!(log.metadata && (log.metadata as Record<string, unknown>).autoSkipped)

              return (
                <li key={log.id} className="ml-6">
                  <span
                    className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-900 ${
                      toInfo?.color ?? 'bg-slate-200'
                    }`}
                  >
                    <ArrowRight
                      className={`h-3 w-3 ${toInfo?.textColor ?? 'text-slate-400'}`}
                    />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        {toInfo?.label ?? log.toStage}
                      </h3>
                      {isAutoSkipped && (
                        <span className="rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
                          Auto-skipped
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      From {fromInfo?.label ?? log.fromStage}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                      {format(new Date(log.createdAt), 'd MMMM yyyy, h:mm a')}
                    </p>
                  </div>
                </li>
              )
            })}

            {/* Application Created entry */}
            <li className="ml-6">
              <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 ring-4 ring-white dark:bg-slate-700 dark:ring-slate-900">
                <Circle className="h-3 w-3 text-slate-400" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  Application Created
                </h3>
                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                  {format(new Date(createdAt), 'd MMMM yyyy, h:mm a')}
                </p>
              </div>
            </li>
          </ol>
        </div>
      )}
    </div>
  )
}
