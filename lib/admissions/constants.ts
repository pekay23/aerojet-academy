import {
  FileText,
  CreditCard,
  CheckCircle,
  Brain,
  ListChecks,
  Calendar,
  MessageSquare,
  Stethoscope,
  Upload,
  GraduationCap,
  XCircle,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import { ApplicationStage } from '@prisma/client'

// ---------------------------------------------------------------------------
// Stage metadata — labels, colors, icons, applicant-facing descriptions
// ---------------------------------------------------------------------------

export interface StageInfo {
  label: string
  shortLabel: string
  description: string
  color: string        // Tailwind bg class
  textColor: string    // Tailwind text class
  icon: LucideIcon
  applicantInstruction: string
  group: StageGroup
}

export type StageGroup =
  | 'registration'
  | 'documents'
  | 'aptitude'
  | 'shortlisting'
  | 'interview'
  | 'medical'
  | 'enrollment'
  | 'terminal'

export const STAGE_GROUPS: StageGroup[] = [
  'registration',
  'documents',
  'aptitude',
  'shortlisting',
  'interview',
  'medical',
  'enrollment',
]

export const STAGE_GROUP_LABELS: Record<StageGroup, string> = {
  registration: 'Registration & Payment',
  documents: 'Documents',
  aptitude: 'Aptitude Test',
  shortlisting: 'Shortlisting',
  interview: 'Interview',
  medical: 'Medical',
  enrollment: 'Enrollment',
  terminal: 'Final',
}

export const STAGE_INFO: Record<ApplicationStage, StageInfo> = {
  REGISTERED: {
    label: 'Registered',
    shortLabel: 'Registered',
    description: 'Account created successfully',
    color: 'bg-slate-100',
    textColor: 'text-slate-700',
    icon: FileText,
    applicantInstruction: 'Your account has been created. Please proceed to upload your payment proof.',
    group: 'registration',
  },
  PAYMENT_PENDING: {
    label: 'Payment Pending',
    shortLabel: 'Payment',
    description: 'Awaiting registration fee payment',
    color: 'bg-amber-100',
    textColor: 'text-amber-700',
    icon: CreditCard,
    applicantInstruction: 'Please upload proof of your registration fee payment to proceed.',
    group: 'registration',
  },
  PAYMENT_SUBMITTED: {
    label: 'Payment Submitted',
    shortLabel: 'Submitted',
    description: 'Payment proof uploaded, awaiting verification',
    color: 'bg-blue-100',
    textColor: 'text-blue-700',
    icon: Upload,
    applicantInstruction: 'Your payment proof has been submitted and is being reviewed by our team.',
    group: 'registration',
  },
  PAYMENT_VERIFIED: {
    label: 'Payment Verified',
    shortLabel: 'Verified',
    description: 'Registration fee payment has been verified',
    color: 'bg-green-100',
    textColor: 'text-green-700',
    icon: CheckCircle,
    applicantInstruction: 'Your payment has been verified. Please proceed to upload your documents.',
    group: 'registration',
  },
  APTITUDE_PENDING: {
    label: 'Aptitude Test Pending',
    shortLabel: 'Aptitude',
    description: 'Awaiting aptitude test completion',
    color: 'bg-purple-100',
    textColor: 'text-purple-700',
    icon: Brain,
    applicantInstruction: 'You are ready to take the aptitude test. Please start the test when you are prepared.',
    group: 'aptitude',
  },
  APTITUDE_COMPLETED: {
    label: 'Aptitude Completed',
    shortLabel: 'Tested',
    description: 'Aptitude test completed, awaiting review',
    color: 'bg-purple-200',
    textColor: 'text-purple-800',
    icon: Brain,
    applicantInstruction: 'Your aptitude test has been completed. Our team is reviewing the results.',
    group: 'aptitude',
  },
  SHORTLISTED: {
    label: 'Shortlisted',
    shortLabel: 'Shortlisted',
    description: 'Selected for interview stage',
    color: 'bg-indigo-100',
    textColor: 'text-indigo-700',
    icon: ListChecks,
    applicantInstruction: 'Congratulations! You have been shortlisted. Please schedule your interview.',
    group: 'shortlisting',
  },
  INTERVIEW_PENDING: {
    label: 'Interview Pending',
    shortLabel: 'Interview',
    description: 'Awaiting interview scheduling',
    color: 'bg-cyan-100',
    textColor: 'text-cyan-700',
    icon: Calendar,
    applicantInstruction: 'Please select an available time slot to schedule your interview.',
    group: 'interview',
  },
  INTERVIEW_SCHEDULED: {
    label: 'Interview Scheduled',
    shortLabel: 'Scheduled',
    description: 'Interview date confirmed',
    color: 'bg-cyan-200',
    textColor: 'text-cyan-800',
    icon: Calendar,
    applicantInstruction: 'Your interview is scheduled. Please attend at the confirmed date and time.',
    group: 'interview',
  },
  INTERVIEW_COMPLETED: {
    label: 'Interview Completed',
    shortLabel: 'Interviewed',
    description: 'Interview completed, awaiting decision',
    color: 'bg-teal-100',
    textColor: 'text-teal-700',
    icon: MessageSquare,
    applicantInstruction: 'Your interview has been completed. We are reviewing the results.',
    group: 'interview',
  },
  SELECTED: {
    label: 'Selected',
    shortLabel: 'Selected',
    description: 'Selected for admission, pending medical',
    color: 'bg-emerald-100',
    textColor: 'text-emerald-700',
    icon: CheckCircle,
    applicantInstruction: 'Congratulations! You have been selected. Please proceed with your medical examination.',
    group: 'interview',
  },
  MEDICAL_PENDING: {
    label: 'Medical Pending',
    shortLabel: 'Medical',
    description: 'Awaiting medical examination documents',
    color: 'bg-rose-100',
    textColor: 'text-rose-700',
    icon: Stethoscope,
    applicantInstruction: 'Please complete your medical examination and upload the required documents.',
    group: 'medical',
  },
  MEDICAL_SUBMITTED: {
    label: 'Medical Submitted',
    shortLabel: 'Submitted',
    description: 'Medical documents submitted for review',
    color: 'bg-rose-200',
    textColor: 'text-rose-800',
    icon: Stethoscope,
    applicantInstruction: 'Your medical documents have been submitted and are being reviewed.',
    group: 'medical',
  },
  MEDICAL_CLEARED: {
    label: 'Medical Cleared',
    shortLabel: 'Cleared',
    description: 'Medical examination passed',
    color: 'bg-green-200',
    textColor: 'text-green-800',
    icon: CheckCircle,
    applicantInstruction: 'Your medical clearance has been approved. You are now being enrolled.',
    group: 'medical',
  },
  ENROLLED: {
    label: 'Enrolled',
    shortLabel: 'Enrolled',
    description: 'Successfully enrolled as a student',
    color: 'bg-green-500',
    textColor: 'text-white',
    icon: GraduationCap,
    applicantInstruction: 'Welcome! You have been successfully enrolled. Your student portal is now active.',
    group: 'enrollment',
  },
  REJECTED: {
    label: 'Rejected',
    shortLabel: 'Rejected',
    description: 'Application was not successful',
    color: 'bg-red-100',
    textColor: 'text-red-700',
    icon: XCircle,
    applicantInstruction: 'Unfortunately, your application was not successful at this time.',
    group: 'terminal',
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    shortLabel: 'Withdrawn',
    description: 'Application withdrawn by applicant',
    color: 'bg-gray-100',
    textColor: 'text-gray-500',
    icon: LogOut,
    applicantInstruction: 'You have withdrawn your application.',
    group: 'terminal',
  },
}

// ---------------------------------------------------------------------------
// Allowed transitions map — defines which stages can move to which
// ---------------------------------------------------------------------------

export const ALLOWED_TRANSITIONS: Record<ApplicationStage, ApplicationStage[]> = {
  REGISTERED:           [ApplicationStage.PAYMENT_PENDING, ApplicationStage.WITHDRAWN],
  PAYMENT_PENDING:      [ApplicationStage.PAYMENT_SUBMITTED, ApplicationStage.PAYMENT_VERIFIED, ApplicationStage.WITHDRAWN],
  PAYMENT_SUBMITTED:    [ApplicationStage.PAYMENT_VERIFIED, ApplicationStage.PAYMENT_PENDING, ApplicationStage.REJECTED],
  PAYMENT_VERIFIED:     [ApplicationStage.APTITUDE_PENDING, ApplicationStage.SHORTLISTED, ApplicationStage.INTERVIEW_PENDING, ApplicationStage.MEDICAL_PENDING, ApplicationStage.ENROLLED, ApplicationStage.REJECTED],
  APTITUDE_PENDING:     [ApplicationStage.APTITUDE_COMPLETED, ApplicationStage.REJECTED, ApplicationStage.WITHDRAWN],
  APTITUDE_COMPLETED:   [ApplicationStage.SHORTLISTED, ApplicationStage.REJECTED],
  SHORTLISTED:          [ApplicationStage.INTERVIEW_PENDING, ApplicationStage.ENROLLED, ApplicationStage.REJECTED],
  INTERVIEW_PENDING:    [ApplicationStage.INTERVIEW_SCHEDULED, ApplicationStage.REJECTED, ApplicationStage.WITHDRAWN],
  INTERVIEW_SCHEDULED:  [ApplicationStage.INTERVIEW_COMPLETED, ApplicationStage.INTERVIEW_PENDING, ApplicationStage.REJECTED],
  INTERVIEW_COMPLETED:  [ApplicationStage.SELECTED, ApplicationStage.REJECTED],
  SELECTED:             [ApplicationStage.MEDICAL_PENDING, ApplicationStage.ENROLLED, ApplicationStage.REJECTED],
  MEDICAL_PENDING:      [ApplicationStage.MEDICAL_SUBMITTED, ApplicationStage.REJECTED, ApplicationStage.WITHDRAWN],
  MEDICAL_SUBMITTED:    [ApplicationStage.MEDICAL_CLEARED, ApplicationStage.MEDICAL_PENDING, ApplicationStage.REJECTED],
  MEDICAL_CLEARED:      [ApplicationStage.ENROLLED],
  ENROLLED:             [],
  REJECTED:             [ApplicationStage.PAYMENT_VERIFIED], // Allow re-opening
  WITHDRAWN:            [ApplicationStage.PAYMENT_PENDING],  // Allow re-activation
}

// ---------------------------------------------------------------------------
// Per-programme default stage config — which stage groups are enabled
// ---------------------------------------------------------------------------

export interface PipelineStageConfig {
  documents: boolean
  aptitude: boolean
  shortlisting: boolean
  interview: boolean
  medical: boolean
}

export const DEFAULT_PIPELINE_STAGE_CONFIG: Record<string, PipelineStageConfig> = {
  FULL_TIME_4YEAR:  { documents: true, aptitude: true, shortlisting: true, interview: true, medical: true },
  FULL_TIME_2YEAR:  { documents: true, aptitude: true, shortlisting: true, interview: true, medical: true },
  MILITARY_1YEAR:   { documents: true, aptitude: true, shortlisting: true, interview: true, medical: true },
  MODULAR:          { documents: true, aptitude: false, shortlisting: false, interview: false, medical: false },
  EXAM_ONLY:        { documents: false, aptitude: false, shortlisting: false, interview: false, medical: false },
}

// ---------------------------------------------------------------------------
// Stage ordering — linear pipeline order for progress calculation
// ---------------------------------------------------------------------------

export const STAGE_ORDER: ApplicationStage[] = [
  ApplicationStage.REGISTERED,
  ApplicationStage.PAYMENT_PENDING,
  ApplicationStage.PAYMENT_SUBMITTED,
  ApplicationStage.PAYMENT_VERIFIED,
  ApplicationStage.APTITUDE_PENDING,
  ApplicationStage.APTITUDE_COMPLETED,
  ApplicationStage.SHORTLISTED,
  ApplicationStage.INTERVIEW_PENDING,
  ApplicationStage.INTERVIEW_SCHEDULED,
  ApplicationStage.INTERVIEW_COMPLETED,
  ApplicationStage.SELECTED,
  ApplicationStage.MEDICAL_PENDING,
  ApplicationStage.MEDICAL_SUBMITTED,
  ApplicationStage.MEDICAL_CLEARED,
  ApplicationStage.ENROLLED,
]

/**
 * Returns the ordered list of stages an applicant goes through,
 * taking into account which stage groups are enabled for their programme.
 */
export function getActiveStagesForConfig(config: PipelineStageConfig): ApplicationStage[] {
  const stages: ApplicationStage[] = [
    // Registration always included
    ApplicationStage.REGISTERED,
    ApplicationStage.PAYMENT_PENDING,
    ApplicationStage.PAYMENT_SUBMITTED,
    ApplicationStage.PAYMENT_VERIFIED,
  ]

  if (config.aptitude) {
    stages.push(ApplicationStage.APTITUDE_PENDING, ApplicationStage.APTITUDE_COMPLETED)
  }

  if (config.shortlisting) {
    stages.push(ApplicationStage.SHORTLISTED)
  }

  if (config.interview) {
    stages.push(
      ApplicationStage.INTERVIEW_PENDING,
      ApplicationStage.INTERVIEW_SCHEDULED,
      ApplicationStage.INTERVIEW_COMPLETED,
      ApplicationStage.SELECTED,
    )
  }

  if (config.medical) {
    stages.push(
      ApplicationStage.MEDICAL_PENDING,
      ApplicationStage.MEDICAL_SUBMITTED,
      ApplicationStage.MEDICAL_CLEARED,
    )
  }

  stages.push(ApplicationStage.ENROLLED)
  return stages
}

/**
 * Returns the "milestone" stages shown in the pipeline tracker UI.
 * These represent the major visible steps, not every sub-state.
 */
export function getMilestoneStages(config: PipelineStageConfig): { stage: ApplicationStage; label: string }[] {
  const milestones: { stage: ApplicationStage; label: string }[] = [
    { stage: ApplicationStage.REGISTERED, label: 'Registration' },
    { stage: ApplicationStage.PAYMENT_VERIFIED, label: 'Payment' },
  ]

  if (config.aptitude) {
    milestones.push({ stage: ApplicationStage.APTITUDE_COMPLETED, label: 'Aptitude Test' })
  }

  if (config.shortlisting) {
    milestones.push({ stage: ApplicationStage.SHORTLISTED, label: 'Shortlisting' })
  }

  if (config.interview) {
    milestones.push({ stage: ApplicationStage.SELECTED, label: 'Interview' })
  }

  if (config.medical) {
    milestones.push({ stage: ApplicationStage.MEDICAL_CLEARED, label: 'Medical' })
  }

  milestones.push({ stage: ApplicationStage.ENROLLED, label: 'Enrolled' })
  return milestones
}
