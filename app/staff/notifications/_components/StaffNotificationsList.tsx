'use client'

import { useState } from 'react'
import { BellOff, X, Trash2 } from 'lucide-react'
import TablePagination from '@/components/shared/TablePagination'
import StaffNotificationCard from './StaffNotificationCard'
import { Notification } from '@prisma/client'

interface StaffNotificationsListProps {
  notifications: Notification[]
}

export default function StaffNotificationsList({ notifications }: StaffNotificationsListProps) {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [list, setList] = useState<Notification[]>(notifications)

  const total = list.length
  const paged = list.slice((page - 1) * perPage, page * perPage)

  const handleDismiss = (id: string) => {
    setList((prev) => prev.filter((n) => n.id !== id))
    if (paged.length === 1 && page > 1) {
      setPage((p) => p - 1)
    }
  }

  const handleDismissAll = () => {
    setList((prev) => prev.filter((n) => n.type === 'CRITICAL'))
    setPage(1)
  }

  if (total === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="p-16 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-200 dark:bg-slate-800/50">
            <BellOff className="h-10 w-10" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
            All caught up!
          </h3>
          <p className="mx-auto mt-2 max-w-xs text-sm font-medium text-slate-500 dark:text-slate-400">
            You don&apos;t have any notifications at the moment.
          </p>
        </div>
      </div>
    )
  }

  const nonCriticalCount = list.filter((n) => n.type !== 'CRITICAL').length

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {nonCriticalCount > 0 && (
        <div className="flex items-center justify-end border-b border-slate-100 px-4 py-2 dark:border-slate-800">
          <button
            type="button"
            onClick={handleDismissAll}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 transition-colors hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Dismiss all non-critical
          </button>
        </div>
      )}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {paged.map((notification) => (
          <StaffNotificationCard
            key={notification.id}
            notification={notification}
            onDismiss={handleDismiss}
          />
        ))}
      </div>
      <TablePagination page={page} perPage={perPage} total={total} onPageChange={setPage} onPerPageChange={setPerPage} />
    </div>
  )
}
