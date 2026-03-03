'use client'

import DashboardSidebar from '@/components/layouts/DashboardSidebar'
import {
  LayoutDashboard,
  ClipboardList,
  BookOpen,
  FileCheck,
  User,
  Wallet,
  GraduationCap,
} from 'lucide-react'

const allLinks = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Application', href: '/application/status', icon: ClipboardList },
  { label: 'Wallet', href: '/wallet-top-up', icon: Wallet },
  { label: 'Browse Courses', href: '/courses', icon: BookOpen },
  { label: 'Exam Pools', href: '/exam-pools', icon: FileCheck },
  { label: 'Profile', href: '/profile', icon: User },
]

const examOnlyLinks = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Application', href: '/application/status', icon: ClipboardList },
  { label: 'Exam Only Pathway', href: '/exam-only', icon: GraduationCap },
  { label: 'Profile', href: '/profile', icon: User },
]

const restrictedLinks = [
  { label: 'Choose Study Path', href: '/pathway', icon: LayoutDashboard },
  { label: 'Exam Only Pathway', href: '/exam-only', icon: GraduationCap },
  { label: 'Profile', href: '/profile', icon: User },
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
    />
  )
}
