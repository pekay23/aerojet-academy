'use client'

import { useSort, SortHeader } from '@/lib/hooks/useSort'
import { format } from 'date-fns'

interface ExamResult {
  moduleCode: string | null
  percentage: number | Decimal | null
  passed: boolean
  examCategory: string | null
  attemptType: string | null
  createdAt: Date
  exam: {
    examDate: Date | null
    examComponent: { course: { code: string; name: string } | null } | null
  } | null
}

import type { Decimal } from '@prisma/client/runtime/library'

function moduleName(r: ExamResult) {
  return r.exam?.examComponent?.course?.name ?? r.moduleCode ?? '—'
}
function moduleCode(r: ExamResult) {
  return r.exam?.examComponent?.course?.code ?? r.moduleCode ?? '—'
}

export default function ExamResultsTable({ results }: { results: ExamResult[] }) {
  const { items, requestSort, sortConfig } = useSort(results, { key: 'createdAt', order: 'desc' })

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-100 text-left dark:border-slate-800">
          <SortHeader label="Module" sortKey="moduleCode" currentSort={sortConfig} onSort={requestSort} className="px-3 py-2 text-[10px] font-black tracking-widest text-slate-400 uppercase" />
          <SortHeader label="Category" sortKey="examCategory" currentSort={sortConfig} onSort={requestSort} className="px-3 py-2 text-[10px] font-black tracking-widest text-slate-400 uppercase" />
          <SortHeader label="Attempt" sortKey="attemptType" currentSort={sortConfig} onSort={requestSort} className="px-3 py-2 text-[10px] font-black tracking-widest text-slate-400 uppercase" />
          <SortHeader label="Score" sortKey="percentage" currentSort={sortConfig} onSort={requestSort} align="center" className="px-3 py-2 text-[10px] font-black tracking-widest text-slate-400 uppercase" />
          <SortHeader label="Result" sortKey="passed" currentSort={sortConfig} onSort={requestSort} align="center" className="px-3 py-2 text-[10px] font-black tracking-widest text-slate-400 uppercase" />
          <SortHeader label="Date" sortKey="createdAt" currentSort={sortConfig} onSort={requestSort} align="center" className="px-3 py-2 text-[10px] font-black tracking-widest text-slate-400 uppercase" />
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
        {items.map((r, i) => (
          <tr key={i}>
            <td className="px-3 py-2">
              <span className="font-mono font-bold">{moduleCode(r)}</span>{' '}
              <span className="text-slate-500">{moduleName(r)}</span>
            </td>
            <td className="px-3 py-2 text-xs text-slate-500">
              {r.examCategory === 'INTERNAL' ? 'Internal' : 'Official EASA'}
            </td>
            <td className="px-3 py-2 text-xs text-slate-500">
              {(r.attemptType || 'FIRST').replace(/_/g, ' ')}
            </td>
            <td className="px-3 py-2 text-center tabular-nums font-mono">
              {r.percentage != null ? `${r.percentage}%` : '—'}
            </td>
            <td className="px-3 py-2 text-center">
              <span
                className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                  r.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {r.passed ? 'Pass' : 'Fail'}
              </span>
            </td>
            <td className="px-3 py-2 text-center tabular-nums text-xs text-slate-500">
              {format(r.exam?.examDate ?? r.createdAt, 'MMM d, yyyy')}
            </td>
          </tr>
        ))}
        {items.length === 0 && (
          <tr>
            <td colSpan={6} className="px-3 py-6 text-center text-sm text-slate-400">
              No exam records.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}
