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
} from 'lucide-react'

function buildLinks(studyPathway?: string | null) {
  const isFullTime = studyPathway === 'FULL_TIME'

  const links = [
    { label: 'Dashboard', href: '/student', icon: LayoutDashboard },
    { label: 'Academic Calendar', href: '/student/academic-calendar', icon: CalendarCheck },
    { label: 'Wallet', href: '/student/wallet', icon: Wallet },
    { label: 'Resources', href: '/student/resources', icon: ScrollText },
    {
      label: 'My Courses',
      href: '/student/courses',
      icon: BookOpen,
      children: isFullTime
        ? [{ label: 'Enrolled Courses', href: '/student/courses' }]
        : [
            { label: 'Enrolled Courses', href: '/student/courses' },
            { label: 'Enroll in New', href: '/student/courses/enroll' },
          ],
    },
  ]

  // Exam Pools — only for non-full-time students (modular, exam-only, etc.)
  if (!isFullTime) {
    links.push({
      label: 'Exam Pools',
      href: '/student/exam-pools',
      icon: FileCheck,
    })
  }

  links.push(
    { label: 'Exams', href: '/student/exams', icon: ClipboardCheck },
    { label: 'Grades', href: '/student/grades', icon: CalendarCheck },
    { label: 'Attendance', href: '/student/attendance', icon: CalendarCheck },
    { label: 'Certificates', href: '/student/certificates', icon: Award },
    { label: 'Notifications', href: '/student/notifications', icon: Bell },
    { label: 'Messages', href: '/student/messages', icon: Mail },
    { label: 'Profile', href: '/student/profile', icon: User }
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
}: {
  userName?: string
  userRole?: string
  userImage?: string
  studyPathway?: string | null
  notificationCount?: number
  messageCount?: number
}) {
  const links = buildLinks(studyPathway)

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
