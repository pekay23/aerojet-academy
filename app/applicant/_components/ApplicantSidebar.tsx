'use client'

import DashboardSidebar from '@/components/layouts/DashboardSidebar'
import { LayoutDashboard, ClipboardList, BookOpen, FileCheck, User } from 'lucide-react'

const allLinks = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Application', href: '/application/status', icon: ClipboardList },
  { label: 'Browse Courses', href: '/courses', icon: BookOpen },
  { label: 'Exam Pools', href: '/exam-pools', icon: FileCheck },
  { label: 'Profile', href: '/profile', icon: User },
]

export default function ApplicantSidebar({
  userName,
  userRole,
  userImage,
  hasPathway,
}: {
  userName?: string
  userRole?: string
  userImage?: string
  hasPathway?: boolean
}) {
  const restrictedLinks = [
    { label: 'Choose Study Path', href: '/pathway', icon: LayoutDashboard },
    { label: 'Profile', href: '/profile', icon: User },
  ]

  const links = hasPathway ? allLinks : restrictedLinks

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
