import { getCachedSession } from '@/lib/auth/session-context'
import { redirect } from 'next/navigation'
import { prismaUnfiltered } from '@/lib/prisma/client'
import StaffSidebar from './_components/StaffSidebar'
import StaffTopBar from './_components/StaffTopBar'
import Heartbeat from '@/components/shared/Heartbeat'
import { getWelcomeMessages } from '@/lib/welcome-messages'
import AppTour from '@/components/Tour/AppTour'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import packageJson from '../../package.json'

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
  const [dbUser, welcomeMessages, internalExamEnabled] = await Promise.all([
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
      <AppTour hasCompletedTour={dbUser.hasCompletedTour} userRole={userRole} />
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

      <main id="main-content" className="pt-16 lg:pt-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
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
        <div className="mx-auto max-w-[1920px] p-4 sm:p-8 lg:px-8 lg:py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
