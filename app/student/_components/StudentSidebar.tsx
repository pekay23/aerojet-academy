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

const links = [
  { label: 'Dashboard', href: '/student', icon: LayoutDashboard },
  { label: 'Academic Calendar', href: '/student/academic-calendar', icon: CalendarCheck },
  {
    label: 'Wallet',
    href: '/student/wallet',
    icon: Wallet,
    children: [
      { label: 'Overview', href: '/student/wallet' },
      { label: 'Top Up', href: '/student/wallet/top-up' },
      { label: 'Transactions', href: '/student/wallet/transactions' },
    ],
  },
  { label: 'Resources', href: '/student/resources', icon: ScrollText },
  {
    label: 'My Courses',
    href: '/student/courses',
    icon: BookOpen,
    children: [
      { label: 'Enrolled Courses', href: '/student/courses' },
      { label: 'Enroll in New', href: '/student/courses/enroll' },
    ],
  },
  {
    label: 'Exam Pools',
    href: '/student/exam-pools',
    icon: FileCheck,
    children: [
      { label: 'Available Pools', href: '/student/exam-pools' },
      { label: 'My Bookings', href: '/student/exam-pools/my-bookings' },
    ],
  },
  {
    label: 'Exams',
    href: '/student/exams',
    icon: ClipboardCheck,
    children: [
      { label: 'My Exams', href: '/student/exams' },
      { label: 'Schedule', href: '/student/exams/schedule' },
      { label: 'Results', href: '/student/exams/results' },
    ],
  },
  { label: 'Grades', href: '/student/grades', icon: CalendarCheck },
  { label: 'Attendance', href: '/student/attendance', icon: CalendarCheck },
  { label: 'Certificates', href: '/student/certificates', icon: Award },
  { label: 'Notifications', href: '/student/notifications', icon: Bell },
  { label: 'Messages', href: '/student/messages', icon: Mail },
  { label: 'Profile', href: '/student/profile', icon: User },
]

export default function StudentSidebar({
  userName,
  userRole,
  userImage,
  notificationCount = 0,
  messageCount = 0,
}: {
  userName?: string
  userRole?: string
  userImage?: string
  notificationCount?: number
  messageCount?: number
}) {
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
