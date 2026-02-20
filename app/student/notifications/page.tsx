import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import {
  Bell,
  BellOff,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Mail,
} from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'

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
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
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

      <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {notifications.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`group flex items-start gap-4 p-6 transition-colors hover:bg-slate-50 dark:bg-slate-800/50 ${!notification.isRead ? 'bg-blue-50/20' : ''}`}
              >
                <div
                  className={`mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                    notification.type === 'SUCCESS'
                      ? 'bg-green-50 text-green-600'
                      : notification.type === 'WARNING'
                        ? 'bg-amber-50 text-amber-600'
                        : notification.type === 'ERROR'
                          ? 'bg-red-50 text-red-600'
                          : 'bg-blue-50 text-blue-600'
                  }`}
                >
                  {notification.type === 'SUCCESS' && <CheckCircle2 className="h-5 w-5" />}
                  {notification.type === 'WARNING' && <AlertTriangle className="h-5 w-5" />}
                  {notification.type === 'ERROR' && <AlertCircle className="h-5 w-5" />}
                  {notification.type === 'INFO' && <Info className="h-5 w-5" />}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-4">
                    <h3
                      className={`font-bold text-slate-900 dark:text-slate-100 ${!notification.isRead ? 'text-blue-900' : ''}`}
                    >
                      {notification.title}
                    </h3>
                    <div className="flex flex-shrink-0 items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      <Clock className="h-3 w-3" />
                      {new Date(notification.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                    {notification.message}
                  </p>

                  {notification.linkUrl && (
                    <div className="mt-4">
                      <a
                        href={notification.linkUrl}
                        className="inline-flex items-center gap-2 text-xs font-black text-blue-600 transition-colors hover:text-blue-700"
                      >
                        {notification.linkText || 'View Details'}
                        <span className="text-lg">→</span>
                      </a>
                    </div>
                  )}
                </div>

                {!notification.isRead && (
                  <div className="mt-2 h-2 w-2 rounded-full bg-blue-600 shadow-sm" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-16 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50 text-slate-200">
              <BellOff className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">All caught up!</h3>
            <p className="mx-auto mt-2 max-w-xs text-sm font-medium text-slate-500 dark:text-slate-400">
              You don&apos;t have any notifications at the moment. We&apos;ll notify you when
              there&apos;s something new.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
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

