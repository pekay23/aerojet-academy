'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Download,
  RefreshCw,
  UserCheck,
  Clock,
  CreditCard,
  ShieldCheck,
  CheckSquare,
  Square,
  Trash2,
} from 'lucide-react'
import { bulkUpdateUserStatus, bulkDeleteUsers } from '../actions'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import ApplicantDetailDrawer from './ApplicantDetailDrawer'
import BulkActionsBar from './BulkActionsBar'
import TablePagination from './TablePagination'

interface Applicant {
  id: string
  email: string
  registrationCode?: string | null
  registrationPaid: boolean
  createdAt: string
  profile?: {
    firstName: string
    lastName: string
    phone?: string | null
    nationality?: string | null
    dateOfBirth?: string | null
    idDocumentUrl?: string | null
    profilePhotoUrl?: string | null
  } | null
  payments?: any[]
}

const TABS = [
  { key: 'all', label: 'All Pending' },
  { key: 'pending_payment', label: 'Pending Payment' },
  { key: 'pending_approval', label: 'Pending Approval' },
]

interface Counts {
  all: number
  pending_payment: number
  pending_approval: number
  [key: string]: number
}

export default function ApplicantsQueue({ initialCounts }: { initialCounts: Counts }) {
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Applicant | null>(null)
  const [counts, setCounts] = useState(initialCounts)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

  const paged = applicants.slice((page - 1) * perPage, page * perPage)

  const fetchApplicants = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        status: tab,
        ...(search && { search }),
        limit: '50', // Increase limit for queue
      })
      const res = await fetch(`/api/staff/applicants?${params}`)
      const data = await res.json()
      setApplicants(data.applicants ?? [])
      setTotal(data.total ?? 0)
      if (data.counts) {
        setCounts(data.counts)
      }
    } finally {
      setLoading(false)
    }
  }, [tab, search])

  useEffect(() => {
    const t = setTimeout(fetchApplicants, search ? 400 : 0)
    return () => clearTimeout(t)
  }, [fetchApplicants, search])

  const handleApproved = (id: string) => {
    setApplicants((prev) => prev.filter((a) => a.id !== id))
    setCounts((prev) => ({
      ...prev,
      all: Math.max(0, prev.all - 1),
      pending_approval: Math.max(0, prev.pending_approval - 1),
    }))
  }

  const handleRejected = (id: string) => {
    const applicant = applicants.find((a) => a.id === id)
    setApplicants((prev) => prev.filter((a) => a.id !== id))
    setCounts((prev) => {
      const newCounts = { ...prev, all: Math.max(0, prev.all - 1) }
      if (applicant?.registrationPaid) {
        newCounts.pending_approval = Math.max(0, prev.pending_approval - 1)
      } else {
        newCounts.pending_payment = Math.max(0, prev.pending_payment - 1)
      }
      return newCounts
    })
  }

  const statCards = [
    {
      label: 'Total Pending',
      value: counts.all ?? 0,
      icon: Clock,
      color: 'text-aerojet-sky',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Fee Unpaid',
      value: counts.pending_payment ?? 0,
      icon: CreditCard,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Pending Approval',
      value: counts.pending_approval ?? 0,
      icon: ShieldCheck,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ]

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-aerojet-blue text-2xl font-black tracking-tight uppercase dark:text-white">
              Applicant Queue
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Review and approve new applicant registrations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchApplicants}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-4">
          {statCards.map((s) => {
            const Icon = s.icon
            return (
              <div
                key={s.label}
                className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div
                  className={`h-11 w-11 rounded-xl ${s.bg} flex shrink-0 items-center justify-center`}
                >
                  <Icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-800 dark:text-slate-200">
                    {s.value}
                  </p>
                  <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    {s.label}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Table Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Toolbar */}
          <div className="flex flex-col items-start justify-between gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center dark:border-slate-800">
            {/* Tabs */}
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`relative rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    tab === t.key
                      ? 'text-aerojet-blue dark:text-white'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {tab === t.key && (
                    <motion.div
                      layoutId="applicants-tab"
                      className="absolute inset-0 bg-white shadow-sm dark:bg-slate-700"
                      style={{ borderRadius: 8, zIndex: 0 }}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">{t.label}</span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search applicant..."
                className="focus:ring-aerojet-sky w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-4 pl-9 text-sm outline-none focus:ring-2 dark:border-slate-700 dark:bg-slate-800/50"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                  <th className="w-12 px-6 py-3">
                    <button
                      onClick={() => {
                        if (selectedIds.length === paged.length && paged.length > 0) {
                          setSelectedIds([])
                        } else {
                          setSelectedIds(paged.map((a) => a.id))
                        }
                      }}
                      className="text-slate-400 hover:text-aerojet-blue transition-colors"
                    >
                      {selectedIds.length === paged.length && paged.length > 0 ? (
                        <CheckSquare className="h-4 w-4 text-aerojet-blue" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  {['Applicant', 'Registration Code', 'Date Applied', 'Fee Status', 'Action'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-[10px] font-black tracking-wider text-slate-400 uppercase"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className="h-4 w-4 animate-pulse rounded bg-slate-100" />
                    </td>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                  ))
                ) : applicants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <UserCheck className="mx-auto mb-3 h-10 w-10 text-slate-200" />
                      <p className="text-sm font-bold text-slate-400">No applicants found</p>
                    </td>
                  </tr>
                ) : (
                  paged.map((applicant) => {
                    const fullName = applicant.profile
                      ? `${applicant.profile.firstName} ${applicant.profile.lastName}`
                      : applicant.email
                    const initials = applicant.profile
                      ? `${applicant.profile.firstName[0]}${applicant.profile.lastName[0]}`
                      : applicant.email[0].toUpperCase()
                    const dateApplied = new Date(applicant.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })

                    return (
                      <tr
                        key={applicant.id}
                        className={`cursor-pointer transition-colors hover:bg-slate-50 dark:bg-slate-800/50 ${selectedIds.includes(applicant.id) ? 'bg-aerojet-blue/5' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedIds((prev) =>
                                prev.includes(applicant.id)
                                  ? prev.filter((id) => id !== applicant.id)
                                  : [...prev, applicant.id]
                              )
                            }}
                            className="text-slate-300 transition-colors hover:text-aerojet-blue"
                          >
                            {selectedIds.includes(applicant.id) ? (
                              <CheckSquare className="h-4 w-4 text-aerojet-blue" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4" onClick={() => setSelected(applicant)}>
                          <div className="flex items-center gap-3">
                            <div className="bg-aerojet-blue/10 text-aerojet-blue relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-black">
                              {applicant.profile?.profilePhotoUrl ? (
                                <img
                                  src={applicant.profile.profilePhotoUrl}
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
                              <p className="text-xs text-slate-400">{applicant.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600 dark:text-slate-400">
                            {applicant.registrationCode ?? '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                          {dateApplied}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                              applicant.registrationPaid
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {applicant.registrationPaid ? 'Paid' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelected(applicant)
                            }}
                            className="text-aerojet-sky text-xs font-bold hover:underline"
                          >
                            Review →
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {total > 0 && (
            <TablePagination page={page} perPage={perPage} total={total} onPageChange={setPage} onPerPageChange={setPerPage} />
          )}
        </div>
      </div>

      {/* Drawer */}
      {selected && (
        <ApplicantDetailDrawer
          applicant={selected}
          onClose={() => setSelected(null)}
          onApproved={handleApproved}
          onRejected={handleRejected}
        />
      )}
      {/* Bulk Actions */}
      <BulkActionsBar
        selectedIds={selectedIds}
        onClear={() => setSelectedIds([])}
        actions={[
          {
            label: 'Approve',
            icon: UserCheck,
            variant: 'success',
            confirmTitle: 'Approve Applicants',
            confirmMessage: `Are you sure you want to approve ${selectedIds.length} selected applicants?`,
            onClick: async (ids) => {
              // Note: Approval might need more logic like role assignment, but for now we follow status update
              const res = await bulkUpdateUserStatus(ids, 'ACTIVE')
              if (res.success) {
                toast.success(`Approved ${ids.length} applicants`)
                fetchApplicants()
              } else toast.error(res.error)
            },
          },
          {
            label: 'Delete',
            icon: Trash2,
            variant: 'danger',
            confirmTitle: 'Delete Applicants',
            confirmMessage: `Are you sure you want to delete ${selectedIds.length} selected applicants?`,
            onClick: async (ids) => {
              const res = await bulkDeleteUsers(ids)
              if (res.success) {
                toast.success(`Deleted ${ids.length} applicants`)
                fetchApplicants()
              } else toast.error(res.error)
            },
          },
        ]}
      />
    </>
  )
}
