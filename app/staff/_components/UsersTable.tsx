'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Users,
  RefreshCw,
  CheckSquare,
  Square,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Mail,
  LockOpen,
  Archive,
} from 'lucide-react'
import CreateUserDialog from './CreateUserDialog'
import TablePagination from './TablePagination'
import BulkActionsDropdown from './BulkActionsDropdown'
import UsersTableFilters from './users-table/UsersTableFilters'
import UsersTableRow from './users-table/UsersTableRow'
import type { User } from './users-table/types'
import { SortableTh } from '@/components/ui/sortable-th'

import {
  bulkUpdateUserStatus,
  bulkDeleteUsers,
  bulkArchiveUsers,
  bulkBypassPasswordChange,
} from '../actions'
import { toast } from 'sonner'

export default function UsersTable({ initialTotal }: { initialTotal: number }) {
  const searchParams = useSearchParams()
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(initialTotal)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState('all')
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        role,
        status,
        page: String(page),
        limit: String(perPage),
        ...(search && { search }),
      })
      const sort = searchParams.get('sort')
      const order = searchParams.get('order')
      if (sort) params.set('sort', sort)
      if (order) params.set('order', order)
      const res = await fetch(`/api/staff/users?${params}`)
      const data = await res.json()

      if (data.success) {
        setUsers(data.data ?? [])
        setTotal(data.meta?.total ?? 0)
      } else {
        setUsers([])
        setTotal(0)
      }
    } finally {
      setLoading(false)
    }
  }, [role, status, search, page, perPage, searchParams])

  useEffect(() => {
    const t = setTimeout(fetchUsers, search ? 350 : 0)
    return () => clearTimeout(t)
  }, [fetchUsers, search])

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  // eslint-disable-next-line react-hooks/set-state-in-effect
  // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1)
  }, [role, status, search])

  const bulkActions = [
    {
      label: 'Activate',
      icon: CheckCircle2,
      variant: 'success' as const,
      confirmTitle: 'Activate Users',
      confirmMessage: `Are you sure you want to activate ${selectedIds.length} selected users?`,
      onClick: async (ids: string[]) => {
        const res = await bulkUpdateUserStatus(ids, 'ACTIVE')
        if (res.success) { toast.success(`Activated ${ids.length} users`); fetchUsers() }
        else toast.error(res.error)
      },
    },
    {
      label: 'Suspend',
      icon: AlertTriangle,
      variant: 'warning' as const,
      confirmTitle: 'Suspend Users',
      confirmMessage: `Are you sure you want to suspend ${selectedIds.length} selected users?`,
      onClick: async (ids: string[]) => {
        const res = await bulkUpdateUserStatus(ids, 'SUSPENDED')
        if (res.success) { toast.success(`Suspended ${ids.length} users`); fetchUsers() }
        else toast.error(res.error)
      },
    },
    {
      label: 'Send Credentials',
      icon: Mail,
      variant: 'primary' as const,
      confirmTitle: 'Send Login Credentials',
      confirmMessage: `This will generate new temporary passwords and email login credentials to ${selectedIds.length} selected users.`,
      onClick: async (ids: string[]) => {
        try {
          const res = await fetch('/api/admin/bulk-send-credentials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ users: ids.map((id) => ({ userId: id })) }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Failed')
          toast.success(`Credentials sent to ${data.data.summary.sent} users`)
          fetchUsers()
        } catch (err: any) {
          toast.error(err.message || 'Failed')
        }
      },
    },
    users.filter((u) => selectedIds.includes(u.id)).every((u) => u.status === 'ARCHIVED') &&
    users.filter((u) => selectedIds.includes(u.id)).length > 0
      ? {
          label: 'Permanently Delete',
          icon: Trash2,
          variant: 'danger' as const,
          confirmTitle: 'Permanently Delete Users',
          confirmMessage: `Are you sure you want to permanently delete ${selectedIds.length} users? This cannot be undone.`,
          onClick: async (ids: string[]) => {
            const res = await bulkDeleteUsers(ids)
            if (res.success) { toast.success(`Permanently deleted ${ids.length} users`); fetchUsers() }
            else toast.error(res.error)
          },
        }
      : {
          label: 'Archive',
          icon: Archive,
          variant: 'warning' as const,
          confirmTitle: 'Archive Users',
          confirmMessage: `Are you sure you want to archive ${selectedIds.length} users?`,
          onClick: async (ids: string[]) => {
            const res = await bulkArchiveUsers(ids)
            if (res.success) { toast.success(`Archived ${ids.length} users`); fetchUsers() }
            else toast.error(res.error)
          },
        },
    {
      label: 'Bypass PW Change',
      icon: LockOpen,
      variant: 'primary' as const,
      confirmTitle: 'Bypass Password Change',
      confirmMessage: `Are you sure you want to bypass the required password change for ${selectedIds.length} selected users?`,
      onClick: async (ids: string[]) => {
        const res = await bulkBypassPasswordChange(ids)
        if (res.success) { toast.success(`Bypassed password change for ${ids.length} users`); fetchUsers() }
        else toast.error(res.error)
      },
    },
    {
      label: 'Send Email',
      icon: Mail,
      variant: 'default' as const,
      onClick: async (ids: string[]) => {
        const selectedEmails = users
          .filter((u) => ids.includes(u.id))
          .map((u) => u.email)
          .filter(Boolean)
        if (selectedEmails.length > 0) {
          window.location.href = `mailto:${selectedEmails.join(',')}`
        }
      },
    },
  ]

  const allSelected = selectedIds.length === users.length && users.length > 0

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{total.toLocaleString()} total users</p>
        <div className="flex gap-2">
          <CreateUserDialog />
          <Link
            href="/staff/students/import"
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition-all duration-150 ease-out hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-600"
          >
            <Users className="h-3.5 w-3.5 text-blue-600" />
            Import Students
          </Link>
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition-all duration-150 ease-out hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-600"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <BulkActionsDropdown
            selectedIds={selectedIds}
            onClear={() => setSelectedIds([])}
            actions={bulkActions}
          />
        </div>
      </div>

      {/* Filters */}
      <UsersTableFilters
        role={role}
        status={status}
        search={search}
        onRoleChange={setRole}
        onStatusChange={setStatus}
        onSearchChange={setSearch}
      />

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                <th className="w-12 px-5 py-3">
                  <button
                    onClick={() => setSelectedIds(allSelected ? [] : users.map((u) => u.id))}
                    className="hover:text-aerojet-blue text-slate-400 transition-colors"
                    aria-label="Select all users"
                  >
                    {allSelected ? (
                      <CheckSquare className="text-aerojet-blue h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <SortableTh sortKey="name" label="User" />
                <SortableTh sortKey="role" label="Role" />
                <SortableTh sortKey="status" label="Status" />
                <SortableTh sortKey="joined" label="Joined" />
                <th
                  key="actions"
                  className="px-5 py-3 text-[10px] font-black tracking-wider text-slate-500 uppercase"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-3.5">
                      <div className="h-4 w-4 animate-pulse rounded bg-slate-100" />
                    </td>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Users className="mx-auto mb-2 h-10 w-10 text-slate-200" />
                    <p className="text-sm font-bold text-slate-400">No users found</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <UsersTableRow
                    key={user.id}
                    user={user}
                    isSelected={selectedIds.includes(user.id)}
                    onToggleSelect={() =>
                      setSelectedIds((prev) =>
                        prev.includes(user.id)
                          ? prev.filter((id) => id !== user.id)
                          : [...prev, user.id]
                      )
                    }
                    onActionComplete={fetchUsers}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          page={page}
          perPage={perPage}
          total={total}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
        />
      </div>
    </div>
  )
}
