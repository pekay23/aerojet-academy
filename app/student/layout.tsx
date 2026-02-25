import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import StudentSidebar from './_components/StudentSidebar'
import BreadcrumbNav from '@/components/layouts/BreadcrumbNav'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const user = session.user

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { status: true, role: true },
  })

  if (
    !dbUser ||
    ['SUSPENDED', 'DELETED', 'ARCHIVED'].includes(dbUser.status) ||
    dbUser.role !== 'STUDENT'
  ) {
    redirect('/login')
  }

  const userName = user.name || user.email
  const userRole = user.role

  const [unreadNotifications, unreadMessages] = await Promise.all([
    prisma.notification.count({
      where: { userId: user.id, isRead: false },
    }),
    prisma.message.count({
      where: { recipientId: user.id, isRead: false },
    }),
  ])

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <StudentSidebar
        userName={userName}
        userRole={userRole}
        userImage={user.image || undefined}
        notificationCount={unreadNotifications}
        messageCount={unreadMessages}
      />
      <main className="min-h-screen flex-1">
        <div className="p-6 sm:p-8 lg:p-10">
          <BreadcrumbNav />
          {children}
        </div>
      </main>
    </div>
  )
}
