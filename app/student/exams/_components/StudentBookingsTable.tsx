'use client'

import { format } from 'date-fns'
import { Calendar, Clock, CreditCard, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useSort, SortHeader } from '@/lib/hooks/useSort'

interface BookingRecord {
  id: string
  moduleCode: string
  moduleName: string
  date: Date
  status: string
  amountPaid: number
  bookingType: string
}

interface StudentBookingsTableProps {
  bookings: BookingRecord[]
}

export default function StudentBookingsTable({ bookings }: StudentBookingsTableProps) {
  const { items, requestSort, sortConfig } = useSort(bookings, { key: 'date', order: 'asc' })

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm" aria-label="Exam bookings">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr className="border-b border-slate-100 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:border-slate-800">
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
              <th scope="col" className="px-6 py-4">Status</th>
              <SortHeader
                label="Fee"
                sortKey="amountPaid"
                currentSort={sortConfig}
                onSort={requestSort}
                align="right"
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {items.map((booking) => (
              <tr
                key={booking.id}
                className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
              >
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-900 uppercase dark:text-white">
                    {booking.moduleCode}
                  </p>
                  <p className="max-w-[150px] truncate text-[10px] font-medium text-slate-500" title={booking.moduleName}>
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
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                      booking.status === 'APPROVED' || booking.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-700'
                        : booking.status === 'CANCELLED' || booking.status === 'REJECTED'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {booking.status === 'APPROVED' || booking.status === 'COMPLETED' ? (
                      <CreditCard className="h-3 w-3" aria-hidden="true" />
                    ) : (
                      <Clock className="h-3 w-3" aria-hidden="true" />
                    )}
                    {booking.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                  &euro;{booking.amountPaid.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
