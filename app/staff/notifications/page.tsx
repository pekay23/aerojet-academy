import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import StaffNotificationsList from './_components/StaffNotificationsList'

export const metadata: Metadata = {
  title: 'Notifications | Staff Portal',
  description: 'View and manage your notifications and critical alerts.',
}
export const dynamic = 'force-dynamic'

export default async function StaffNotificationsPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'STAFF']
  if (!allowedRoles.includes(session.user.role)) {
    redirect('/login')
  }

  const notifications = await prismaUnfiltered.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length
  const criticalCount = notifications.filter((n) => n.type === 'CRITICAL' && !n.isRead).length

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-aerojet-blue uppercase dark:text-white">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Critical alerts require action. Less critical notifications can be dismissed.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {criticalCount > 0 && (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {criticalCount} Critical
            </span>
          )}
          {unreadCount > criticalCount && (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              {unreadCount - criticalCount} New
            </span>
          )}
        </div>
      </div>

      <StaffNotificationsList notifications={notifications} />
    </div>
  )
}
