'use client'

import DashboardSidebar, { type SidebarLink } from '@/components/layouts/DashboardSidebar'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  GraduationCap,
  ClipboardList,
  CreditCard,
  Wallet,
  BookOpen,
  School,
  FileCheck,
  Megaphone,
  BarChart3,
  ScrollText,
  Settings,
  UserCog,
  Mail,
} from 'lucide-react'

interface StaffSidebarProps {
  userName?: string
  userRole?: string
  userImage?: string
  counts?: {
    applicants: number
    enrollments: number
    payments: number
    messages?: number
  }
}

export default function StaffSidebar({ userName, userRole, userImage, counts }: StaffSidebarProps) {
  const staffLinks: SidebarLink[] = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Users', href: '/users', icon: Users },
    {
      label: 'Applicants',
      href: '/applicants',
      icon: UserCheck,
      badge: counts?.applicants || undefined,
    },
    {
      label: 'Students',
      href: '/students',
      icon: GraduationCap,
      children: [
        { label: 'All Students', href: '/students' },
        { label: 'Import (CSV)', href: '/students/import' },
      ],
    },
    {
      label: 'Enrollments',
      href: '/enrollments',
      icon: ClipboardList,
      badge: counts?.enrollments || undefined,
    },
    {
      label: 'Payments',
      href: '/payments',
      icon: CreditCard,
      badge: counts?.payments || undefined,
    },
    {
      label: 'Finance',
      href: '/finance',
      icon: Wallet,
      children: [
        { label: 'Overview', href: '/finance' },
        { label: 'Wallet Top-ups', href: '/finance/wallet-topups' },
        { label: 'Transactions', href: '/finance/transactions' },
        { label: 'Reports', href: '/finance/reports' },
      ],
    },
    { label: 'Courses', href: '/courses', icon: BookOpen },
    { label: 'Classes', href: '/classes', icon: School },
    { label: 'Resources', href: '/resources', icon: ScrollText },
    {
      label: 'Exams',
      href: '/exams/events',
      icon: FileCheck,
      children: [
        { label: 'Exam Events', href: '/exams/events' },
        { label: 'Bookings', href: '/exams/bookings' },
        { label: 'Results', href: '/exams/results' },
      ],
    },

    {
      label: 'Reports',
      href: '/reports',
      icon: BarChart3,
      children: [
        { label: 'Overview', href: '/reports' },
        { label: 'Enrollment Trends', href: '/reports/enrollment-trends' },
        { label: 'Revenue', href: '/reports/revenue' },
        { label: 'Pool Analytics', href: '/reports/pool-analytics' },
        { label: 'Attendance', href: '/reports/attendance' },
      ],
    },
    { label: 'Newsroom', href: '/newsroom', icon: Megaphone },
    { label: 'Messages', href: '/messages', icon: Mail, badge: counts?.messages || undefined },
    { label: 'Audit Logs', href: '/audit-logs', icon: ScrollText },
    { label: 'Settings', href: '/settings', icon: Settings },
  ]

  return (
    <DashboardSidebar
      links={staffLinks}
      basePath="/staff"
      portalLabel="Staff Portal"
      portalColor="text-red-400"
      userName={userName}
      userRole={userRole}
      userImage={userImage}
    />
  )
}
