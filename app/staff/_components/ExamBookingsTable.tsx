'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  CheckSquare,
  Square,
  CheckCircle2,
  XCircle,
  Trash2,
  Calendar,
  CreditCard,
} from 'lucide-react'
import { bulkUpdateExamBookingStatus } from '../actions'
import { toast } from 'sonner'

import TablePagination from './TablePagination'
import BulkActionsDropdown from './BulkActionsDropdown'

interface ExamBookingWithDetails {
  id: string
  status: any
  bookingType: string
  amountPaid: any
  bookedAt: Date
  moduleCode: string
  user: {
    email: string
    profile: { firstName: string; lastName: string } | null
  }
  event: { name: string; startDate: Date } | null
  exam: {
    name: string
    examDate: Date
    examComponent: { course: { code: string } } | null
  } | null
}

interface ExamBookingsTableProps {
  bookings: ExamBookingWithDetails[]
}

export default function ExamBookingsTable({ bookings }: ExamBookingsTableProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

  const total = bookings.length
  const paged = bookings.slice((page - 1) * perPage, page * perPage)

  const toggleAll = () => {
    if (selectedIds.length === paged.length && paged.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(paged.map((b) => b.id))
    }
  }

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  return (
    <div className="relative">
      <div className="mb-3 flex items-center justify-end">
        <BulkActionsDropdown
          selectedIds={selectedIds}
          onClear={() => setSelectedIds([])}
          actions={[
            {
              label: 'Approve',
              icon: CheckCircle2,
              variant: 'success',
              confirmTitle: 'Approve Bookings',
              confirmMessage: `Are you sure you want to approve ${selectedIds.length} selected bookings?`,
              onClick: async (ids) => {
                const res = await bulkUpdateExamBookingStatus(ids, 'APPROVED')
                if (res.success) {
                  toast.success(`Approved ${ids.length} bookings`)
                  router.refresh()
                } else toast.error(res.error)
              },
            },
            {
              label: 'Fail/Reject',
              icon: XCircle,
              variant: 'danger',
              confirmTitle: 'Reject Bookings',
              confirmMessage: `Are you sure you want to reject ${selectedIds.length} selected bookings?`,
              onClick: async (ids) => {
                const res = await bulkUpdateExamBookingStatus(ids, 'REJECTED')
                if (res.success) {
                  toast.success(`Rejected ${ids.length} bookings`)
                  router.refresh()
                } else toast.error(res.error)
              },
            },
          ]}
        />
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="w-12 px-6 py-4">
                  <button
                    onClick={toggleAll}
                    className="hover:text-aerojet-blue text-slate-400 transition-colors"
                  >
                    {selectedIds.length === paged.length && paged.length > 0 ? (
                      <CheckSquare className="text-aerojet-blue h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Module / Type</th>
                <th className="px-6 py-4">Event / Date</th>
                <th className="px-6 py-4">Payment Status</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Booked On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No bookings found.
                  </td>
                </tr>
              ) : (
                paged.map((booking) => (
                  <tr
                    key={booking.id}
                    className={`group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                      selectedIds.includes(booking.id) ? 'bg-aerojet-blue/5' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleOne(booking.id)}
                        className="hover:text-aerojet-blue text-slate-300 transition-colors"
                      >
                        {selectedIds.includes(booking.id) ? (
                          <CheckSquare className="text-aerojet-blue h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-bold text-[#002a5c]">
                          {booking.user.profile?.firstName?.charAt(0)}
                          {booking.user.profile?.lastName?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {booking.user.profile?.firstName} {booking.user.profile?.lastName}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {booking.user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {booking.moduleCode}
                        </span>
                        <span className="text-xs text-slate-500 capitalize dark:text-slate-400">
                          {booking.bookingType.replace(/_/g, ' ').toLowerCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {booking.event ? (
                        <div>
                          <div className="font-medium text-slate-700">{booking.event.name}</div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(booking.event.startDate), 'MMM d, yyyy')}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not scheduled</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                          booking.status === 'APPROVED' || booking.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700'
                            : booking.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 font-medium text-slate-700">
                        <CreditCard className="h-3 w-3 text-slate-400" />
                        {Number(booking.amountPaid).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {format(new Date(booking.bookedAt), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={page}
          perPage={perPage}
          total={total}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
        />
      </div>
    </div>
  )
}
