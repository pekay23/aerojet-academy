'use client'

import { CheckCircle2, XCircle, AlertCircle, Calendar, History } from 'lucide-react'
import { useSort, SortHeader } from '@/lib/hooks/useSort'

interface HistoryRecord {
  id: string
  type: string
  moduleCode: string
  moduleName: string
  date: Date | string | null
  dateDisplay?: string | null
  dateDisplayKind?: 'DATE' | 'TBC' | 'TBD'
  sittingLabel?: string | null
  attendanceStatus?: string | null
  passed?: boolean | null
  score?: number | null
  percentage?: number | null
  grade?: string | null
  result?: string | null
}

function resultBadgeClass(result?: string | null) {
  const normalized = result?.toUpperCase()
  if (normalized === 'PASS') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
  if (normalized === 'FAIL') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  if (normalized === 'ABSENT') return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
  if (normalized?.includes('PENDING')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
  if (normalized?.includes('EXCUSED')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
  if (normalized === 'MIGRATED') return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
  if (normalized === 'SCHEDULED') return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
  if (normalized === 'EXECUTED') return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
  if (normalized === 'POSTPONED') return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
  if (normalized === 'ROLLED FORWARD') return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
  if (normalized === 'CANCELLED') return 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
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
              <th scope="col" className="px-6 py-4">Attendance</th>
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
                  <div>
                    <div>
                      {h.dateDisplayKind === 'DATE' && h.date ? (
                        new Date(h.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                      ) : (
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          {h.dateDisplay || 'TBD'}
                        </span>
                      )}
                    </div>
                    {h.sittingLabel && (
                      <div className="text-[10px] uppercase text-slate-400">
                        {h.sittingLabel}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                      h.attendanceStatus === 'PRESENT'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                        : h.attendanceStatus === 'ABSENT'
                          ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                          : h.attendanceStatus === 'EXCUSED'
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {h.attendanceStatus || '—'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {h.result && !['pass', 'fail', 'PASS', 'FAIL'].includes(h.result) ? (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${resultBadgeClass(h.result)}`}>
                        {h.result}
                      </span>
                    ) : (
                      <>
                        {h.passed === true ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                            <span className="font-bold text-emerald-600">
                              {h.score !== undefined && h.score !== null ? 'PASS' : 'PASS/EXEMPT'}
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
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  {h.score !== undefined && h.score !== null ? (
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
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
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
