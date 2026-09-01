import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Mail } from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import NotificationsList from './_components/NotificationsList'

export const metadata: Metadata = {
  title: 'Notifications | Student Portal',
  description: 'View your notifications and alerts.',
}

export default async function NotificationsPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-blue-800 dark:text-white">
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

