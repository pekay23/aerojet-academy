import { getCachedSession } from '@/lib/auth/session-context'
import { redirect } from 'next/navigation'
import { prismaUnfiltered } from '@/lib/prisma/client'
import StaffSidebar from './_components/StaffSidebar'
import StaffTopBar from './_components/StaffTopBar'
import Heartbeat from '@/components/shared/Heartbeat'
import { getWelcomeMessages } from '@/lib/welcome-messages'
import AppTour from '@/components/Tour/AppTour'
import { getDashboardAlerts } from '@/lib/analytics/dashboard-alerts'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import packageJson from '../../package.json'
import { getRegistrationConfig } from '@/lib/settings'

export const dynamic = 'force-dynamic'

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = await getCachedSession()

  if (!session) redirect('/login')

  const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'STAFF']
  if (!allowedRoles.includes(session.user.role)) {
    redirect('/login')
  }

  const user = session.user

  // Run both queries in parallel; use prismaUnfiltered to bypass RLS transaction overhead
  const [dbUser, welcomeMessages, internalExamEnabled, registrationConfig] = await Promise.all([
    prismaUnfiltered.user.findUnique({
      where: { id: user.id },
      select: {
        status: true,
        role: true,
        hasCompletedTour: true,
        profile: { select: { firstName: true, middleName: true, lastName: true } },
      },
    }),
    getWelcomeMessages(prismaUnfiltered, user.role),
    isInternalExamSystemEnabled(),
    getRegistrationConfig(),
  ])

  if (
    !dbUser ||
    ['SUSPENDED', 'DELETED', 'ARCHIVED'].includes(dbUser.status) ||
    !allowedRoles.includes(dbUser.role)
  ) {
    redirect('/login')
  }

  const fullName = dbUser?.profile
    ? [dbUser.profile.firstName, dbUser.profile.middleName, dbUser.profile.lastName]
        .filter(Boolean)
        .join(' ')
    : (user.name ?? user.email ?? '')
  const firstName = dbUser?.profile?.firstName ?? user.name?.split(' ')[0] ?? 'Admin'
  const userRole = user.role

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <Heartbeat />
      <AppTour
        hasCompletedTour={dbUser.hasCompletedTour}
        userRole={userRole}
        data={{ staffAlerts, unreadNotifications }}
      />
      <StaffSidebar
        userName={fullName}
        userRole={userRole}
        userImage={user.image ?? undefined}
        counts={{
          applicants: 0,
          enrollments: 0,
          payments: 0,
          messages: 0,
        }}
        internalExamEnabled={internalExamEnabled}
        appVersion={packageJson.version}
      />

      <main
        id="main-content"
        className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto pt-16 lg:pt-0"
      >
        <StaffTopBar
          initialCounts={{
            applicants: 0,
            payments: 0,
            enrollments: 0,
            messages: 0,
            notifications: 0,
          }}
          welcomeMessages={welcomeMessages}
          userName={firstName}
        />
        {!registrationConfig.isOpen && (
          <div className="flex flex-col justify-between gap-2 border-b border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:px-6 lg:px-8">
            <div className="flex items-start gap-3 sm:items-center">
              <div className="mt-0.5 shrink-0 sm:mt-0">
                <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-amber-800">
                <strong className="font-bold">Notice:</strong> Training programs and new
                registrations are currently paused on the public site.
              </p>
            </div>
            <a
              href="/staff/settings?tab=general"
              className="text-sm font-bold whitespace-nowrap text-amber-800 underline hover:text-amber-900"
            >
              Manage Settings
            </a>
          </div>
        )}
        <div className="mx-auto max-w-480 p-4 sm:p-8 lg:px-8 lg:py-6">{children}</div>
      </main>
    </div>
  )
}
