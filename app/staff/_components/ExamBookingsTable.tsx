'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  CheckSquare,
  Square,
  CheckCircle2,
  XCircle,
  _Trash2,
  Calendar,
  _CreditCard,
  Edit,
  Clock,
  Trophy,
} from 'lucide-react'
import { bulkUpdateExamBookingStatus, updateExamBooking } from '../actions'
import { toast } from 'sonner'
import { PaymentStatus } from '@/types/enums'
import Modal from '../../../components/shared/Modal'
import { useSort, SortHeader } from '@/lib/hooks/useSort'

import TablePagination from './TablePagination'
import BulkActionsDropdown from './BulkActionsDropdown'
import SearchInput from '@/components/SearchInput'


interface ExamBookingWithDetails {
  id: string
  status: any
  bookingType: string
  amountPaid: any
  bookedAt: string | Date
  examDate?: string | Date | null
  moduleCode: string | null
  user: {
    email: string
    profile: { firstName: string; middleName?: string | null; lastName: string } | null
    registrationFee?: number | string | any
  }
  event: { name: string; startDate: string | Date } | null
  exam: {
    name: string
    examDate: string | Date
    examComponent: { course: { code: string } } | null
  } | null
  poolMemberships?: Array<{
    status: string
    pool: {
      name: string
      examDate: string | Date
    }
  }>
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
    <div className="relative space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full max-w-sm">
          <SearchInput id="exams-bookings-search" placeholder="Search students, modules, or events..." />
        </div>
        
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-aerojet-blue/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-aerojet-blue animate-in fade-in slide-in-from-right-2">
              <CheckSquare className="h-3.5 w-3.5" />
              {selectedIds.length} Selected
            </div>
          )}
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
                  const res = await bulkUpdateExamBookingStatus(ids, PaymentStatus.APPROVED)
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
                  const res = await bulkUpdateExamBookingStatus(ids, PaymentStatus.REJECTED)
                  if (res.success) {
                    toast.success(`Rejected ${ids.length} bookings`)
                    router.refresh()
                  } else toast.error(res.error)
                },
              },
            ]}
          />
        </div>
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
                <th className="px-6 py-4">Status</th>
                <SortHeader
                  label="Amount"
                  sortKey="amountPaid"
                  currentSort={sortConfig}
                  onSort={requestSort}
                />
                <SortHeader
                  label="Dates"
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
                paged.map((booking) => {
                  const membership = booking.poolMemberships?.find(m => m.status !== 'CANCELLED') || booking.poolMemberships?.[0]
                  const poolDate = membership?.pool?.examDate
                  const poolName = membership?.pool?.name
                  const examDate = booking.exam?.examDate || poolDate || booking.examDate
                  
                  // Determine status - show pool status if available and relevant
                  const isPooled = !!membership
                  const displayStatus = (isPooled && membership?.status !== 'RESERVED') ? membership?.status : booking.status
                  const statusColorClass = 
                    displayStatus === 'APPROVED' || displayStatus === 'COMPLETED' || displayStatus === 'CONFIRMED'
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      : displayStatus === 'PENDING' || displayStatus === 'RESERVED'
                        ? 'bg-amber-50 text-amber-600 border border-amber-100'
                        : 'bg-red-50 text-red-600 border border-red-100'

                  return (
                    <tr
                      key={booking.id}
                      className={`group transition-all duration-150 ease-out hover:bg-white/80 hover:shadow-[0_1px_4px_rgba(0,0,0,0.06)] dark:hover:bg-slate-800/60 ${
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
                            {isPooled ? 'Pooled' : booking.bookingType.replace(/_/g, ' ').toLowerCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isPooled ? (
                          <div>
                            <div className="font-medium text-slate-700">{poolName}</div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(poolDate!), 'MMM d, yyyy')}
                            </div>
                          </div>
                        ) : booking.event ? (
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
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${statusColorClass}`}
                        >
                          {displayStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-700 dark:text-slate-300">
                          €{Number(booking.amountPaid).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                             <Calendar className="h-3 w-3 text-aerojet-blue" />
                             <span className="text-[10px] text-slate-400 uppercase mr-1">Exam:</span>
                             {examDate ? format(new Date(examDate), 'MMM d, yyyy') : '—'}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                            <Clock className="h-2.5 w-2.5" />
                            <span className="text-slate-400 uppercase">Booked:</span>
                            {format(new Date(booking.bookedAt), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setEditingBooking(booking)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-aerojet-blue"
                          title="Edit booking details"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
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
          title="Edit Booking Entry"
          size="md"
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              setIsUpdating(true)
              const formData = new FormData(e.currentTarget)
              const scoreInput = formData.get('score')
              const score = scoreInput && scoreInput !== '' ? Number(scoreInput) : undefined

              const res = await updateExamBooking(editingBooking.id, {
                moduleCode: formData.get('moduleCode') as string,
                examDate: formData.get('examDate')
                  ? new Date(formData.get('examDate') as string)
                  : undefined,
                score,
              })

              setIsUpdating(false)
              if (res.success) {
                toast.success('Record updated')
                setEditingBooking(null)
                router.refresh()
              } else {
                toast.error(res.error || 'Failed to update')
              }
            }}
            className="space-y-6 p-1"
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label 
                  htmlFor="modal-module-code" 
                  className="text-[10px] font-black uppercase tracking-widest text-slate-500"
                >
                  Module Code
                </label>
                <input
                  id="modal-module-code"
                  name="moduleCode"
                  defaultValue={editingBooking.moduleCode || ''}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold uppercase transition focus:border-aerojet-blue focus:ring-4 focus:ring-aerojet-blue/5 outline-hidden"
                  autoComplete="off"
                  required
                />
              </div>
              <div className="space-y-2">
                <label 
                  htmlFor="modal-exam-date" 
                  className="text-[10px] font-black uppercase tracking-widest text-slate-500"
                >
                  Exam Date (Session)
                </label>
                  <input
                    id="modal-exam-date"
                    name="examDate"
                    type="date"
                    autoComplete="off"
                    defaultValue={
                      editingBooking.exam?.examDate
                        ? format(new Date(editingBooking.exam.examDate), 'yyyy-MM-dd')
                        : ''
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:border-aerojet-blue focus:ring-4 focus:ring-aerojet-blue/5 outline-hidden"
                  />
              </div>
            </div>

            <div className="space-y-2">
              <label 
                htmlFor="modal-score" 
                className="text-[10px] font-black uppercase tracking-widest text-slate-500"
              >
                Grade / Score (%)
              </label>
              <div className="relative">
                <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <input
                  id="modal-score"
                  name="score"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  defaultValue={editingBooking.score ? Number(editingBooking.score) : ''}
                  placeholder="Enter percentage score..."
                  className="w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 py-2.5 text-sm font-bold transition focus:border-aerojet-blue focus:ring-4 focus:ring-aerojet-blue/5 outline-hidden"
                  autoComplete="off"
                />
              </div>
              <p className="text-[10px] leading-relaxed text-slate-400 italic">
                Updating the score will automatically recalculate the PASSED/FAILED result based on the 75% threshold.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingBooking(null)}
                className="rounded-xl px-6 py-2.5 text-sm font-black text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="bg-aerojet-blue min-w-[140px] rounded-xl px-6 py-2.5 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-aerojet-blue/20 transition hover:bg-aerojet-blue/90 disabled:opacity-50"
              >
                {isUpdating ? 'Saving...' : 'Update Entry'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
