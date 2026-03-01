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
  Calendar,
  Shield,
  Briefcase,
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
    {
      label: 'People',
      href: '/users',
      icon: Users,
      badge: counts?.applicants || undefined,
      children: [
        { label: 'All Users', href: '/users' },
        { label: 'Applicants', href: '/users?tab=applicants' },
        { label: 'Students', href: '/users?tab=students' },
        { label: 'Instructors', href: '/users?tab=instructors' },
        { label: 'Import (CSV)', href: '/students/import' },
      ],
    },
    {
      label: 'Enrollments',
      href: '/enrollments',
      icon: ClipboardList,
      badge: counts?.enrollments || undefined,
      children: [
        { label: 'All Enrollments', href: '/enrollments' },
        { label: 'Batch Activate', href: '/enrollments/batch' },
      ],
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
    },
    { label: 'Courses', href: '/courses', icon: BookOpen },
    { label: 'Programmes', href: '/programmes', icon: Briefcase },
    { label: 'License Requirements', href: '/license-requirements', icon: Shield },
    { label: 'Classes', href: '/classes', icon: School },
    { label: 'Scheduling', href: '/scheduling', icon: Calendar },
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
    { label: 'Email Previews', href: '/settings/email-previews', icon: Mail },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
      children: [
        { label: 'General', href: '/settings' },
        { label: 'Academic Calendar', href: '/settings/academic-calendar' },
      ],
    },
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
