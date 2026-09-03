'use client'

import { format } from 'date-fns'
import { Calendar, Clock, CreditCard, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useSort, SortHeader } from '@/lib/hooks/useSort'
import { payPendingExamBooking } from '@/app/student/actions'
import { PaymentStatus } from '@/types/enums'

interface BookingRecord {
  id: string
  moduleCode: string
  moduleName: string
  date: Date
  status: string
  amountPaid: number
  bookingType: string
  bookingGroupRef?: string | null
}

interface StudentBookingsTableProps {
  bookings: BookingRecord[]
}

export default function StudentBookingsTable({ bookings }: StudentBookingsTableProps) {
  const { items, requestSort, sortConfig } = useSort(bookings, { key: 'date', order: 'asc' })
  const router = useRouter()
  const [isPaying, setIsPaying] = useState<string | null>(null)

  const handlePay = async (bookingId: string) => {
    setIsPaying(bookingId)
    const res = await payPendingExamBooking(bookingId)
    setIsPaying(null)

    if (res.success) {
      toast.success('Payment successful!')
      router.refresh()
    } else {
      toast.error(res.error || 'Payment failed')
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200/60 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-slate-900 dark:shadow-none">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm" aria-label="Exam bookings">
          <thead className="bg-stone-50/50 dark:bg-slate-800/50">
            <tr className="border-b border-stone-100 text-xs font-bold tracking-widest text-slate-400 uppercase dark:border-white/5">
              <SortHeader
                label="Module"
                sortKey="moduleCode"
                currentSort={sortConfig}
                onSort={requestSort}
              />
              <SortHeader
                label="Exam Date"
                sortKey="date"
                currentSort={sortConfig}
                onSort={requestSort}
              />
              <th scope="col" className="px-6 py-4">
                Status
              </th>
              <SortHeader
                label="Fee"
                sortKey="amountPaid"
                currentSort={sortConfig}
                onSort={requestSort}
                align="right"
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-white/5">
            {items.map((booking) => (
              <tr
                key={booking.id}
                className="transition-colors hover:bg-stone-50 dark:hover:bg-slate-800/50"
              >
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-900 uppercase dark:text-white">
                    {booking.moduleCode}
                  </p>
                  <p
                    className="max-w-[150px] truncate text-xs font-medium text-slate-500"
                    title={booking.moduleName}
                  >
                    {booking.moduleName}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    {format(booking.date, 'MMM d, yyyy')}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-bold uppercase ${
                      booking.status === PaymentStatus.APPROVED ||
                      booking.status === PaymentStatus.COMPLETED
                        ? 'bg-emerald-50 text-emerald-700'
                        : booking.status === PaymentStatus.CANCELLED ||
                            booking.status === PaymentStatus.REJECTED
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {booking.status === PaymentStatus.APPROVED ||
                    booking.status === PaymentStatus.COMPLETED ? (
                      <CreditCard className="h-3 w-3" aria-hidden="true" />
                    ) : (
                      <Clock className="h-3 w-3" aria-hidden="true" />
                    )}
                    {booking.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex flex-col items-end gap-1">
                    <p className="font-bold text-slate-900 dark:text-white">
                      {booking.amountPaid > 0 ? (
                        <>€{booking.amountPaid.toFixed(2)}</>
                      ) : booking.bookingGroupRef ? (
                        <span className="text-xs text-slate-400 uppercase italic">Bundle Seat</span>
                      ) : (
                        <>€0.00</>
                      )}
                    </p>
                    {booking.status === PaymentStatus.PENDING && (
                      <button
                        onClick={() => handlePay(booking.id)}
                        disabled={isPaying === booking.id}
                        className="bg-primary hover:bg-primary/90 rounded-lg px-3 py-1 text-xs font-bold text-white transition-all disabled:opacity-50"
                      >
                        {isPaying === booking.id
                          ? 'Processing...'
                          : booking.amountPaid > 0
                            ? 'Pay Bundle'
                            : 'Validate'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
