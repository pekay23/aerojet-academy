'use client'

import DashboardSidebar from '@/components/layouts/DashboardSidebar'
import {
  LayoutDashboard,
  ClipboardList,
  BookOpen,
  FileCheck,
  FileText,
  User,
  Wallet,
  GraduationCap,
  Bell,
} from 'lucide-react'

const allLinks = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Application', href: '/application/status', icon: FileText },
  { label: 'Wallet', href: '/wallet-top-up', icon: Wallet },
  { label: 'Browse Courses', href: '/courses', icon: BookOpen },
  { label: 'Exam Bookings', href: '/exam-bookings', icon: ClipboardList },
  { label: 'Notifications', href: '/notifications', icon: Bell },
]

const examOnlyLinks = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Wallet', href: '/wallet-top-up', icon: Wallet },
  { label: 'Exams', href: '/exam-only', icon: ClipboardList },
  { label: 'Courses', href: '/courses', icon: BookOpen },
  { label: 'Notifications', href: '/notifications', icon: Bell },
]

const restrictedLinks = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Application', href: '/application/status', icon: FileText },
  { label: 'Notifications', href: '/notifications', icon: Bell },
]

interface ApplicantSidebarProps {
  userName?: string
  userRole?: string
  userImage?: string
  hasPathway?: boolean
  isExamOnly?: boolean
}

export default function ApplicantSidebar({
  userName,
  userRole,
  userImage,
  hasPathway,
  isExamOnly,
}: ApplicantSidebarProps) {
  const links = isExamOnly ? examOnlyLinks : hasPathway ? allLinks : restrictedLinks

  return (
    <DashboardSidebar
      links={links}
      basePath="/applicant"
      portalLabel="Applicant Portal"
      portalColor="text-orange-400"
      userName={userName}
      userRole={userRole}
      userImage={userImage}
      userMenuItems={[
        { label: 'Profile', href: '/profile', icon: User },
      ]}
    />
  )
}
