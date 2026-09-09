'use client'

import DashboardSidebar, { type SidebarLink } from '@/components/layouts/DashboardSidebar'
import {
  LayoutDashboard,
  ClipboardList,
  BookOpen,
  FileText,
  User,
  Wallet,
  Bell,
  Brain,
  Calendar,
  Stethoscope,
  Upload,
} from 'lucide-react'

// Stages where the applicant has access beyond the basics
const DOCUMENT_STAGES = [
  'PAYMENT_VERIFIED',
  'APTITUDE_PENDING',
  'APTITUDE_COMPLETED',
  'SHORTLISTED',
  'INTERVIEW_PENDING',
  'INTERVIEW_SCHEDULED',
  'INTERVIEW_COMPLETED',
  'SELECTED',
  'MEDICAL_PENDING',
  'MEDICAL_SUBMITTED',
  'MEDICAL_CLEARED',
  'ENROLLED',
]
const APTITUDE_STAGES = ['APTITUDE_PENDING', 'APTITUDE_COMPLETED']
const INTERVIEW_STAGES = [
  'INTERVIEW_PENDING',
  'INTERVIEW_SCHEDULED',
  'INTERVIEW_COMPLETED',
  'SELECTED',
]
const MEDICAL_STAGES = ['MEDICAL_PENDING', 'MEDICAL_SUBMITTED', 'MEDICAL_CLEARED']
const POST_PAYMENT_STAGES = [
  'PAYMENT_VERIFIED',
  'APTITUDE_PENDING',
  'APTITUDE_COMPLETED',
  'SHORTLISTED',
  'INTERVIEW_PENDING',
  'INTERVIEW_SCHEDULED',
  'INTERVIEW_COMPLETED',
  'SELECTED',
  'MEDICAL_PENDING',
  'MEDICAL_SUBMITTED',
  'MEDICAL_CLEARED',
  'ENROLLED',
]

interface ApplicantSidebarProps {
  userName?: string
  userRole?: string
  userImage?: string
  hasPathway?: boolean
  isExamOnly?: boolean
  pipelineEnabled?: boolean
  applicationStage?: string | null
  enabledStageGroups?: {
    documents: boolean
    aptitude: boolean
    interview: boolean
    medical: boolean
  }
}

export default function ApplicantSidebar({
  userName,
  userRole,
  userImage,
  hasPathway,
  isExamOnly,
  pipelineEnabled,
  applicationStage,
  enabledStageGroups,
}: ApplicantSidebarProps) {
  let links: SidebarLink[]

  if (pipelineEnabled && applicationStage) {
    // Dynamic pipeline-aware sidebar
    links = buildPipelineLinks(applicationStage, isExamOnly, enabledStageGroups)
  } else if (isExamOnly) {
    links = [
      { label: 'Dashboard', href: '/exam-only/dashboard', icon: LayoutDashboard },
      { label: 'Wallet', href: '/exam-only/top-up', icon: Wallet },
      { label: 'Exams', href: '/exam-only', icon: ClipboardList },
      { label: 'Courses', href: '/courses', icon: BookOpen },
      { label: 'Notifications', href: '/notifications', icon: Bell },
    ]
  } else if (hasPathway) {
    links = [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      {
        label: 'My Application',
        href: '/application/status',
        icon: FileText,
        tourId: 'nav-application',
      },
      { label: 'Wallet', href: '/wallet-top-up', icon: Wallet },
      { label: 'Browse Courses', href: '/courses', icon: BookOpen },
      { label: 'Exam Bookings', href: '/exam-bookings', icon: ClipboardList },
      { label: 'Notifications', href: '/notifications', icon: Bell },
    ]
  } else {
    links = [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      {
        label: 'My Application',
        href: '/application/status',
        icon: FileText,
        tourId: 'nav-application',
      },
      { label: 'Notifications', href: '/notifications', icon: Bell },
    ]
  }

  return (
    <DashboardSidebar
      links={links}
      basePath="/applicant"
      portalLabel="Applicant Portal"
      portalColor="text-orange-400"
      userName={userName}
      userRole={userRole}
      userImage={userImage}
      userMenuItems={[{ label: 'Profile', href: '/profile', icon: User }]}
    />
  )
}

function buildPipelineLinks(
  stage: string,
  isExamOnly?: boolean,
  enabledStageGroups = { documents: true, aptitude: true, interview: true, medical: true }
): SidebarLink[] {
  const links: SidebarLink[] = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'My Application', href: '/application/status', icon: FileText },
  ]

  // Document uploads — available after payment verified
  if (enabledStageGroups.documents && DOCUMENT_STAGES.includes(stage)) {
    links.push({ label: 'Documents', href: '/application/documents', icon: Upload })
  }

  // Aptitude test — only during aptitude stages
  if (enabledStageGroups.aptitude && APTITUDE_STAGES.includes(stage)) {
    links.push({ label: 'Aptitude Test', href: '/application/aptitude-test', icon: Brain })
  }

  // Interview — only during interview stages
  if (enabledStageGroups.interview && INTERVIEW_STAGES.includes(stage)) {
    links.push({ label: 'Interview', href: '/application/interview', icon: Calendar })
  }

  // Medical — only during medical stages
  if (enabledStageGroups.medical && MEDICAL_STAGES.includes(stage)) {
    links.push({ label: 'Medical', href: '/application/medical', icon: Stethoscope })
  }

  // Wallet and courses — available after payment
  if (POST_PAYMENT_STAGES.includes(stage)) {
    links.push({ label: 'Wallet', href: '/wallet-top-up', icon: Wallet, tourId: 'nav-wallet' })
    if (!isExamOnly) {
      links.push({ label: 'Browse Courses', href: '/courses', icon: BookOpen })
    }
  }

  // Exam bookings for exam-only applicants
  if (isExamOnly && POST_PAYMENT_STAGES.includes(stage)) {
    links.push({ label: 'Exams', href: '/exam-only', icon: ClipboardList })
  } else if (POST_PAYMENT_STAGES.includes(stage)) {
    links.push({ label: 'Exam Bookings', href: '/exam-bookings', icon: ClipboardList })
  }

  links.push({
    label: 'Notifications',
    href: '/notifications',
    icon: Bell,
    tourId: 'nav-notifications',
  })
  return links
}
