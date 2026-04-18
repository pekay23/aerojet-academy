import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import StaffSidebar from './_components/StaffSidebar'
import StaffTopBar from './_components/StaffTopBar'
import { getWelcomeMessages } from '@/lib/welcome-messages'

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession()

  if (!session) redirect('/login')

  const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'STAFF']
  if (!allowedRoles.includes(session.user.role)) {
    redirect('/login')
  }

  const user = session.user

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      status: true,
      role: true,
      profile: { select: { firstName: true, middleName: true, lastName: true } },
    },
  })

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

  const welcomeMessages = await getWelcomeMessages(prisma, userRole)

  // Counts are now handled client-side in components to improve SSR performance
  const pendingApplicantsCount = 0
  const pendingEnrollmentsCount = 0
  const pendingPaymentsCount = 0
  const unreadMessagesCount = 0
  const unreadNotificationsCount = 0

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <StaffSidebar
        userName={fullName}
        userRole={userRole}
        userImage={user.image ?? undefined}
        counts={{
          applicants: pendingApplicantsCount,
          enrollments: pendingEnrollmentsCount,
          payments: pendingPaymentsCount,
          messages: unreadMessagesCount,
        }}
      />

      <main id="main-content" className="pt-16 lg:pt-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
        <StaffTopBar
          initialCounts={{
            applicants: pendingApplicantsCount,
            payments: pendingPaymentsCount,
            enrollments: pendingEnrollmentsCount,
            messages: unreadMessagesCount,
            notifications: unreadNotificationsCount,
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
