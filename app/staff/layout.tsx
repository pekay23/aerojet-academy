import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import StaffSidebar from './_components/StaffSidebar'
import BreadcrumbNav from '@/components/layouts/BreadcrumbNav'
import PortalHeader from '@/components/layouts/PortalHeader'

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

  const userName = dbUser?.profile
    ? [dbUser.profile.firstName, dbUser.profile.middleName, dbUser.profile.lastName]
        .filter(Boolean)
        .join(' ')
    : (user.name ?? user.email)
  const userRole = user.role

  const [
    pendingApplicantsCount,
    pendingEnrollmentsCount,
    pendingPaymentsCount,
    unreadMessagesCount,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'APPLICANT', status: 'PENDING' } }),
    prisma.enrollment.count({ where: { status: 'PENDING' } }),
    prisma.payment.count({ where: { status: 'PENDING' } }),
    prisma.message.count({ where: { recipientId: user.id, isRead: false } }),
  ])

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <StaffSidebar
        userName={userName}
        userRole={userRole}
        userImage={user.image || undefined}
        counts={{
          applicants: pendingApplicantsCount,
          enrollments: pendingEnrollmentsCount,
          payments: pendingPaymentsCount,
          messages: unreadMessagesCount,
        }}
      />

      <main id="main-content" className="min-h-screen min-w-0 flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-7xl p-4 pt-16 sm:p-8 lg:p-10 lg:pt-10">
          <PortalHeader>
            <BreadcrumbNav />
          </PortalHeader>
          {children}
        </div>
      </main>
    </div>
  )
}
