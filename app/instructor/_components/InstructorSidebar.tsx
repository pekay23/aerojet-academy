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
import { useBadgeCounts } from '@/hooks/useBadgeCounts'

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
  const { counts } = useBadgeCounts({ pendingGrading: pendingCount })

  const links: SidebarLink[] = [
    { label: 'Dashboard', href: '/instructor/dashboard', icon: LayoutDashboard },
    { label: 'Schedule', href: '/instructor/schedule', icon: Calendar },
    { label: 'Availability', href: '/instructor/availability', icon: Calendar },
    { type: 'header', label: 'Course Management' },
    { label: 'Courses', href: '/instructor/classes', icon: School },
    { label: 'Resources', href: '/instructor/resources', icon: FolderOpen },
    { label: 'Teaching Materials', href: '/instructor/materials', icon: FolderOpen },
    { label: 'Students', href: '/instructor/students', icon: Users },
    { label: 'My Metrics', href: '/instructor/metrics', icon: LayoutDashboard },
    {
      label: 'Grading',
      href: '/instructor/grading',
      icon: ClipboardCheck,
      badge: (counts.pendingGrading ?? 0) > 0 ? counts.pendingGrading : undefined,
    },
  ]

  return (
    <DashboardSidebar
      links={links}
      portalLabel="Instructor Portal"
      portalColor="text-blue-400"
      userName={userName}
      userRole={userRole}
      userImage={userImage}
      userMenuItems={[
        { label: 'Profile', href: '/instructor/profile', icon: User },
      ]}
    />
  )
}
