'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { Search } from 'lucide-react'
import TablePagination from '@/components/shared/TablePagination'

interface AttendanceRecord {
  id: string
  date: Date
  status: string
  createdAt: Date
  user: {
    email: string
    profile?: {
      firstName: string
      lastName: string
    } | null
  }
  class?: {
    name: string
  } | null
}

interface Props {
  records: AttendanceRecord[]
  totalRecords: number
  currentPage: number
  currentLimit: number
  currentQuery: string
}

export function AttendanceTableClient({
  records,
  totalRecords,
  currentPage,
  currentLimit,
  currentQuery,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(currentQuery)

  const updateUrl = useCallback(
    (page: number, limit: number, q: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', page.toString())
      params.set('limit', limit.toString())
      if (q) {
        params.set('q', q)
      } else {
        params.delete('q')
      }
      // ensure tab stays attendance
      params.set('tab', 'attendance')
      router.push(`${pathname}?${params.toString()}`)
    },
    [searchParams, pathname, router]
  )

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== currentQuery) {
        updateUrl(1, currentLimit, query)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [query, currentQuery, currentLimit, updateUrl])

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/30 px-6 py-4 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-800/30">
        <h3 className="text-aerojet-blue text-sm font-black tracking-widest uppercase dark:text-slate-100">
          Recent Attendance History
        </h3>

        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search student or class..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="focus:border-aerojet-sky focus:ring-aerojet-sky/20 w-full rounded-xl border border-slate-200 bg-white py-2 pr-4 pl-9 text-sm font-medium transition-all outline-none focus:ring-2 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/50 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:bg-slate-800/20">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Module / Event</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {records.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-sm font-medium text-slate-400 italic"
                >
                  No attendance records found.
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr
                  key={record.id}
                  className="group transition-all duration-150 ease-out hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                >
                  <td className="px-6 py-4 font-mono text-xs font-bold text-slate-400">
                    {format(new Date(record.date), 'MMM d, yyyy')}
                  </td>
                  <td className="text-aerojet-blue px-6 py-4 font-black dark:text-slate-100">
                    {record.user.profile
                      ? `${record.user.profile.firstName} ${record.user.profile.lastName}`
                      : record.user.email}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-400">
                    {record.class?.name || 'Unknown Class'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`rounded-lg px-2 py-0.5 text-[10px] font-black uppercase ${
                        record.status === 'PRESENT'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                          : record.status === 'ABSENT'
                            ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-xs text-slate-400">
                    {format(new Date(record.createdAt), 'HH:mm')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        page={currentPage}
        perPage={currentLimit}
        total={totalRecords}
        onPageChange={(page) => updateUrl(page, currentLimit, query)}
        onPerPageChange={(limit) => updateUrl(1, limit, query)}
      />
    </div>
  )
}
