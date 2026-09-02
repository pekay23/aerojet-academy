'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShieldCheck, RefreshCw, Search, Square } from 'lucide-react'

import TablePagination from './TablePagination'
import { useUserTable } from '@/lib/hooks/useUserTable'

interface Examiner {
  id: string
  email: string
  status: string
  profile: { firstName: string; lastName: string; profilePhotoUrl?: string | null } | null
  examinerProfile: { maxParallelSittings: number; notes: string | null; isActive: boolean } | null
}

export default function ExaminersTable() {
  const router = useRouter()
  const { data: examiners, total, loading, search, setSearch, page, setPage, perPage, setPerPage, refetch } =
    useUserTable<Examiner>({ endpoint: '/api/staff/users', queryParams: { role: 'EXAMINER' } })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage authorized exam examiners and their credentials
        </p>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-60">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="examiners-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search examiners..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-4 pl-9 text-xs outline-none focus:ring-2 focus:ring-aerojet-sky dark:border-slate-700 dark:bg-slate-800/50"
            />
          </div>
          <button
            onClick={() => void refetch()}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition-all hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="w-12 px-6 py-4">
                  <Square className="h-4 w-4 text-slate-300" />
                </th>
                <th className="px-6 py-4">Examiner</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Notes / Background</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8 h-16 bg-slate-50/50" />
                  </tr>
                ))
              ) : examiners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50">
                      <ShieldCheck className="h-6 w-6 text-slate-300" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">No examiners found</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Add users to the EXAMINER role to see them here.</p>
                  </td>
                </tr>
              ) : (
                examiners.map((examiner) => (
                  <tr key={examiner.id} className="group transition-all duration-150 hover:bg-slate-50/50 hover:shadow-[0_1px_4px_rgba(0,0,0,0.06)] dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4">
                      <Square className="h-4 w-4 text-slate-200" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-aerojet-blue/10 font-bold text-aerojet-blue uppercase">
                          {examiner.profile?.firstName?.charAt(0)}{examiner.profile?.lastName?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-black text-slate-900 dark:text-white">
                            {examiner.profile?.firstName} {examiner.profile?.lastName}
                          </div>
                          <div className="text-[11px] text-slate-500">{examiner.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                        examiner.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        {examiner.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate text-xs text-slate-600 dark:text-slate-400">
                        {examiner.examinerProfile?.notes || 'No notes available'}
                      </div>
                      <div className="mt-0.5 text-[10px] font-bold text-aerojet-blue/70">
                        Capacity: {examiner.examinerProfile?.maxParallelSittings} Parallel Sitting(s)
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => router.push(`/staff/users/${examiner.id}`)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                      >
                        Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <TablePagination page={page} perPage={perPage} total={total} onPageChange={setPage} onPerPageChange={setPerPage} />
      </div>
    </div>
  )
}