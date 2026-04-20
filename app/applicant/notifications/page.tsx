import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import NotificationsList from '@/app/student/notifications/_components/NotificationsList'

export const metadata: Metadata = {
  title: 'Notifications | Applicant Portal',
  description: 'View your notifications and alerts.',
}

export default async function ApplicantNotificationsPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-aerojet-blue sm:text-3xl dark:text-white">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Stay updated with academy announcements and alerts.
          </p>
        </div>
        {unreadCount > 0 && (
          <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-black text-white shadow-lg shadow-blue-100">
            {unreadCount} New
          </span>
        )}
      </div>

      <NotificationsList notifications={notifications} />
    </div>
  )
}
