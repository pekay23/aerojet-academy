'use client'

import { useState, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import DashboardSidebar, { type SidebarLink } from '@/components/layouts/DashboardSidebar'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  CreditCard,
  BookOpen,
  Calendar,
  BarChart3,
  Mail,
  Settings,
  GitPullRequestArrow,
  GraduationCap,
  ShieldCheck,
  Users2,
} from 'lucide-react'
import { useBadgeCounts } from '@/hooks/useBadgeCounts'

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
  internalExamEnabled?: boolean
  appVersion?: string
}

export default function StaffSidebar({
  userName,
  userRole,
  userImage,
  counts: initialCounts,
  internalExamEnabled = false,
  appVersion,
}: StaffSidebarProps) {
  const pathname = usePathname()
  const [overrideMenu, setOverrideMenu] = useState<boolean>(false)

  const searchParams = useSearchParams()

  const isSettingsRoute = pathname.startsWith('/staff/settings')
  const showSettingsMenu = isSettingsRoute && !overrideMenu

  useEffect(() => {
    // Reset override anytime the user navigates
   
   
  // eslint-disable-next-line react-hooks/set-state-in-effect
    setOverrideMenu(false)
  }, [pathname, searchParams])

  const { counts } = useBadgeCounts({
    applicants: initialCounts?.applicants ?? 0,
    enrollments: initialCounts?.enrollments ?? 0,
    payments: initialCounts?.payments ?? 0,
    messages: initialCounts?.messages ?? 0,
  })

  const staffLinks: SidebarLink[] = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, tourId: 'nav-dashboard' },
    {
      label: 'People',
      href: '/users',
      icon: Users,
      badge: (counts.applicants ?? 0) > 0 ? counts.applicants : undefined,
      tourId: 'group-people',
      children: [
        { label: 'All Users', href: '/users' },
        { label: 'Applicants Queue', href: '/users?tab=applicants' },
        { label: 'Student Directory', href: '/users?tab=students' },
        { label: 'Instructors', href: '/users?tab=instructors' },
        { label: 'Examiners', href: '/users?tab=examiners' },
        { label: 'Bulk Import (CSV)', href: '/students/import' },
        { label: 'Withdrawals', href: '/withdrawals' },
        { label: 'Document Vault', href: '/documents' },
        { label: 'Expiring Documents', href: '/documents/expiring' },
        { label: 'Audit Logs', href: '/audit-logs' },
      ],
    },
    {
      label: 'Admissions',
      href: '/admissions',
      icon: GitPullRequestArrow,
      children: [
        { label: 'Pipeline Overview', href: '/admissions' },
        { label: 'Intake Cycles', href: '/admissions/intake-cycles' },
        { label: 'Document Types', href: '/admissions/document-types' },
        { label: 'Aptitude Tests', href: '/admissions/aptitude' },
        { label: 'Shortlisting', href: '/admissions/shortlisting' },
        { label: 'Interviews', href: '/admissions/interviews' },
        { label: 'Medical Review', href: '/admissions/medical' },
        { label: 'Bonding Contracts', href: '/admissions/bonding' },
        { label: 'Data Import', href: '/admissions/import' },
      ],
    },
    {
      label: 'Academic',
      href: '/courses',
      icon: BookOpen,
      children: [
        { label: 'Course Catalog', href: '/courses' },
        { label: 'Programmes', href: '/programmes' },
        { label: 'License Requirements', href: '/license-requirements' },
        { label: 'Learning Resources', href: '/resources' },
        { label: 'Academic Scheduling', href: '/academic/scheduling' },
      ],
    },
    {
      label: 'Operations',
      href: '/enrollments',
      icon: ClipboardList,
      badge: (counts.enrollments ?? 0) > 0 ? counts.enrollments : undefined,
      tourId: 'group-operations',
      children: [
        { label: 'Course Enrollments', href: '/enrollments' },
        { label: 'Exam Management', href: '/exams' },
        { label: 'Pool Members', href: '/exams/pools/members' },
        ...(internalExamEnabled ? [{ label: 'Internal Exams', href: '/exams/internal' }] : []),
        { label: 'Batch Processing', href: '/enrollments/batch' },
        { label: 'Year/Semester Advancement', href: '/enrollments/advancement' },
        { label: 'Attendance', href: '/attendance' },
      ],
    },
    {
      label: 'Training',
      href: '/instructors',
      icon: GraduationCap,
      children: [
        { label: 'Instructors', href: '/instructors' },
        { label: 'Practical Training', href: '/practical-assessments' },
        { label: 'OJT Logbooks', href: '/ojt' },
        { label: 'Part-145 Transition', href: '/part-145' },
        { label: 'ATA Chapters', href: '/ata-chapters' },
      ],
    },
    {
      label: 'Scheduling',
      href: '/scheduling',
      icon: Calendar,
      children: [
        { label: 'Academic Term Sync', href: '/scheduling' },
        { label: 'Standard Classes', href: '/classes' },
        { label: 'Classrooms', href: '/classrooms' },
        { label: 'Revision Support', href: '/revision-runs' },
        { label: 'Master Calendar', href: '/calendar' },
        { label: 'Conflict Matrix', href: '/timetable/conflicts' },
      ],
    },
    {
      label: 'Financials',
      href: '/payments',
      icon: CreditCard,
      badge: (counts.payments ?? 0) > 0 ? counts.payments : undefined,
      tourId: 'group-financials',
      children: [
        { label: 'Recent Payments', href: '/payments' },
        { label: 'Financial Reports', href: '/finance' },
        { label: 'Refunds', href: '/finance/refunds' },
      ],
    },
    {
      label: 'Engagement',
      href: '/messages',
      icon: Mail,
      badge: (counts.messages ?? 0) > 0 ? counts.messages : undefined,
      children: [
        { label: 'Inbox', href: '/messages' },
        { label: 'Newsroom', href: '/newsroom' },
      ],
    },
    { label: 'System Reports', href: '/reports', icon: BarChart3 },
    {
      label: 'Referrals',
      href: '/referrals',
      icon: Users2,
      children: [
        { label: 'Review queue', href: '/referrals' },
        { label: 'Payouts', href: '/referrals/payouts' },
      ],
    },
    {
      label: 'Governance',
      href: '/gdpr',
      icon: ShieldCheck,
      children: [
        { label: 'GDPR requests', href: '/gdpr' },
        { label: 'Retention policies', href: '/settings/retention' },
        { label: 'Permissions (RBAC)', href: '/admin/permissions' },
      ],
      tourId: 'group-governance',
    },
  ]

  const settingsLinks: SidebarLink[] = [
    { label: 'General', href: '/settings?tab=general' },
    { label: 'Admissions', href: '/settings?tab=admissions' },
    { label: 'Finance', href: '/settings?tab=finance' },
    { label: 'Emails & Comms', href: '/settings?tab=comms' },
    { label: 'Academic', href: '/settings?tab=academic' },
    { label: 'Templates', href: '/settings?tab=templates' },
    { label: 'System & Data', href: '/settings?tab=system' },
    { label: 'My Security', href: '/settings?tab=security' },
  ]

  return (
    <DashboardSidebar
      links={showSettingsMenu ? settingsLinks : staffLinks}
      basePath="/staff"
      portalLabel={showSettingsMenu ? 'Settings' : 'Staff Portal'}
      portalColor="text-red-400"
      onBack={showSettingsMenu ? () => setOverrideMenu(true) : undefined}
      backLabel={showSettingsMenu ? 'Settings' : undefined}
      userName={userName}
      userRole={userRole}
      userImage={userImage}
      userMenuItems={[{ label: 'Settings', href: '/settings', icon: Settings }]}
      appVersion={appVersion}
    />
  )
}
