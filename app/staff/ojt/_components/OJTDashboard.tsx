'use client'

import { useState } from 'react'
import {
  BookOpen,
  Clock,
  CheckCircle2,
  AlertTriangle as _AlertTriangle,
  PauseCircle,
  ChevronRight,
  Search,
  Building2,
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

type StatusKey = 'ACTIVE' | 'COMPLETED' | 'SUSPENDED'

interface StatusConfig {
  label: string
  icon: typeof BookOpen
  color: string
  bg: string
}

const STATUS_CONFIG: Record<StatusKey, StatusConfig> = {
  ACTIVE: {
    label: 'Active',
    icon: BookOpen,
    color: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
  },
  COMPLETED: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
  },
  SUSPENDED: {
    label: 'Suspended',
    icon: PauseCircle,
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
  },
}

interface Logbook {
  id: string
  studentName: string
  studentId: string
  email: string
  programme: string
  licenceCategory: string
  facilityName: string
  facilityApprovalNo: string | null
  startDate: string
  targetEndDate: string | null
  totalLoggedHours: number
  status: StatusKey
  entryCount: number
  hasMentor: boolean
}

export default function OJTDashboard({
  logbooks,
  statusCounts,
}: {
  logbooks: Logbook[]
  statusCounts: Record<StatusKey, number>
}) {
  const [filter, setFilter] = useState<string>('ALL')
  const [search, setSearch] = useState('')

  const filtered = logbooks.filter((lb) => {
    if (filter !== 'ALL' && lb.status !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        lb.studentName.toLowerCase().includes(q) ||
        lb.studentId.toLowerCase().includes(q) ||
        lb.email.toLowerCase().includes(q) ||
        lb.facilityName.toLowerCase().includes(q)
      )
    }
    return true
  })

  const totalHours = logbooks.reduce((s, lb) => s + lb.totalLoggedHours, 0)

  return (
    <div className="space-y-4">
      {/* Stats cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            Total Logbooks
          </div>
          <div className="mt-1 text-2xl font-black text-slate-800 dark:text-white">
            {logbooks.length}
          </div>
        </div>
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-900/20">
          <div className="text-xs font-bold tracking-wider text-green-600 uppercase dark:text-green-400">
            Active
          </div>
          <div className="mt-1 text-2xl font-black text-green-700 dark:text-green-300">
            {statusCounts['ACTIVE'] || 0}
          </div>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-900/20">
          <div className="text-xs font-bold tracking-wider text-blue-600 uppercase dark:text-blue-400">
            Completed
          </div>
          <div className="mt-1 text-2xl font-black text-blue-700 dark:text-blue-300">
            {statusCounts['COMPLETED'] || 0}
          </div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-900/20">
          <div className="text-xs font-bold tracking-wider text-amber-600 uppercase dark:text-amber-400">
            Suspended
          </div>
          <div className="mt-1 text-2xl font-black text-amber-700 dark:text-amber-300">
            {statusCounts['SUSPENDED'] || 0}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            Total Hours
          </div>
          <div className="mt-1 text-2xl font-black text-slate-800 dark:text-white">
            {Math.round(totalHours * 10) / 10}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, student ID, email, or facility..."
            className="focus:border-aerojet-blue focus:ring-aerojet-blue/20 w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-4 pl-10 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div className="flex gap-1">
          {['ALL', 'ACTIVE', 'COMPLETED', 'SUSPENDED'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                filter === s
                  ? 'bg-aerojet-blue text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Licence Cat.</th>
              <th className="px-4 py-3 font-medium">Facility</th>
              <th className="px-4 py-3 font-medium">Hours</th>
              <th className="px-4 py-3 font-medium">Entries</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Start Date</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-3">
                    <span>
                      {search ? 'No logbooks match your search.' : 'No OJT logbooks found.'}
                    </span>
                    {!search && logbooks.length === 0 && (
                      <Link
                        href="/staff/ojt/preview"
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        View generic logbook preview
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((lb) => {
                const cfg = STATUS_CONFIG[lb.status] || STATUS_CONFIG.ACTIVE
                const Icon = cfg.icon

                return (
                  <tr
                    key={lb.id}
                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800 dark:text-white">
                        {lb.studentName}
                      </div>
                      <div className="text-xs text-slate-500">{lb.studentId}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                        {lb.licenceCategory}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-slate-700 dark:text-slate-300">
                          {lb.facilityName}
                        </span>
                      </div>
                      {lb.facilityApprovalNo && (
                        <div className="text-[10px] text-slate-400">{lb.facilityApprovalNo}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-bold text-slate-800 dark:text-white">
                          {Math.round(lb.totalLoggedHours * 10) / 10}h
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {lb.entryCount}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.color}`}
                      >
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {format(new Date(lb.startDate), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/staff/ojt/${lb.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                      >
                        View <ChevronRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
