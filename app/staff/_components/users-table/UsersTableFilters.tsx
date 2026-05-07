'use client'

import { Search } from 'lucide-react'
import { ROLE_FILTERS, STATUS_FILTERS } from './types'

export default function UsersTableFilters({
  role,
  status,
  search,
  onRoleChange,
  onStatusChange,
  onSearchChange,
}: {
  role: string
  status: string
  search: string
  onRoleChange: (role: string) => void
  onStatusChange: (status: string) => void
  onSearchChange: (search: string) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <select
          id="users-status-filter"
          name="users-status-filter"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          aria-label="Filter by status"
          className="focus:ring-aerojet-sky rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
          autoComplete="off"
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All Statuses' : s}
            </option>
          ))}
        </select>

        <select
          id="users-role-filter"
          name="users-role-filter"
          value={role}
          onChange={(e) => onRoleChange(e.target.value)}
          aria-label="Filter by role"
          className="focus:ring-aerojet-sky rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
          autoComplete="off"
        >
          {ROLE_FILTERS.map((r) => (
            <option key={r} value={r}>
              {r === 'all' ? 'All Roles' : r}
            </option>
          ))}
        </select>
      </div>

      <div className="relative w-64">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          id="users-search"
          name="users-search"
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search user..."
          className="focus:ring-aerojet-sky w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-4 pl-9 text-xs outline-none focus:ring-2 dark:border-slate-700 dark:bg-slate-800/50"
          autoComplete="off"
        />
      </div>
    </div>
  )
}
