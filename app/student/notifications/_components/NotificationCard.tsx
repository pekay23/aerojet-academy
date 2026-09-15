'use client'

import { useState, useTransition } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Info, AlertTriangle, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { markNotificationAsReadAction } from '@/app/student/actions'
import { Notification } from '@prisma/client'
import Link from 'next/link'
import { appendReturnNavigation } from '@/components/shared/ReturnLink'

interface NotificationCardProps {
  notification: Notification
}

export default function NotificationCard({ notification }: NotificationCardProps) {
  const [isRead, setIsRead] = useState(notification.isRead)
  const [isPending, startTransition] = useTransition()

  const handleMarkAsRead = () => {
    if (isRead || isPending) return

    // Optimistic update
    setIsRead(true)

    startTransition(async () => {
      try {
        await markNotificationAsReadAction(notification.id)
      } catch (error) {
        // Revert on error
        setIsRead(false)
        console.error('Failed to mark notification as read:', error)
      }
    })
  }

  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentHref = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleMarkAsRead}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleMarkAsRead()
        }
      }}
      className={`group flex cursor-pointer items-start gap-4 p-6 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${!isRead ? 'bg-blue-50/20 dark:bg-blue-900/10' : ''}`}
    >
      <div
        className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          notification.type === 'SUCCESS'
            ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-500'
            : notification.type === 'WARNING'
              ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-500'
              : notification.type === 'ERROR'
                ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-500'
                : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-500'
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
            className={`font-bold text-slate-900 dark:text-slate-100 ${!isRead ? 'text-blue-900 dark:text-blue-100' : ''}`}
          >
            {notification.title}
          </h3>
          <div className="flex shrink-0 items-center gap-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
            <Clock className="h-3 w-3" />
            {new Date(notification.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </div>
        </div>
        <p className="text-sm leading-relaxed font-medium text-slate-500 dark:text-slate-400">
          {notification.message}
        </p>

        {notification.linkUrl && (
          <div className="mt-4">
            <Link
              href={appendReturnNavigation(notification.linkUrl, currentHref)}
              className="inline-flex items-center gap-2 text-xs font-black text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {notification.linkText || 'View Details'}
              <span className="text-lg">→</span>
            </Link>
          </div>
        )}
      </div>

      {!isRead && (
        <div className="mt-2 h-2 w-2 rounded-full bg-blue-600 shadow-sm dark:bg-blue-500" />
      )}
    </div>
  )
}
