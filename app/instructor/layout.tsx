import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { prismaUnfiltered } from '@/lib/prisma/client'
import InstructorSidebar from './_components/InstructorSidebar'
import Heartbeat from '@/components/shared/Heartbeat'
import PortalTopbar from '@/components/layouts/PortalTopbar'
import TourTrigger from '@/components/Tour/TourTrigger'
import AppTour from '@/components/Tour/AppTour'
import { getPendingGradingCount } from '@/lib/actions/instructor'

export const dynamic = 'force-dynamic'

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const user = session.user
  const allowedRoles = ['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN']
  if (!allowedRoles.includes(user.role)) redirect('/login')

  const [dbUser, pendingCount] = await Promise.all([
    prismaUnfiltered.user.findUnique({
      where: { id: user.id },
      select: { status: true, role: true, hasCompletedTour: true },
    }),
    getPendingGradingCount(),
  ])

  if (
    !dbUser ||
    ['SUSPENDED', 'DELETED', 'ARCHIVED'].includes(dbUser.status) ||
    !allowedRoles.includes(dbUser.role)
  ) {
    redirect('/login')
  }

  const userName = user.name || user.email || ''
  const userRole = user.role

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-slate-900 focus:shadow-lg dark:focus:bg-slate-800 dark:focus:text-white">
        Skip to main content
      </a>
      <Heartbeat />
      <AppTour hasCompletedTour={dbUser.hasCompletedTour} userRole={userRole} />
      <InstructorSidebar
        userName={userName}
        userRole={userRole}
        userImage={user.image ?? undefined}
        pendingCount={pendingCount}
      />
      <main
        id="main-content"
        className="relative min-w-0 flex-1 overflow-x-hidden overflow-y-auto pt-16 lg:pt-0"
      >
        <PortalTopbar
          itemsEndpoint="/api/instructor/topbar-items"
          notificationsHref="/instructor/notifications"
          messagesHref="/instructor/messages"
          composeHref="/instructor/messages?compose=true"
          actions={<TourTrigger aria-label="Take a guided tour" title="Take a tour of this portal" />}
        />
        <div className="mx-auto max-w-[1920px] p-4 sm:p-8 lg:px-8 lg:py-6">{children}</div>
      </main>
    </div>
  )
}
