'use client'

import { useState, useTransition } from 'react'
import {
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  X,
  Siren,
} from 'lucide-react'
import { dismissStaffNotification } from '@/app/staff/actions'
import { Notification } from '@prisma/client'
import Link from 'next/link'

interface StaffNotificationCardProps {
  notification: Notification
  onDismiss?: (id: string) => void
}

export default function StaffNotificationCard({ notification, onDismiss }: StaffNotificationCardProps) {
  const [isRead, setIsRead] = useState(notification.isRead)
  const [isPending, startTransition] = useTransition()
  const [isDismissing, startDismissTransition] = useTransition()

  const handleMarkAsRead = () => {
    if (isRead || isPending) return
    setIsRead(true)
    // In a real implementation, you'd call a mark-as-read action here
  }

  const handleDismiss = async () => {
    if (isDismissing) return
    startDismissTransition(async () => {
      const result = await dismissStaffNotification(notification.id)
      if (result.success && onDismiss) {
        onDismiss(notification.id)
      }
    })
  }

  const isCritical = notification.type === 'CRITICAL'

  return (
    <div
      className={`group flex items-start gap-4 p-6 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
        !isRead ? 'bg-red-50/30 dark:bg-red-900/5' : ''
      }`}
    >
      <div
        className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          isCritical
            ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-500'
            : notification.type === 'SUCCESS'
              ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-500'
              : notification.type === 'WARNING'
                ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-500'
                : notification.type === 'ERROR'
                  ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-500'
                  : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-500'
        }`}
      >
        {isCritical && <Siren className="h-5 w-5" />}
        {notification.type === 'SUCCESS' && <CheckCircle2 className="h-5 w-5" />}
        {notification.type === 'WARNING' && <AlertTriangle className="h-5 w-5" />}
        {notification.type === 'ERROR' && <AlertCircle className="h-5 w-5" />}
        {notification.type === 'INFO' && <Info className="h-5 w-5" />}
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <h3
              className={`font-bold text-slate-900 dark:text-slate-100 ${
                !isRead ? 'text-red-900 dark:text-red-100' : ''
              }`}
            >
              {notification.title}
            </h3>
            {isCritical && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-red-700 dark:bg-red-900/30 dark:text-red-400">
                Critical
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex items-center gap-1 text-xs font-bold tracking-widest text-slate-400 uppercase">
              <Clock className="h-3 w-3" />
              {new Date(notification.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </div>
            {!isCritical && (
              <button
                type="button"
                onClick={handleDismiss}
                disabled={isDismissing}
                className="rounded-lg p-1 text-slate-300 transition-colors hover:bg-slate-100 hover:text-red-500 disabled:opacity-50 dark:hover:bg-slate-800"
                title="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <p className="text-sm leading-relaxed font-medium text-slate-500 dark:text-slate-400">
          {notification.message}
        </p>

        {notification.linkUrl && (
          <div className="mt-4">
            <Link
              href={notification.linkUrl}
              className="inline-flex items-center gap-2 text-xs font-black text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {notification.linkText || 'View Details'}
              <span className="text-lg">→</span>
            </Link>
          </div>
        )}
      </div>

      {!isRead && !isCritical && (
        <div className="mt-2 h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400" />
      )}
    </div>
  )
}
