'use client'

import { useState } from 'react'
import { Clock, AlertCircle } from 'lucide-react'
import TablePagination from '@/app/staff/_components/TablePagination'

interface AttendanceRecord {
  id: string
  status: string
  date: string
  notes: string | null
  minutesLate: number | null
  class: {
    name: string
    course: {
      code: string
    }
  }
}

export default function AttendanceTable({ records }: { records: AttendanceRecord[] }) {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

  const total = records.length
  const paged = records.slice((page - 1) * perPage, page * perPage)

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
        <h2 className="font-bold text-slate-900 dark:text-slate-100">Attendance History</h2>
      </div>

      {paged.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold tracking-widest text-slate-400 uppercase dark:border-slate-800">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Class / Module</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paged.map((record) => (
                  <tr
                    key={record.id}
                    className="transition-colors hover:bg-slate-50 dark:bg-slate-800/50"
                  >
                    <td className="px-6 py-4 font-medium whitespace-nowrap text-slate-900 dark:text-slate-100">
                      {new Date(record.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {record.class.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {record.class.course.code}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          record.status === 'PRESENT'
                            ? 'bg-green-50 text-green-600'
                            : record.status === 'LATE'
                              ? 'bg-amber-50 text-amber-600'
                              : record.status === 'ABSENT'
                                ? 'bg-red-50 text-red-600'
                                : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {record.status === 'LATE' && <Clock className="h-3 w-3" />}
                        {record.status}
                        {record.minutesLate && ` (${record.minutesLate}m)`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {record.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination page={page} perPage={perPage} total={total} onPageChange={setPage} onPerPageChange={setPerPage} />
        </>
      ) : (
        <div className="p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300 dark:bg-slate-800/50">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No records found</h3>
          <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500 dark:text-slate-400">
            You don&apos;t have any attendance records yet. They will appear here once marked by your instructors.
          </p>
        </div>
      )}
    </div>
  )
}
