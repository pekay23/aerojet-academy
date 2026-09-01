'use client'

import DashboardSidebar from '@/components/layouts/DashboardSidebar'
import type { SidebarLink, SidebarLinkItem } from '@/components/layouts/DashboardSidebar'
import {
  LayoutDashboard,
  Wallet,
  BookOpen,
  FileCheck,
  ClipboardCheck,
  CalendarCheck,
  Award,
  Bell,
  User,
  Users,
  Mail,
  ScrollText,
  GraduationCap,
  Armchair,
  FileQuestion,
  BookMarked,
  FolderOpen,
  Calendar,
} from 'lucide-react'
import type { PaymentAccessLevel } from '@/lib/access-control'
import { useBadgeCounts } from '@/hooks/useBadgeCounts'

function buildLinks(
  studyPathway?: string | null,
  paymentAccessLevel?: PaymentAccessLevel,
  internalExamEnabled = false,
  showRevisionSupport = false,
  hasWallet = true,
) {
  const isFullTime = [
    'FULL_TIME',
    'FULL_TIME_4Y',
    'FULL_TIME_2Y',
    'MILITARY_2Y',
    'MILITARY_1Y',
  ].includes(studyPathway || '')
  const isExamOnly = studyPathway === 'EXAM_ONLY'
  const isModular = !isFullTime && !isExamOnly && !!studyPathway

  const links: SidebarLink[] = [
    { label: 'Dashboard', href: '/student', icon: LayoutDashboard, tourId: 'nav-dashboard' },
  ]

  // ── Academic ──
  const academicChildren: { label: string; href: string }[] = []

  if (isFullTime) {
    // Full-time: view-only courses (no enroll option)
    academicChildren.push({ label: 'My Courses', href: '/student/courses' })
  } else if (isModular) {
    // Modular: can browse catalog and enroll
    academicChildren.push(
      { label: 'My Courses', href: '/student/courses' },
      { label: 'Enroll in New', href: '/student/courses/enroll' },
    )
  }
  // Exam-only: no courses

  if (!isExamOnly || isFullTime || isModular) {
    // Resources: everyone except… actually everyone gets resources per the matrix
  }
  // Resources: all pathways
  academicChildren.push({ label: 'Resources', href: '/student/resources' })
  // Academic Calendar: all pathways
  academicChildren.push({ label: 'Academic Calendar', href: '/student/academic-calendar' })

  if (academicChildren.length > 0) {
    links.push({
      label: 'Academic',
      href: '/student/courses',
      icon: BookOpen,
      children: academicChildren,
      tourId: 'group-academic',
    })
  }

  // ── Examinations ──
  const examChildren: { label: string; href: string }[] = []

  if (isFullTime) {
    // Full-time: records only (internal + official EASA scores)
    examChildren.push({ label: 'Exam Records', href: '/student/exams?tab=records' })
  } else {
    // Modular + Exam-only: full exam tabs
    examChildren.push({ label: 'Exams', href: '/student/exams?tab=records' })
  }

  // Internal Exams: full-time + modular (if enabled), NOT exam-only
  if (internalExamEnabled && !isExamOnly) {
    examChildren.push({ label: 'Internal Exams', href: '/student/exams/internal' })
  }

  // Revision Support: modular + exam-only only (timing-gated via flag), NOT full-time
  if (!isFullTime && showRevisionSupport) {
    examChildren.push({ label: 'Revision Support', href: '/student/courses/revision' })
  }

  if (examChildren.length > 0) {
    links.push({
      label: 'Examinations',
      href: '/student/exams',
      icon: ClipboardCheck,
      children: examChildren,
      tourId: 'group-exams',
    })
  }

  // ── Progress & Records ──
  const progressChildren: { label: string; href: string }[] = []

  // Grades: full-time + modular only, NOT exam-only
  if (!isExamOnly) {
    progressChildren.push({ label: 'Grades', href: '/student/grades' })
  }

  // License Progress: full-time only
  if (isFullTime) {
    progressChildren.push({ label: 'License Progress', href: '/student/license-progress' })
  }

  // Transcript: all pathways (customized per pathway at page level)
  progressChildren.push({ label: 'Transcript', href: '/student/transcript' })

  // Certificates: all pathways
  progressChildren.push({ label: 'Certificates', href: '/student/certificates' })

  if (progressChildren.length > 0) {
    links.push({
      label: 'Progress & Records',
      href: '/student/grades',
      icon: Award,
      children: progressChildren,
      tourId: 'group-progress',
    })
  }

  // ── Academy Life ──
  const academyLifeChildren: { label: string; href: string }[] = []

  // Classmates: full-time only
  if (isFullTime) {
    academyLifeChildren.push({ label: 'Classmates', href: '/student/classmates' })
  }

  // Attendance: full-time (class attendance) + exam-only (exam attendance)
  if (isFullTime || isExamOnly) {
    academyLifeChildren.push({ label: 'Attendance', href: '/student/attendance' })
  }

  // My Seating: full-time (class seating) + exam-only (exam seating)
  if (isFullTime || isExamOnly) {
    academyLifeChildren.push({ label: 'My Seating', href: '/student/seating' })
  }

  // OJT Logbook: full-time only
  if (isFullTime) {
    academyLifeChildren.push({ label: 'OJT Logbook', href: '/student/ojt' })
  }

  if (academyLifeChildren.length > 0) {
    links.push({
      label: 'Academy Life',
      href: '/student/attendance',
      icon: GraduationCap,
      children: academyLifeChildren,
      tourId: 'group-academy-life',
    })
  }

  // ── Financial ──
  // Wallet: all pathways (for full-time, only shown if self-funded / has wallet)
  if (!isFullTime || hasWallet) {
    links.push({ label: 'Wallet', href: '/student/wallet', icon: Wallet, tourId: 'nav-wallet' })
  }

  // ── Documents ──
  // All pathways
  links.push({ label: 'My Documents', href: '/student/documents', icon: FolderOpen })

  // ── Communication ──
  links.push(
    { label: 'Notifications', href: '/student/notifications', icon: Bell, tourId: 'nav-notifications' },
    { label: 'Messages', href: '/student/messages', icon: Mail },
  )

  return links
}

export default function StudentSidebar({
  userName,
  userRole,
  userImage,
  studyPathway,
  notificationCount = 0,
  messageCount = 0,
  paymentAccessLevel,
  internalExamEnabled = false,
  showRevisionSupport = false,
  hasWallet = true,
}: {
  userName?: string
  userRole?: string
  userImage?: string
  studyPathway?: string | null
  notificationCount?: number
  messageCount?: number
  paymentAccessLevel?: PaymentAccessLevel
  internalExamEnabled?: boolean
  showRevisionSupport?: boolean
  hasWallet?: boolean
}) {
  const { counts } = useBadgeCounts({
    notifications: notificationCount,
    messages: messageCount,
  })

  const links = buildLinks(studyPathway, paymentAccessLevel, internalExamEnabled, showRevisionSupport, hasWallet)

  const linksWithBadge = links.map((link) => {
    if (link.type === 'header') return link
    if (link.label === 'Notifications') {
      return { ...link, badge: counts.notifications > 0 ? counts.notifications : undefined }
    }
    if (link.label === 'Messages') {
      return { ...link, badge: counts.messages > 0 ? counts.messages : undefined }
    }
    return link
  })

  return (
    <DashboardSidebar
      links={linksWithBadge}
      portalLabel="Student Portal"
      portalColor="text-green-400"
      userName={userName}
      userRole={userRole}
      userImage={userImage}
      userMenuItems={[
        { label: 'Profile', href: '/student/profile', icon: User },
        { label: 'Ambassador', href: '/student/ambassador', icon: Users },
        { label: 'Request Withdrawal', href: '/student/withdrawal', icon: FileCheck },
      ]}
    />
  )
}
