'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  GraduationCap,
  RefreshCw,
  Search,
  CheckSquare,
  Square,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Mail,
  LockOpen,
  Archive,
} from 'lucide-react'

import TablePagination from './TablePagination'
import BulkActionsDropdown from './BulkActionsDropdown'
import {
  bulkUpdateUserStatus,
  bulkDeleteUsers,
  bulkArchiveUsers,
  bulkBypassPasswordChange,
} from '../actions'
import { toast } from 'sonner'

interface Instructor {
  id: string
  email: string
  academyEmail: string | null
  status: string
  profile: { firstName: string; middleName?: string | null; lastName: string } | null
  instructorProfile: { employeeId: string | null; specialization: string | null } | null
}

export default function InstructorsTable() {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const router = useRouter()

  const fetchInstructors = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        role: 'INSTRUCTOR',
        search,
        page: page.toString(),
        limit: perPage.toString(),
      })
      const res = await fetch(`/api/staff/users?${params}`)
      const data = await res.json()
      setInstructors(data.users ?? [])
      setTotal(data.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [search, page, perPage])

  useEffect(() => {
    setPage(1)
  }, [search])

  useEffect(() => {
    const t = setTimeout(fetchInstructors, search ? 350 : 0)
    return () => clearTimeout(t)
  }, [fetchInstructors, search])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage teaching staff and their assignments
        </p>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-60">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search instructors..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-4 pl-9 text-xs outline-none focus:ring-2 focus:ring-aerojet-sky dark:border-slate-700 dark:bg-slate-800/50"
            />
          </div>
          <button
            onClick={fetchInstructors}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition-all duration-150 ease-out hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-600"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <BulkActionsDropdown
            selectedIds={selectedIds}
            onClear={() => setSelectedIds([])}
            actions={[
              {
                label: 'Activate',
                icon: CheckCircle2,
                variant: 'success',
                confirmTitle: 'Activate Instructors',
                confirmMessage: `Are you sure you want to activate ${selectedIds.length} selected instructors?`,
                onClick: async (ids) => {
                  const res = await bulkUpdateUserStatus(ids, 'ACTIVE')
                  if (res.success) {
                    toast.success(`Activated ${ids.length} instructors`)
                    fetchInstructors()
                  } else toast.error(res.error)
                },
              },
              {
                label: 'Suspend',
                icon: AlertTriangle,
                variant: 'warning',
                confirmTitle: 'Suspend Instructors',
                confirmMessage: `Are you sure you want to suspend ${selectedIds.length} selected instructors?`,
                onClick: async (ids) => {
                  const res = await bulkUpdateUserStatus(ids, 'SUSPENDED')
                  if (res.success) {
                    toast.success(`Suspended ${ids.length} instructors`)
                    fetchInstructors()
                  } else toast.error(res.error)
                },
              },
              instructors.filter((i) => selectedIds.includes(i.id)).length > 0 &&
              instructors
                .filter((i) => selectedIds.includes(i.id))
                .every((i) => i.status === 'ARCHIVED')
                ? {
                    label: 'Permanently Delete',
                    icon: Trash2,
                    variant: 'danger',
                    confirmTitle: 'Permanently Delete Instructors',
                    confirmMessage: `Are you sure you want to permanently delete ${selectedIds.length} instructors? This cannot be undone.`,
                    onClick: async (ids) => {
                      const res = await bulkDeleteUsers(ids)
                      if (res.success) {
                        toast.success(`Permanently deleted ${ids.length} instructors`)
                        fetchInstructors()
                      } else toast.error(res.error)
                    },
                  }
                : {
                    label: 'Archive',
                    icon: Archive,
                    variant: 'warning',
                    confirmTitle: 'Archive Instructors',
                    confirmMessage: `Are you sure you want to archive ${selectedIds.length} instructors?`,
                    onClick: async (ids) => {
                      const res = await bulkArchiveUsers(ids)
                      if (res.success) {
                        toast.success(`Archived ${ids.length} instructors`)
                        fetchInstructors()
                      } else toast.error(res.error)
                    },
                  },
              {
                label: 'Bypass PW Change',
                icon: LockOpen,
                variant: 'primary',
                confirmTitle: 'Bypass Password Change',
                confirmMessage: `Are you sure you want to bypass the required password change for ${selectedIds.length} selected instructors?`,
                onClick: async (ids) => {
                  const res = await bulkBypassPasswordChange(ids)
                  if (res.success) {
                    toast.success(`Bypassed password change for ${ids.length} instructors`)
                    fetchInstructors()
                  } else toast.error(res.error)
                },
              },
              {
                label: 'Send Email',
                icon: Mail,
                variant: 'default',
                onClick: async (ids) => {
                  const selectedEmails = instructors
                    .filter((i) => ids.includes(i.id))
                    .map((i) => i.email)
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

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="w-12 px-6 py-4">
                  <button
                    onClick={() => {
                      if (selectedIds.length === instructors.length && instructors.length > 0) {
                        setSelectedIds([])
                      } else {
                        setSelectedIds(instructors.map((i) => i.id))
                      }
                    }}
                    className="hover:text-aerojet-blue text-slate-400 transition-colors"
                    aria-label="Select all instructors"
                  >
                    {selectedIds.length === instructors.length && instructors.length > 0 ? (
                      <CheckSquare className="text-aerojet-blue h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-4">Instructor</th>
                <th className="px-6 py-4">Employee ID</th>
                <th className="px-6 py-4">Specialization</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className="h-4 w-4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                    </td>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : instructors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50">
                      <GraduationCap className="h-6 w-6 text-slate-300" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      No instructors found
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Instructors will appear here once added to the system.
                    </p>
                  </td>
                </tr>
              ) : (
                instructors.map((instructor) => (
                  <tr
                    key={instructor.id}
                    onClick={() => router.push(`/staff/users/${instructor.id}`)}
                    className={`group cursor-pointer transition-colors duration-100 ease-out hover:bg-accent dark:hover:bg-accent ${selectedIds.includes(instructor.id) ? 'bg-aerojet-blue/5' : ''}`}
                  >
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setSelectedIds((prev) =>
                            prev.includes(instructor.id)
                              ? prev.filter((id) => id !== instructor.id)
                              : [...prev, instructor.id]
                          )
                        }}
                        className="hover:text-aerojet-blue text-slate-300 transition-colors"
                        aria-label={`Select ${instructor.profile ? `${instructor.profile.firstName} ${instructor.profile.lastName}` : instructor.email}`}
                      >
                        {selectedIds.includes(instructor.id) ? (
                          <CheckSquare className="text-aerojet-blue h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-bold text-aerojet-blue dark:bg-slate-800">
                          {instructor.profile?.firstName?.charAt(0)}
                          {instructor.profile?.lastName?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {(() => {
                              const fullName = instructor.profile
                                ? [
                                    instructor.profile.firstName,
                                    instructor.profile.middleName,
                                    instructor.profile.lastName,
                                  ]
                                    .filter(Boolean)
                                    .join(' ')
                                : instructor.email
                              return fullName
                            })()}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {instructor.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {instructor.instructorProfile?.employeeId ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {instructor.instructorProfile?.specialization ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {instructor.academyEmail ?? instructor.email}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/staff/users/${instructor.id}`}
                        className="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-bold text-aerojet-blue transition-all duration-150 ease-out hover:bg-aerojet-blue/8 hover:shadow-sm dark:text-aerojet-sky"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
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
