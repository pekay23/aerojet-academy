'use client'

import { useState, useMemo } from 'react'
import { Clock, AlertCircle, School, ClipboardCheck } from 'lucide-react'
import TablePagination from '@/components/shared/TablePagination'
import { useSort, SortHeader } from '@/lib/hooks/useSort'

interface AttendanceRecord {
  id: string
  type: 'CLASS' | 'EXAM'
  status: string
  date: string
  notes: string | null
  minutesLate: number | null
  label: string
  subLabel: string
}

export default function AttendanceTable({ records }: { records: AttendanceRecord[] }) {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

  const sortableRecords = useMemo(
    () => records.map((r) => ({ ...r, _dateTs: new Date(r.date).getTime() })),
    [records]
  )
  const { items: sortedRecords, requestSort, sortConfig } = useSort(sortableRecords)
  const paged = sortedRecords.slice((page - 1) * perPage, page * perPage)

  const total = sortedRecords.length

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
        <h2 className="font-bold text-slate-900 dark:text-slate-100">
          Historical Attendance Registry
        </h2>
      </div>

      {paged.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" aria-label="Attendance records">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:border-slate-800">
                  <SortHeader
                    label="Type"
                    sortKey="type"
                    currentSort={sortConfig}
                    onSort={requestSort}
                    className="px-6 py-4"
                  />
                  <SortHeader
                    label="Date"
                    sortKey="_dateTs"
                    currentSort={sortConfig}
                    onSort={requestSort}
                    className="px-6 py-4"
                  />
                  <SortHeader
                    label="Activity / Module"
                    sortKey="label"
                    currentSort={sortConfig}
                    onSort={requestSort}
                    className="px-6 py-4"
                  />
                  <SortHeader
                    label="Status"
                    sortKey="status"
                    currentSort={sortConfig}
                    onSort={requestSort}
                    align="center"
                    className="px-6 py-4"
                  />
                  <th scope="col" className="px-6 py-4">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {paged.map((record) => (
                  <tr
                    key={record.id}
                    className="transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
                  >
                    <td className="px-6 py-4">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          record.type === 'CLASS'
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                        }`}
                      >
                        {record.type === 'CLASS' ? (
                          <School className="h-4 w-4" />
                        ) : (
                          <ClipboardCheck className="h-4 w-4" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium whitespace-nowrap text-slate-900 dark:text-slate-100">
                      <div className="text-sm">
                        {new Date(record.date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">
                        {new Date(record.date).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-black text-slate-900 dark:text-slate-100">
                        {record.label}
                      </div>
                      <div className="text-xs font-bold tracking-tight text-slate-400 uppercase">
                        {record.subLabel}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                          record.status === 'PRESENT'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                            : record.status === 'LATE'
                              ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                              : record.status === 'ABSENT'
                                ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {record.status === 'LATE' && (
                          <Clock className="h-3 w-3" aria-hidden="true" />
                        )}
                        {record.status}
                        {record.minutesLate && ` (${record.minutesLate}m)`}
                      </span>
                    </td>
                    <td className="max-w-50 truncate px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                      {record.notes || <span aria-label="No notes">—</span>}
                    </td>
                  </tr>
                ))}
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
        </>
      ) : (
        <div className="p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300 dark:bg-slate-800/50">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No records found</h3>
          <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500 dark:text-slate-400">
            You don&apos;t have any attendance records yet. They will appear here once marked by
            your instructors or examiners.
          </p>
        </div>
      )}
    </div>
  )
}
