import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { BellOff, Mail } from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import NotificationCard from './_components/NotificationCard'

export const metadata: Metadata = { title: 'Notifications | Student Portal' }

export default async function NotificationsPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#002a5c] sm:text-3xl dark:text-white">
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

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {notifications.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => (
              <NotificationCard key={notification.id} notification={notification} />
            ))}
          </div>
        ) : (
          <div className="p-16 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-200 dark:bg-slate-800/50">
              <BellOff className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
              All caught up!
            </h3>
            <p className="mx-auto mt-2 max-w-xs text-sm font-medium text-slate-500 dark:text-slate-400">
              You don&apos;t have any notifications at the moment. We&apos;ll notify you when
              there&apos;s something new.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
        <Mail className="h-3.5 w-3.5" />
        <span>
          Need to contact us?{' '}
          <a href="/student/messages" className="text-blue-600 hover:underline">
            Send a message
          </a>
        </span>
      </div>
    </div>
  )
}
