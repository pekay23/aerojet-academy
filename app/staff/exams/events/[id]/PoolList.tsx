'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users, AlertTriangle, Download, Search } from 'lucide-react'
import type { PoolStatus } from '@prisma/client'
import PoolStatusBadge from '../../../_components/PoolStatusBadge'

interface Pool {
  id: string
  name: string
  status: PoolStatus
  poolType: string
  poolLabel?: string | null
  isAutoPool: boolean
  currentMemberCount: number
  maxCandidates: number
  timeSlot?: string | null
  dayNumber?: number | null
  allowedModules: string[]
  _count: { memberships: number }
}

export default function PoolList({ pools }: { pools: Pool[] }) {
  const [search, setSearch] = useState('')

  const filtered = pools.filter((p) =>
    (p.name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      {pools.length > 3 && (
        <div className="border-b border-slate-100 px-6 py-3 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search pools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-aerojet-blue focus:outline-none focus:ring-1 focus:ring-aerojet-blue dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            />
          </div>
        </div>
      )}
      <div className="divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50">
              <Users className="h-5 w-5 text-slate-300" />
            </div>
            <p className="text-sm">
              {search ? 'No pools match your search.' : 'No seating pools created for this event yet.'}
            </p>
          </div>
        ) : (
          filtered.map((pool) => (
            <div
              key={pool.id}
              className="flex flex-col justify-between gap-4 px-6 py-5 md:flex-row md:items-center"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">
                    {pool.name}
                  </h3>
                  <PoolStatusBadge status={pool.status} />
                  {pool.poolType === 'AUTO' && (
                    <span className="inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">Auto</span>
                  )}
                  {pool.poolType === 'GROUP_CHARTER' && (
                    <span className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Group Charter</span>
                  )}
                  {pool.poolType === 'STANDARD' && pool.poolLabel && (
                    <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Pool {pool.poolLabel}</span>
                  )}
                </div>
                <div className="mt-1 flex gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {pool.currentMemberCount} / {pool.maxCandidates} Capacity
                  </span>
                  {pool.timeSlot && (
                    <span>Day {pool.dayNumber} · {pool.timeSlot === 'MORNING' ? 'Morning' : 'Afternoon'}</span>
                  )}
                  {pool.isAutoPool && (
                    <span className="text-indigo-600 dark:text-indigo-400">Will redistribute at booking deadline</span>
                  )}
                  {pool.allowedModules.length > 0 && (
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-amber-500" />
                      {pool.allowedModules.length} Modules
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={`/api/staff/reports/roster/${pool.id}`}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                  title="Download CSV Roster"
                >
                  <Download className="h-3 w-3" />
                  Roster
                </a>
                <Link
                  href={`/staff/exams/pools/${pool.id}`}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition-all duration-150 ease-out hover:border-slate-300 hover:bg-white hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:border-slate-600"
                >
                  Manage
                </Link>
                <Link
                  href={`/staff/exams/pools/${pool.id}/edit`}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition-all duration-150 ease-out hover:border-slate-300 hover:bg-white hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:border-slate-600"
                >
                  Settings
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}
