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
} from 'lucide-react'
import type { PaymentAccessLevel } from '@/lib/access-control'
import type { SidebarLinkItem } from '@/components/layouts/DashboardSidebar'

function buildLinks(studyPathway?: string | null, paymentAccessLevel?: PaymentAccessLevel) {
  const isFullTime = studyPathway === 'FULL_TIME'
  const isRestricted = paymentAccessLevel === 'RESTRICTED' || paymentAccessLevel === 'SEAT_ONLY'
  const hasFullAccess = paymentAccessLevel === 'FULL_ACCESS'

  const baseLinks: SidebarLinkItem[] = [
    { label: 'Dashboard', href: '/student', icon: LayoutDashboard },
  ]

  if (isFullTime && isRestricted) {
    baseLinks.push(
      { label: 'Wallet', href: '/student/wallet', icon: Wallet },
      { label: 'Payments', href: '/student/wallet?tab=payments', icon: CreditCard }
    )
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

  if (!isFullTime) {
    baseLinks.push({
      label: 'Exam Pools',
      href: '/student/exam-pools',
      icon: FileCheck,
    })
  }

  if (hasFullAccess) {
    baseLinks.push(
      { label: 'Exams', href: '/student/exams', icon: ClipboardCheck },
      { label: 'Grades', href: '/student/grades', icon: CalendarCheck },
      { label: 'Attendance', href: '/student/attendance', icon: CalendarCheck },
      { label: 'Certificates', href: '/student/certificates', icon: Award }
    )
  }

  baseLinks.push(
    { label: 'Notifications', href: '/student/notifications', icon: Bell },
    { label: 'Messages', href: '/student/messages', icon: Mail },
    { label: 'Profile', href: '/student/profile', icon: User }
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
  const links = buildLinks(studyPathway, paymentAccessLevel)

  const linksWithBadge = links.map((link) => {
    if (link.label === 'Notifications') {
      return { ...link, badge: notificationCount > 0 ? notificationCount : undefined }
    }
    if (link.label === 'Messages') {
      return { ...link, badge: messageCount > 0 ? messageCount : undefined }
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
    />
  )
}
