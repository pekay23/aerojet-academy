'use client'

import { useSort, SortHeader } from '@/lib/hooks/useSort'
import { format } from 'date-fns'

interface Enrollment {
  status: string
  completedAt: Date | null
  course: { code: string; name: string }
}

export default function EnrolmentTable({ enrollments }: { enrollments: Enrollment[] }) {
  const { items, requestSort, sortConfig } = useSort(enrollments, { key: 'completedAt', order: 'asc' })

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-100 text-left dark:border-slate-800">
          <SortHeader label="Course" sortKey="course.name" currentSort={sortConfig} onSort={requestSort} className="px-3 py-2 text-[10px] font-black tracking-widest text-slate-400 uppercase" />
          <SortHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={requestSort} className="px-3 py-2 text-[10px] font-black tracking-widest text-slate-400 uppercase" />
          <SortHeader label="Completed" sortKey="completedAt" currentSort={sortConfig} onSort={requestSort} align="center" className="px-3 py-2 text-[10px] font-black tracking-widest text-slate-400 uppercase" />
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
        {items.map((e, i) => (
          <tr key={i}>
            <td className="px-3 py-2">
              <span className="font-mono font-bold">{e.course.code}</span>{' '}
              <span className="text-slate-500">{e.course.name}</span>
            </td>
            <td className="px-3 py-2 text-xs">{e.status}</td>
            <td className="px-3 py-2 text-center tabular-nums text-xs text-slate-500">
              {e.completedAt ? format(e.completedAt, 'MMM d, yyyy') : '—'}
            </td>
          </tr>
        ))}
        {items.length === 0 && (
          <tr>
            <td colSpan={3} className="px-3 py-6 text-center text-sm text-slate-400">
              No course enrolments.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}
