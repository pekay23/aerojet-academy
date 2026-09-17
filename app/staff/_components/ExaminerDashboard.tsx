'use client'

import { useMemo } from 'react'
import { Calendar, Users, ClipboardCheck, Clock, BookOpen } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { useSort, SortHeader } from '@/lib/hooks/useSort'

interface ExaminerDashboardProps {
  examinerName: string
  nextSitting?: {
    id: string
    name?: string | null
    startTime: string
    maxCandidates?: number | null
  } | null
  recentSittings: {
    id: string
    name?: string | null
    startTime: string
    event?: { name: string } | null
    currentMemberCount?: number | null
    status: string
  }[]
}

export default function ExaminerDashboard({ examinerName, nextSitting, recentSittings }: ExaminerDashboardProps) {
  const sortable = useMemo(
    () =>
      recentSittings.map((s) => ({
        ...s,
        _date: s.startTime ? new Date(s.startTime).getTime() : 0,
      })),
    [recentSittings]
  )
  const { items: sortedSittings, requestSort, sortConfig } = useSort(sortable)
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-aerojet-blue uppercase dark:text-white">
          Examiner Hub
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Welcome back, {examinerName}. You are authorized for Part-147 invigilation.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Next Sitting Card */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-aerojet-blue/20 bg-aerojet-blue/5 p-6 dark:border-aerojet-blue/30 dark:bg-aerojet-blue/10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-widest text-aerojet-blue">
                Next Assigned Sitting
              </h2>
              <Calendar className="h-4 w-4 text-aerojet-blue" />
            </div>

            {nextSitting ? (
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    {nextSitting.name || 'Official EASA Exam Session'}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {format(new Date(nextSitting.startTime), 'EEEE, MMM do')} @ {format(new Date(nextSitting.startTime), 'HH:mm')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {nextSitting.maxCandidates != null ? `${nextSitting.maxCandidates} Candidates Allocated` : '—'}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/staff/exams/sittings/${nextSitting.id}`}
                  className="rounded-xl bg-aerojet-blue px-6 py-3 text-center text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                  Start Invigilation
                </Link>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm font-bold text-slate-400">No upcoming sittings assigned yet.</p>
                <p className="mt-1 text-xs text-slate-300">Staff will assign you once the Go/No-Go is confirmed.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <div className="mb-3 flex items-center gap-2">
              <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-900/20">
                <ClipboardCheck className="h-4 w-4 text-emerald-600" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Sittings</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{recentSittings.length}</div>
            <p className="text-[10px] text-slate-500">Recently completed</p>
          </div>
          
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <div className="mb-3 flex items-center gap-2">
              <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
                <BookOpen className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Invigilation Log</span>
            </div>
            <p className="text-[11px] text-slate-600">Access the official record of past exam sessions and attendance sheets.</p>
          </div>
        </div>
      </div>

      {/* Recent History */}
      <div>
        <h2 className="mb-4 text-sm font-black uppercase tracking-tight text-slate-800 dark:text-slate-200">
          Recent Invigilation History
        </h2>
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:bg-slate-800/50">
              <tr>
                <SortHeader label="Date" sortKey="_date" currentSort={sortConfig} onSort={requestSort} className="px-6 py-4" />
                <SortHeader label="Event / Session" sortKey="event.name" currentSort={sortConfig} onSort={requestSort} className="px-6 py-4" />
                <SortHeader label="Students" sortKey="currentMemberCount" currentSort={sortConfig} onSort={requestSort} className="px-6 py-4" align="right" />
                <SortHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={requestSort} className="px-6 py-4" align="center" />
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedSittings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-xs text-slate-400">
                    No past sittings found in the record.
                  </td>
                </tr>
              ) : (
                sortedSittings.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{format(new Date(s.startTime), 'MMM d, yyyy')}</td>
                    <td className="px-6 py-4">
                     <div className="font-bold text-slate-900 dark:text-white">{s.event?.name}</div>
                       <div className="text-[10px] text-slate-500">{s.name}</div>
                    </td>
                    <td className="px-6 py-4">{s.currentMemberCount != null ? `${s.currentMemberCount} Members` : '—'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        COMPLETED
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <Link href={`/staff/exams/sittings/${s.id}`} className="text-xs font-bold text-aerojet-blue hover:underline">
                         View Log
                       </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
