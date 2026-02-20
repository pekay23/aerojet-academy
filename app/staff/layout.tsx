import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import StaffSidebar from './_components/StaffSidebar'

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession()

  if (!session) redirect('/login')

  const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'STAFF']
  if (!allowedRoles.includes(session.user.role)) {
    redirect('/login')
  }

  const user = session.user
  const userName = user.name ?? user.email
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

      {/* Main content — now flexes normally beside the sticky sidebar */}
      <div className="flex min-h-screen flex-1 flex-col">
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
