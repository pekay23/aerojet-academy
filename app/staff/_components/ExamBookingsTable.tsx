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
  Edit,
} from 'lucide-react'
import { bulkUpdateExamBookingStatus, updateExamBooking } from '../actions'
import { toast } from 'sonner'
import Modal from '../../../components/shared/Modal'
import { useSort, SortHeader } from '@/lib/hooks/useSort'

import TablePagination from './TablePagination'
import BulkActionsDropdown from './BulkActionsDropdown'

interface ExamBookingWithDetails {
  id: string
  status: any
  bookingType: string
  amountPaid: any
  bookedAt: Date
  moduleCode: string | null
  user: {
    email: string
    profile: { firstName: string; middleName?: string | null; lastName: string } | null
  }
  event: { name: string; startDate: Date } | null
  exam: {
    name: string
    examDate: Date
    examComponent: { course: { code: string } } | null
  } | null
  score?: any
  maxScore?: any
  percentage?: any
}

interface ExamBookingsTableProps {
  bookings: ExamBookingWithDetails[]
}

export default function ExamBookingsTable({ bookings }: ExamBookingsTableProps) {
  const router = useRouter()
  const {
    items: sortedBookings,
    requestSort,
    sortConfig,
  } = useSort(bookings, { key: 'bookedAt', order: 'desc' })

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [editingBooking, setEditingBooking] = useState<ExamBookingWithDetails | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const total = sortedBookings.length
  const paged = sortedBookings.slice((page - 1) * perPage, page * perPage)

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
                <SortHeader
                  label="Student"
                  sortKey="user.email"
                  currentSort={sortConfig}
                  onSort={requestSort}
                />
                <SortHeader
                  label="Module / Type"
                  sortKey="moduleCode"
                  currentSort={sortConfig}
                  onSort={requestSort}
                />
                <SortHeader
                  label="Event / Date"
                  sortKey="event.startDate"
                  currentSort={sortConfig}
                  onSort={requestSort}
                />
                <th className="px-6 py-4">Payment Status</th>
                <SortHeader
                  label="Amount"
                  sortKey="amountPaid"
                  currentSort={sortConfig}
                  onSort={requestSort}
                />
                <SortHeader
                  label="Booked On"
                  sortKey="bookedAt"
                  currentSort={sortConfig}
                  onSort={requestSort}
                />
                <th className="px-6 py-4"></th>
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
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-bold text-aerojet-blue">
                          {booking.user.profile?.firstName?.charAt(0)}
                          {booking.user.profile?.lastName?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {[
                              booking.user.profile?.firstName,
                              booking.user.profile?.middleName,
                              booking.user.profile?.lastName,
                            ]
                              .filter(Boolean)
                              .join(' ')}
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
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1 font-medium text-slate-700">
                          <CreditCard className="h-3 w-3 text-slate-400" />
                          {Number(booking.amountPaid).toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {format(new Date(booking.bookedAt), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setEditingBooking(booking)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-aerojet-blue"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
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

      {editingBooking && (
        <Modal
          isOpen={!!editingBooking}
          onClose={() => setEditingBooking(null)}
          title="Edit Historical Record"
          size="md"
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              setIsUpdating(true)
              const formData = new FormData(e.currentTarget)
              const score = formData.get('score') ? Number(formData.get('score')) : undefined

              const res = await updateExamBooking(editingBooking.id, {
                moduleCode: formData.get('moduleCode') as string,
                examDate: formData.get('examDate')
                  ? new Date(formData.get('examDate') as string)
                  : undefined,
                score,
              })

              setIsUpdating(false)
              if (res.success) {
                toast.success('Record updated successfully')
                setEditingBooking(null)
                router.refresh()
              } else {
                toast.error(res.error || 'Failed to update record')
              }
            }}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Module Code</label>
                <input
                  name="moduleCode"
                  defaultValue={editingBooking.moduleCode || ''}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-aerojet-blue focus:outline-hidden"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Exam Date</label>
                <input
                  name="examDate"
                  type="date"
                  defaultValue={
                    editingBooking.exam
                      ? format(new Date(editingBooking.exam.examDate), 'yyyy-MM-dd')
                      : ''
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-aerojet-blue focus:outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Exam Score (%)</label>
              <input
                name="score"
                type="number"
                step="0.01"
                min="0"
                max="100"
                defaultValue={editingBooking.score ? Number(editingBooking.score) : ''}
                placeholder="Leave blank if not yet graded"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-aerojet-blue focus:outline-hidden"
              />
              <p className="text-[10px] text-slate-400 italic">
                Scores &ge; 75% will be marked as PASS automatically.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setEditingBooking(null)}
                className="rounded-xl px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="bg-aerojet-blue rounded-xl px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
