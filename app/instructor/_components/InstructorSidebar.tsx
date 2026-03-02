'use client'

import DashboardSidebar, { SidebarLink } from '@/components/layouts/DashboardSidebar'
import {
  LayoutDashboard,
  School,
  Calendar,
  Users,
  ClipboardCheck,
  FolderOpen,
  User,
} from 'lucide-react'

export default function InstructorSidebar({
  userName,
  userRole,
  userImage,
  pendingCount = 0,
}: {
  userName?: string
  userRole?: string
  userImage?: string
  pendingCount?: number
}) {
  const links: SidebarLink[] = [
    { label: 'Dashboard', href: '/instructor/dashboard', icon: LayoutDashboard },
    { label: 'Schedule', href: '/instructor/schedule', icon: Calendar },
    { type: 'header', label: 'Course Management' },
    { label: 'Courses', href: '/instructor/classes', icon: School },
    { label: 'Resources', href: '/instructor/resources', icon: FolderOpen },
    { label: 'Students', href: '/instructor/students', icon: Users },
    {
      label: 'Grading',
      href: '/instructor/grading',
      icon: ClipboardCheck,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    { type: 'header', label: 'Account' },
    { label: 'Profile', href: '/instructor/profile', icon: User },
  ]

  return (
    <DashboardSidebar
      links={links}
      portalLabel="Instructor Portal"
      portalColor="text-blue-400"
      userName={userName}
      userRole={userRole}
      userImage={userImage}
    />
  )
}
