'use client'

import DashboardSidebar from '@/components/layouts/DashboardSidebar'
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
  Mail,
  ScrollText,
  CreditCard,
  Settings,
} from 'lucide-react'
import type { PaymentAccessLevel } from '@/lib/access-control'
import type { SidebarLinkItem } from '@/components/layouts/DashboardSidebar'
import { useBadgeCounts } from '@/hooks/useBadgeCounts'

function buildLinks(studyPathway?: string | null, paymentAccessLevel?: PaymentAccessLevel) {
  const isFullTime = ['FULL_TIME', 'FULL_TIME_4Y', 'FULL_TIME_2Y', 'MILITARY_1Y'].includes(
    studyPathway || ''
  )
  const isExamOnly = studyPathway === 'EXAM_ONLY'
  const isRestricted = paymentAccessLevel === 'RESTRICTED' || paymentAccessLevel === 'SEAT_ONLY'
  const hasFullAccess = paymentAccessLevel === 'FULL_ACCESS'

  const baseLinks: SidebarLinkItem[] = [
    { label: 'Dashboard', href: '/student', icon: LayoutDashboard },
  ]

  // Exam-Only students: limited sidebar — wallet, exam bookings, notifications, profile
  if (isExamOnly) {
    baseLinks.push(
      { label: 'Wallet', href: '/student/wallet', icon: Wallet },
      { label: 'Exams', href: '/student/exams', icon: ClipboardCheck }
    )
  } else {
    if (isFullTime && isRestricted) {
      baseLinks.push({ label: 'Wallet', href: '/student/wallet', icon: Wallet })
    } else {
      baseLinks.push(
        { label: 'Academic Calendar', href: '/student/academic-calendar', icon: CalendarCheck },
        { label: 'Wallet', href: '/student/wallet', icon: Wallet }
      )
    }

    if (!isFullTime) {
      baseLinks.push({ label: 'Resources', href: '/student/resources', icon: ScrollText })
    }

    if (hasFullAccess || !isFullTime) {
      baseLinks.push({
        label: 'My Courses',
        href: '/student/courses',
        icon: BookOpen,
        children: isFullTime
          ? [{ label: 'Enrolled Courses', href: '/student/courses' }]
          : [
              { label: 'Enrolled Courses', href: '/student/courses' },
              { label: 'Enroll in New', href: '/student/courses/enroll' },
            ],
      })
    }

    if (hasFullAccess) {
      baseLinks.push(
        { label: 'Exams', href: '/student/exams', icon: ClipboardCheck },
        { label: 'Grades', href: '/student/grades', icon: Award },
        { label: 'Attendance', href: '/student/attendance', icon: FileCheck },
        { label: 'Certificates', href: '/student/certificates', icon: Award }
      )
    }
  }

  baseLinks.push(
    { label: 'Notifications', href: '/student/notifications', icon: Bell },
    { label: 'Messages', href: '/student/messages', icon: Mail },
  )

  return baseLinks
}

export default function StudentSidebar({
  userName,
  userRole,
  userImage,
  studyPathway,
  notificationCount = 0,
  messageCount = 0,
  paymentAccessLevel,
}: {
  userName?: string
  userRole?: string
  userImage?: string
  studyPathway?: string | null
  notificationCount?: number
  messageCount?: number
  paymentAccessLevel?: PaymentAccessLevel
}) {
  const { counts } = useBadgeCounts({
    notifications: notificationCount,
    messages: messageCount,
  })

  const links = buildLinks(studyPathway, paymentAccessLevel)

  const linksWithBadge = links.map((link) => {
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
        { label: 'Settings', href: '/student/profile?tab=settings', icon: Settings },
      ]}
    />
  )
}
