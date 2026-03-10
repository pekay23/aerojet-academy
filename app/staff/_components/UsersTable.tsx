'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Search,
  Users,
  RefreshCw,
  UserPlus,
  ShieldCheck,
  CheckSquare,
  Square,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Mail,
  LockOpen,
  Archive,
} from 'lucide-react'
import UserActionsMenu from './UserActionsMenu'
import CreateUserDialog from './CreateUserDialog'

import {
  bulkUpdateUserStatus,
  bulkDeleteUsers,
  bulkArchiveUsers,
  bulkBypassPasswordChange,
} from '../actions'
import { toast } from 'sonner'
import TablePagination from './TablePagination'
import BulkActionsDropdown from './BulkActionsDropdown'

interface User {
  id: string
  email: string
  personalEmail?: string | null
  academyEmail?: string | null
  role: string
  status: string
  emailVerified: string | null
  mustChangePassword?: boolean
  createdAt: string
  profile?: {
    firstName: string
    middleName?: string | null
    lastName: string
    phone?: string | null
    profilePhotoUrl?: string | null
  } | null
}

const ROLE_FILTERS = ['all', 'STUDENT', 'APPLICANT', 'INSTRUCTOR', 'STAFF', 'ADMIN']
const STATUS_FILTERS = ['all', 'ACTIVE', 'PENDING', 'SUSPENDED', 'ARCHIVED']

const ROLE_STYLE: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-700',
  ADMIN: 'bg-red-100 text-red-700',
  STAFF: 'bg-purple-100 text-purple-700',
  INSTRUCTOR: 'bg-blue-100 text-blue-700',
  STUDENT: 'bg-emerald-100 text-emerald-700',
  APPLICANT: 'bg-amber-100 text-amber-700',
}

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  SUSPENDED: 'bg-red-100 text-red-600',
  ARCHIVED: 'bg-slate-100 text-slate-500',
  DELETED: 'bg-slate-100 text-slate-400',
}

export default function UsersTable({ initialTotal }: { initialTotal: number }) {
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
      const res = await fetch(`/api/staff/users?${params}`)
      const data = await res.json()
      setUsers(data.users ?? [])
      setTotal(data.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [role, status, search, page, perPage])

  useEffect(() => {
    const t = setTimeout(fetchUsers, search ? 350 : 0)
    return () => clearTimeout(t)
  }, [fetchUsers, search])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [role, status, search])

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{total.toLocaleString()} total users</p>
        <div className="flex gap-2">
          <CreateUserDialog />
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <BulkActionsDropdown
            selectedIds={selectedIds}
            onClear={() => setSelectedIds([])}
            actions={[
              {
                label: 'Activate',
                icon: CheckCircle2,
                variant: 'success',
                confirmTitle: 'Activate Users',
                confirmMessage: `Are you sure you want to activate ${selectedIds.length} selected users?`,
                onClick: async (ids) => {
                  const res = await bulkUpdateUserStatus(ids, 'ACTIVE')
                  if (res.success) {
                    toast.success(`Activated ${ids.length} users`)
                    fetchUsers()
                  } else toast.error(res.error)
                },
              },
              {
                label: 'Suspend',
                icon: AlertTriangle,
                variant: 'warning',
                confirmTitle: 'Suspend Users',
                confirmMessage: `Are you sure you want to suspend ${selectedIds.length} selected users?`,
                onClick: async (ids) => {
                  const res = await bulkUpdateUserStatus(ids, 'SUSPENDED')
                  if (res.success) {
                    toast.success(`Suspended ${ids.length} users`)
                    fetchUsers()
                  } else toast.error(res.error)
                },
              },
              {
                label: 'Send Credentials',
                icon: Mail,
                variant: 'primary',
                confirmTitle: 'Send Login Credentials',
                confirmMessage: `This will generate new temporary passwords and email login credentials to ${selectedIds.length} selected users.`,
                onClick: async (ids) => {
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
              users.filter((u) => selectedIds.includes(u.id)).length > 0 &&
              users.filter((u) => selectedIds.includes(u.id)).every((u) => u.status === 'ARCHIVED')
                ? {
                    label: 'Permanently Delete',
                    icon: Trash2,
                    variant: 'danger',
                    confirmTitle: 'Permanently Delete Users',
                    confirmMessage: `Are you sure you want to permanently delete ${selectedIds.length} users? This cannot be undone.`,
                    onClick: async (ids) => {
                      const res = await bulkDeleteUsers(ids)
                      if (res.success) {
                        toast.success(`Permanently deleted ${ids.length} users`)
                        fetchUsers()
                      } else toast.error(res.error)
                    },
                  }
                : {
                    label: 'Archive',
                    icon: Archive,
                    variant: 'warning',
                    confirmTitle: 'Archive Users',
                    confirmMessage: `Are you sure you want to archive ${selectedIds.length} users?`,
                    onClick: async (ids) => {
                      const res = await bulkArchiveUsers(ids)
                      if (res.success) {
                        toast.success(`Archived ${ids.length} users`)
                        fetchUsers()
                      } else toast.error(res.error)
                    },
                  },
              {
                label: 'Bypass PW Change',
                icon: LockOpen,
                variant: 'primary',
                confirmTitle: 'Bypass Password Change',
                confirmMessage: `Are you sure you want to bypass the required password change for ${selectedIds.length} selected users?`,
                onClick: async (ids) => {
                  const res = await bulkBypassPasswordChange(ids)
                  if (res.success) {
                    toast.success(`Bypassed password change for ${ids.length} users`)
                    fetchUsers()
                  } else toast.error(res.error)
                },
              },
              {
                label: 'Send Email',
                icon: Mail,
                variant: 'default',
                onClick: async (ids) => {
                  const selectedEmails = users
                    .filter((u) => ids.includes(u.id))
                    .map((u) => u.email)
                    .filter(Boolean)
                  if (selectedEmails.length > 0) {
                    window.location.href = `mailto:${selectedEmails.join(',')}`
                  }
                },
              },
            ]}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Status filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="focus:ring-aerojet-sky rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All Statuses' : s}
              </option>
            ))}
          </select>

          {/* Role filter */}
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="focus:ring-aerojet-sky rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
          >
            {ROLE_FILTERS.map((r) => (
              <option key={r} value={r}>
                {r === 'all' ? 'All Roles' : r}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search user..."
            className="focus:ring-aerojet-sky w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-4 pl-9 text-xs outline-none focus:ring-2 dark:border-slate-700 dark:bg-slate-800/50"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                <th className="w-12 px-5 py-3">
                  <button
                    onClick={() => {
                      if (selectedIds.length === users.length && users.length > 0) {
                        setSelectedIds([])
                      } else {
                        setSelectedIds(users.map((u) => u.id))
                      }
                    }}
                    className="hover:text-aerojet-blue text-slate-400 transition-colors"
                  >
                    {selectedIds.length === users.length && users.length > 0 ? (
                      <CheckSquare className="text-aerojet-blue h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                {['User', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-[10px] font-black tracking-wider text-slate-400 uppercase"
                  >
                    {h}
                  </th>
                ))}
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
                users.map((user) => {
                  const fullName = user.profile
                    ? [user.profile.firstName, user.profile.middleName, user.profile.lastName]
                        .filter(Boolean)
                        .join(' ')
                    : user.email
                  const initials = user.profile
                    ? `${user.profile.firstName[0]}${user.profile.lastName[0]}`
                    : user.email[0].toUpperCase()

                  return (
                    <tr
                      key={user.id}
                      className={`transition-colors hover:bg-slate-50 dark:bg-slate-800/50 ${selectedIds.includes(user.id) ? 'bg-aerojet-blue/5' : ''}`}
                    >
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => {
                            setSelectedIds((prev) =>
                              prev.includes(user.id)
                                ? prev.filter((id) => id !== user.id)
                                : [...prev, user.id]
                            )
                          }}
                          className="hover:text-aerojet-blue text-slate-300 transition-colors"
                        >
                          {selectedIds.includes(user.id) ? (
                            <CheckSquare className="text-aerojet-blue h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="bg-aerojet-blue/10 text-aerojet-blue relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-black">
                            {user.profile?.profilePhotoUrl ? (
                              <img
                                src={user.profile.profilePhotoUrl}
                                alt={fullName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              initials
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                              {fullName}
                            </p>
                            <p className="text-xs text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${ROLE_STYLE[user.role] ?? 'bg-slate-100 text-slate-500'}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${STATUS_STYLE[user.status] ?? 'bg-slate-100 text-slate-500'}`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-3.5">
                        <UserActionsMenu
                          userId={user.id}
                          userStatus={user.status}
                          userEmail={user.email}
                          userRole={user.role}
                          userName={fullName}
                          isEmailVerified={!!user.emailVerified}
                          mustChangePassword={user.mustChangePassword}
                          onActionComplete={fetchUsers}
                        />
                      </td>
                    </tr>
                  )
                })
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
