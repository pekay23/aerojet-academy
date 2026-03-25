'use client'

import { Users, Calendar, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface PoolSummary {
  id: string
  name: string
  currentMemberCount: number
  maxCandidates: number
  examDate: Date
  status: string
  event: {
    name: string
  }
}

interface Props {
  pools: PoolSummary[]
}

export default function PoolsSummaryCard({ pools }: Props) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black tracking-tight text-slate-800 uppercase dark:text-white">
            Active Exam Bookings
          </h2>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            Current occupancy across open bookings
          </p>
        </div>
        <Users className="text-aerojet-sky h-5 w-5" />
      </div>

      <div className="space-y-4">
        {pools.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-slate-400">No active pools found</p>
          </div>
        ) : (
          pools.map((pool) => {
            const percentage = Math.round((pool.currentMemberCount / pool.maxCandidates) * 100)
            return (
              <div key={pool.id} className="group relative">
                <div className="mb-2 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                      {pool.name}
                    </p>
                    <p className="truncate text-[10px] text-slate-400 dark:text-slate-500">
                      {pool.event.name} • {format(new Date(pool.examDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                      {pool.currentMemberCount}/{pool.maxCandidates}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400">{percentage}%</p>
                  </div>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all ${
                      percentage >= 90
                        ? 'bg-red-500'
                        : percentage >= 75
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <Link
                  href={`/staff/exams/pools/${pool.id}`}
                  className="absolute inset-0 z-10"
                  aria-label={`View details for ${pool.name}`}
                />
              </div>
            )
          })
        )}
      </div>

      {pools.length > 0 && (
        <div className="mt-6 border-t border-slate-50 pt-4 dark:border-slate-800">
          <Link
            href="/staff/exams"
            className="group flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400 transition-colors hover:text-aerojet-blue dark:hover:text-blue-400"
          >
            View All Events
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      )}
    </div>
  )
}
