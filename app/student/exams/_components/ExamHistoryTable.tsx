'use client'

import { CheckCircle2, XCircle, AlertCircle, Calendar, History } from 'lucide-react'
import { useSort, SortHeader } from '@/lib/hooks/useSort'

interface HistoryRecord {
  id: string
  type: string
  moduleCode: string
  moduleName: string
  date: Date
  passed?: boolean | null
  score?: number | null
  percentage?: number | null
  grade?: string | null
}

interface ExamHistoryTableProps {
  results: HistoryRecord[]
}

export default function ExamHistoryTable({ results }: ExamHistoryTableProps) {
  const { items, requestSort, sortConfig } = useSort(results, { key: 'date', order: 'desc' })

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200/60 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-card dark:shadow-none">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm" aria-label="Exam history records">
          <thead className="bg-stone-50/50 dark:bg-white/5">
            <tr className="border-b border-stone-100 text-xs font-bold tracking-widest text-slate-400 uppercase dark:border-white/5">
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
          <tbody className="divide-y divide-stone-100 dark:divide-white/5">
            {items.map((h, idx) => (
              <tr
                key={h.id}
                className="transition-colors hover:bg-stone-50 dark:hover:bg-white/5"
              >
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-900 uppercase dark:text-white">
                    {h.moduleCode}
                  </p>
                  <p className="max-w-[150px] truncate text-xs font-medium text-slate-500" title={h.moduleName}>
                    {h.moduleName}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-black tracking-tight uppercase ${
                      h.type === 'HISTORICAL'
                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                        : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
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
                    {h.passed === true ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                        <span className="font-bold text-emerald-600">
                          {h.score !== undefined ? 'PASS' : 'PASS/EXEMPT'}
                        </span>
                      </>
                    ) : h.passed === false ? (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" aria-hidden="true" />
                        <span className="font-bold text-red-600">FAIL</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-slate-400" aria-hidden="true" />
                        <span className="font-bold text-slate-500">PENDING</span>
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
                    <span className="text-xs font-medium tracking-tight text-slate-400 uppercase italic">
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
