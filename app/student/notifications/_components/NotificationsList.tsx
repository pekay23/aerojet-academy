'use client'

import { useState } from 'react'
import { BellOff } from 'lucide-react'
import TablePagination from '@/app/staff/_components/TablePagination'
import NotificationCard from './NotificationCard'
import { Notification } from '@prisma/client'

export default function NotificationsList({ notifications }: { notifications: Notification[] }) {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

  const total = notifications.length
  const paged = notifications.slice((page - 1) * perPage, page * perPage)

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
            You don&apos;t have any notifications at the moment. We&apos;ll notify you when
            there&apos;s something new.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="divide-y divide-slate-100">
        {paged.map((notification) => (
          <NotificationCard key={notification.id} notification={notification} />
        ))}
      </div>
      <TablePagination page={page} perPage={perPage} total={total} onPageChange={setPage} onPerPageChange={setPerPage} />
    </div>
  )
}
