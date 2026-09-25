'use client'
import { formatDate } from '@/lib/utils/formatters'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  FileSignature,
  CheckCircle2,
  XOctagon,
  Clock,
  PenLine,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Search,
  Shield,
} from 'lucide-react'

type BondingStatus = 'ISSUED' | 'SIGNED' | 'IN_PROGRESS' | 'FULFILLED' | 'BREACHED'

interface Contract {
  id: string
  status: BondingStatus
  issuedAt: string
  signedAt: string | null
  startDate: string | null
  endDate: string | null
  facilityName: string | null
  notes: string | null
  application: {
    programmeChoice: string
    fundingType: string
    user: {
      id: string
      email: string
      profile: { firstName: string; lastName: string } | null
    }
  }
  studentProfile: { studentId: string } | null
}

const STATUS_CONFIG: Record<
  BondingStatus,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  ISSUED: {
    label: 'Issued',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    icon: Clock,
  },
  SIGNED: {
    label: 'Signed',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    icon: PenLine,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    icon: Briefcase,
  },
  FULFILLED: {
    label: 'Fulfilled',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    icon: CheckCircle2,
  },
  BREACHED: {
    label: 'Breached',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    icon: XOctagon,
  },
}

const VALID_TRANSITIONS: Record<BondingStatus, BondingStatus[]> = {
  ISSUED: ['SIGNED'],
  SIGNED: ['IN_PROGRESS'],
  IN_PROGRESS: ['FULFILLED', 'BREACHED'],
  FULFILLED: [],
  BREACHED: [],
}

const STAT_CARDS: {
  key: BondingStatus
  label: string
  borderColor: string
  bgColor: string
  iconBg: string
  iconColor: string
  textColor: string
  subColor: string
}[] = [
  {
    key: 'ISSUED',
    label: 'Issued',
    borderColor: 'border-amber-200 dark:border-amber-800/50',
    bgColor: 'bg-amber-50 dark:bg-amber-900/10',
    iconBg: 'bg-amber-200 dark:bg-amber-800/50',
    iconColor: 'text-amber-700 dark:text-amber-300',
    textColor: 'text-amber-800 dark:text-amber-200',
    subColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    key: 'SIGNED',
    label: 'Signed',
    borderColor: 'border-blue-200 dark:border-blue-800/50',
    bgColor: 'bg-blue-50 dark:bg-blue-900/10',
    iconBg: 'bg-blue-200 dark:bg-blue-800/50',
    iconColor: 'text-blue-700 dark:text-blue-300',
    textColor: 'text-blue-800 dark:text-blue-200',
    subColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    key: 'IN_PROGRESS',
    label: 'In Progress',
    borderColor: 'border-purple-200 dark:border-purple-800/50',
    bgColor: 'bg-purple-50 dark:bg-purple-900/10',
    iconBg: 'bg-purple-200 dark:bg-purple-800/50',
    iconColor: 'text-purple-700 dark:text-purple-300',
    textColor: 'text-purple-800 dark:text-purple-200',
    subColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    key: 'FULFILLED',
    label: 'Fulfilled',
    borderColor: 'border-green-200 dark:border-green-800/50',
    bgColor: 'bg-green-50 dark:bg-green-900/10',
    iconBg: 'bg-green-200 dark:bg-green-800/50',
    iconColor: 'text-green-700 dark:text-green-300',
    textColor: 'text-green-800 dark:text-green-200',
    subColor: 'text-green-600 dark:text-green-400',
  },
  {
    key: 'BREACHED',
    label: 'Breached',
    borderColor: 'border-red-200 dark:border-red-800/50',
    bgColor: 'bg-red-50 dark:bg-red-900/10',
    iconBg: 'bg-red-200 dark:bg-red-800/50',
    iconColor: 'text-red-700 dark:text-red-300',
    textColor: 'text-red-800 dark:text-red-200',
    subColor: 'text-red-600 dark:text-red-400',
  },
]

const STAT_ICONS: Record<BondingStatus, React.ComponentType<{ className?: string }>> = {
  ISSUED: Clock,
  SIGNED: PenLine,
  IN_PROGRESS: Briefcase,
  FULFILLED: CheckCircle2,
  BREACHED: XOctagon,
}

export default function BondingContractsTable({
  initialContracts,
  initialTotal,
  statusCounts,
}: {
  initialContracts: Contract[]
  initialTotal: number
  statusCounts: Record<string, number>
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [contracts, setContracts] = useState(initialContracts)
  const [total, setTotal] = useState(initialTotal)
  const [filter, setFilter] = useState<string>(searchParams.get('status') || 'ALL')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{
    facilityName: string
    notes: string
    signedAt: string
    startDate: string
    endDate: string
  }>({ facilityName: '', notes: '', signedAt: '', startDate: '', endDate: '' })
  const [saving, setSaving] = useState(false)

  const limit = 20
  const totalPages = Math.ceil(total / limit)

  const fetchContracts = useCallback(async (f: string, s: string, p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(p))
      params.set('limit', String(limit))
      if (f !== 'ALL') params.set('status', f)
      if (s.trim()) params.set('search', s.trim())

      const res = await fetch(`/api/staff/admissions/bonding?${params}`)
      const data = await res.json()
      if (data.success) {
        setContracts(data.data)
        setTotal(data.meta.total)
      }
    } catch {
      toast.error('Failed to load contracts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeout = setTimeout(
      () => {
        fetchContracts(filter, search, page)
      },
      search ? 300 : 0
    )
    return () => clearTimeout(timeout)
  }, [filter, search, page, fetchContracts])

  const handleExpand = (contract: Contract) => {
    if (expandedId === contract.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(contract.id)
    setEditForm({
      facilityName: contract.facilityName || '',
      notes: contract.notes || '',
      signedAt: contract.signedAt ? contract.signedAt.slice(0, 10) : '',
      startDate: contract.startDate ? contract.startDate.slice(0, 10) : '',
      endDate: contract.endDate ? contract.endDate.slice(0, 10) : '',
    })
  }

  const handleStatusChange = async (contractId: string, newStatus: BondingStatus) => {
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        status: newStatus,
        facilityName: editForm.facilityName || null,
        notes: editForm.notes || null,
      }
      if (editForm.signedAt) payload.signedAt = new Date(editForm.signedAt).toISOString()
      if (editForm.startDate) payload.startDate = new Date(editForm.startDate).toISOString()
      if (editForm.endDate) payload.endDate = new Date(editForm.endDate).toISOString()

      const res = await fetch(`/api/staff/admissions/bonding/${contractId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Contract updated to ${STATUS_CONFIG[newStatus].label}`)
        setExpandedId(null)
        fetchContracts(filter, search, page)
        router.refresh()
      } else {
        toast.error(data.error || 'Failed to update contract')
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveFields = async (contractId: string) => {
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        facilityName: editForm.facilityName || null,
        notes: editForm.notes || null,
      }
      if (editForm.signedAt) payload.signedAt = new Date(editForm.signedAt).toISOString()
      if (editForm.startDate) payload.startDate = new Date(editForm.startDate).toISOString()
      if (editForm.endDate) payload.endDate = new Date(editForm.endDate).toISOString()

      const res = await fetch(`/api/staff/admissions/bonding/${contractId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Contract details saved')
        fetchContracts(filter, search, page)
      } else {
        toast.error(data.error || 'Failed to save')
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const getName = (c: Contract) => {
    const p = c.application.user.profile
    return p
      ? `${p.firstName} ${p.lastName}`.trim() || c.application.user.email
      : c.application.user.email
  }

  const totalAll = Object.values(statusCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {STAT_CARDS.map((card) => {
          const Icon = STAT_ICONS[card.key]
          return (
            <div
              key={card.key}
              className={`rounded-xl border ${card.borderColor} ${card.bgColor} p-4`}
            >
              <div className="flex items-center gap-3">
                <div className={`rounded-lg ${card.iconBg} p-2`}>
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${card.textColor}`}>
                    {statusCounts[card.key] || 0}
                  </p>
                  <p className={`text-xs font-medium ${card.subColor}`}>{card.label}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filter Tabs + Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'ALL', label: `All (${totalAll})` },
            ...STAT_CARDS.map((c) => ({
              key: c.key,
              label: `${c.label} (${statusCounts[c.key] || 0})`,
            })),
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setFilter(tab.key)
                setPage(1)
              }}
              className={`rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${
                filter === tab.key
                  ? 'bg-aerojet-blue dark:bg-aerojet-sky text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, email, ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full rounded-lg border border-slate-200 py-2 pr-3 pl-9 text-sm sm:w-64 dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="border-aerojet-blue h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
          </div>
        ) : contracts.length === 0 ? (
          <div className="py-16 text-center">
            <Shield className="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-500">No bonding contracts found.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="hidden border-b border-slate-100 bg-slate-50 px-5 py-3 md:grid md:grid-cols-7 md:gap-4 dark:border-slate-800 dark:bg-slate-800/50">
              <span className="col-span-2 text-xs font-bold text-slate-500 uppercase">Student</span>
              <span className="text-xs font-bold text-slate-500 uppercase">Student ID</span>
              <span className="text-xs font-bold text-slate-500 uppercase">Programme</span>
              <span className="text-xs font-bold text-slate-500 uppercase">Status</span>
              <span className="text-xs font-bold text-slate-500 uppercase">Issued</span>
              <span className="text-xs font-bold text-slate-500 uppercase">Actions</span>
            </div>

            {contracts.map((contract) => {
              const cfg = STATUS_CONFIG[contract.status]
              const BadgeIcon = cfg.icon
              const isExpanded = expandedId === contract.id
              const nextStatuses = VALID_TRANSITIONS[contract.status]

              return (
                <div
                  key={contract.id}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                >
                  {/* Row */}
                  <div className="grid grid-cols-1 gap-2 px-5 py-4 md:grid-cols-7 md:items-center md:gap-4">
                    <div className="col-span-2 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                        <FileSignature className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {getName(contract)}
                        </p>
                        <p className="text-xs text-slate-500">{contract.application.user.email}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {contract.studentProfile?.studentId || '---'}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {contract.application.programmeChoice.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${cfg.color}`}
                      >
                        <BadgeIcon className="h-3.5 w-3.5" />
                        {cfg.label}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {formatDate(contract.issuedAt)}
                      </span>
                    </div>
                    <div>
                      {nextStatuses.length > 0 ? (
                        <button
                          onClick={() => handleExpand(contract)}
                          className="bg-aerojet-blue hover:bg-aerojet-blue/90 rounded-lg px-3 py-1.5 text-xs font-bold text-white"
                        >
                          {isExpanded ? 'Close' : 'Manage'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleExpand(contract)}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300"
                        >
                          {isExpanded ? 'Close' : 'View'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Form */}
                  {isExpanded && (
                    <div className="border-aerojet-blue/20 bg-aerojet-blue/5 dark:border-aerojet-sky/20 dark:bg-aerojet-sky/5 border-t px-5 py-5">
                      <h4 className="text-aerojet-blue dark:text-aerojet-sky mb-4 font-bold">
                        Contract Details
                      </h4>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                            Facility Name
                          </label>
                          <input
                            type="text"
                            className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                            value={editForm.facilityName}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, facilityName: e.target.value }))
                            }
                            placeholder="e.g. Aerojet Engineering Ltd"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                            Date Signed
                          </label>
                          <input
                            type="date"
                            className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                            value={editForm.signedAt}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, signedAt: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                            Start Date
                          </label>
                          <input
                            type="date"
                            className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                            value={editForm.startDate}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, startDate: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                            End Date
                          </label>
                          <input
                            type="date"
                            className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                            value={editForm.endDate}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, endDate: e.target.value }))
                            }
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                            Notes
                          </label>
                          <textarea
                            className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                            rows={2}
                            value={editForm.notes}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, notes: e.target.value }))
                            }
                            placeholder="Any additional notes..."
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        {nextStatuses.map((ns) => {
                          const nsCfg = STATUS_CONFIG[ns]
                          const NsIcon = nsCfg.icon
                          const isDestructive = ns === 'BREACHED'
                          return (
                            <button
                              key={ns}
                              onClick={() => handleStatusChange(contract.id, ns)}
                              disabled={saving}
                              className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-bold text-white disabled:opacity-50 ${
                                isDestructive
                                  ? 'bg-red-600 hover:bg-red-700'
                                  : ns === 'FULFILLED'
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-aerojet-blue hover:bg-aerojet-blue/90'
                              }`}
                            >
                              <NsIcon className="h-4 w-4" />
                              Mark as {nsCfg.label}
                            </button>
                          )
                        })}
                        {nextStatuses.length === 0 && (
                          <button
                            onClick={() => handleSaveFields(contract.id)}
                            disabled={saving}
                            className="bg-aerojet-blue hover:bg-aerojet-blue/90 flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
                          >
                            Save Notes
                          </button>
                        )}
                        {nextStatuses.length > 0 && (
                          <button
                            onClick={() => handleSaveFields(contract.id)}
                            disabled={saving}
                            className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300"
                          >
                            Save Without Status Change
                          </button>
                        )}
                        <button
                          onClick={() => setExpandedId(null)}
                          className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
