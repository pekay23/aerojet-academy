'use client'

import { CheckCircle2, XCircle, AlertCircle, Calendar, History } from 'lucide-react'
import { useSort, SortHeader } from '@/lib/hooks/useSort'

interface HistoryRecord {
  id: string
  type: string
  moduleCode: string
  moduleName: string
  date: Date
  passed: boolean
  score?: number
  percentage?: number
  grade?: string
}

interface ExamHistoryTableProps {
  records: HistoryRecord[]
}

export default function ExamHistoryTable({ records }: ExamHistoryTableProps) {
  const { items, requestSort, sortConfig } = useSort(records, { key: 'date', order: 'desc' })

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm" aria-label="Exam history records">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr className="border-b border-slate-100 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:border-slate-800">
              <SortHeader
                label="Module"
                sortKey="moduleCode"
                currentSort={sortConfig}
                onSort={requestSort}
              />
              <th scope="col" className="px-6 py-4">Source</th>
              <SortHeader
                label="Date"
                sortKey="date"
                currentSort={sortConfig}
                onSort={requestSort}
              />
              <th scope="col" className="px-6 py-4">Result</th>
              <SortHeader
                label="Details"
                sortKey="score"
                currentSort={sortConfig}
                onSort={requestSort}
                align="right"
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {items.map((h, idx) => (
              <tr
                key={h.id}
                className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
              >
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-900 uppercase dark:text-white">
                    {h.moduleCode}
                  </p>
                  <p className="max-w-[150px] truncate text-[10px] font-medium text-slate-500" title={h.moduleName}>
                    {h.moduleName}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[9px] font-bold uppercase ${
                      h.type === 'MIGRATED'
                        ? 'bg-purple-50 text-purple-600'
                        : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    {h.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                  {h.date ? new Date(h.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No date available'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {h.passed ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                        <span className="font-bold text-emerald-600">
                          {h.score !== undefined ? 'PASS' : 'AWAITING RESULT'}
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" aria-hidden="true" />
                        <span className="font-bold text-red-600">FAIL</span>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  {h.score !== undefined ? (
                    <span className="font-bold text-slate-900 dark:text-white">
                      {Number(h.score).toFixed(0)}%
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium tracking-tight text-slate-400 uppercase italic">
                      Record Pending
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                  No historical data found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
