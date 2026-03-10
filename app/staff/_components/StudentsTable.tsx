'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, GraduationCap, RefreshCw, CheckSquare, Square, AlignJustify, CheckCircle2, AlertTriangle, Trash2 } from 'lucide-react'
import StudentDetailPanel from './StudentDetailPanel'
import BulkActionsBar from './BulkActionsBar'
import TablePagination from './TablePagination'
import { bulkUpdateUserStatus, bulkDeleteUsers } from '../actions'
import { toast } from 'sonner'

interface Student {
  id: string
  email: string
  personalEmail?: string | null
  academyEmail?: string | null
  status: string
  emailVerified?: string | null
  createdAt: string
  profile?: {
    firstName: string
    lastName: string
    phone?: string | null
    nationality?: string | null
    dateOfBirth?: string | null
    profilePhotoUrl?: string | null
  } | null
  studentProfile?: {
    studentId?: string | null
    programType?: string | null
    cohort?: string | null
    licenceCategory?: string | null
    enrolledAt?: string | null
  } | null
  wallet?: { availableBalance: number; balance: number } | null
  enrollments?: { id: string; status: string; course: { code: string; name: string } }[]
}

const STATUS_FILTERS = [
  { key: 'all', label: 'All Students' },
  { key: 'active', label: 'Active' },
  { key: 'suspended', label: 'Suspended' },
  { key: 'archived', label: 'Archived' },
]

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  SUSPENDED: 'bg-amber-100 text-amber-700',
  ARCHIVED: 'bg-slate-100 text-slate-500',
  PENDING: 'bg-blue-100 text-blue-700',
}

export default function StudentsTable({
  initialCounts,
}: {
  initialCounts: Record<string, number>
}) {
  const [students, setStudents] = useState<Student[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Student | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

  const paged = students.slice((page - 1) * perPage, page * perPage)

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: filter, ...(search && { search }) })
      const res = await fetch(`/api/staff/students?${params}`)
      const data = await res.json()
      setStudents(data.students ?? [])
      setTotal(data.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [filter, search])

  useEffect(() => {
    const t = setTimeout(fetchStudents, search ? 350 : 0)
    return () => clearTimeout(t)
  }, [fetchStudents, search])

  // Keep selected in sync after refresh
  const handleActionComplete = () => {
    fetchStudents()
    setSelected(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-aerojet-blue text-2xl font-black tracking-tight uppercase dark:text-white">
            Students
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {initialCounts.all ?? total} registered students
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchStudents}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <a
            href="/staff/students/import"
            className="bg-aerojet-blue hover:bg-aerojet-sky flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black text-white transition-all"
          >
            <GraduationCap className="h-3.5 w-3.5" />
            Import CSV
          </a>
        </div>
      </div>

      {/* Split Panel */}
      <div
        className="flex overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
        style={{ minHeight: '70vh' }}
      >
        {/* Left: List */}
        <div className="flex w-full shrink-0 flex-col border-r border-slate-100 lg:w-80 xl:w-96 dark:border-slate-800">
          {/* Search + Filters */}
          <div className="space-y-3 border-b border-slate-100 p-4 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, ID, email..."
                className="focus:ring-aerojet-sky w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-4 pl-9 text-sm outline-none focus:ring-2 dark:border-slate-700 dark:bg-slate-800/50"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
              <button
                onClick={() => {
                  if (selectedIds.length === paged.length && paged.length > 0) {
                    setSelectedIds([])
                  } else {
                    setSelectedIds(paged.map((s) => s.id))
                  }
                }}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all ${
                  selectedIds.length === paged.length && paged.length > 0
                    ? 'border-aerojet-blue bg-aerojet-blue text-white'
                    : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
                }`}
                title="Select All"
              >
                <CheckSquare className="h-3.5 w-3.5" />
              </button>
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`rounded-full border px-3 py-1 text-xs font-bold whitespace-nowrap transition-all ${
                    filter === f.key
                      ? 'border-aerojet-blue bg-aerojet-blue text-white'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Student Cards */}
          <div
            className="flex-1 divide-y divide-slate-50 overflow-y-auto"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,0.06) transparent' }}
          >
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded bg-slate-100" />
                    <div className="h-10 w-10 rounded-full bg-slate-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/3 rounded bg-slate-100" />
                      <div className="h-2.5 w-1/2 rounded bg-slate-100" />
                    </div>
                  </div>
                </div>
              ))
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                <GraduationCap className="mb-2 h-10 w-10 text-slate-200" />
                <p className="text-sm font-bold text-slate-400">No students found</p>
              </div>
            ) : (
              paged.map((student) => {
                const fullName = student.profile
                  ? `${student.profile.firstName} ${student.profile.lastName}`
                  : student.email
                const initials = student.profile
                  ? `${student.profile.firstName[0]}${student.profile.lastName[0]}`
                  : student.email[0].toUpperCase()
                const isSelected = selected?.id === student.id
                const walletBal = Number(student.wallet?.availableBalance ?? 0)
                const statusStyle = STATUS_STYLE[student.status] ?? 'bg-slate-100 text-slate-500'

                return (
                  <div
                    key={student.id}
                    className={`group relative cursor-pointer p-4 transition-all ${
                      isSelected
                        ? 'border-aerojet-blue bg-aerojet-blue/5 border-l-2'
                        : 'border-l-2 border-transparent hover:bg-slate-50'
                    } ${selectedIds.includes(student.id) ? 'bg-aerojet-blue/5' : ''}`}
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedIds((prev) =>
                              prev.includes(student.id)
                                ? prev.filter((id) => id !== student.id)
                                : [...prev, student.id]
                            )
                          }}
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded transition-all ${
                            selectedIds.includes(student.id)
                              ? 'text-aerojet-blue'
                              : 'text-slate-300 hover:text-aerojet-blue opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          {selectedIds.includes(student.id) ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>

                        <div 
                          onClick={() => setSelected(student)}
                          className="bg-aerojet-blue/10 text-aerojet-blue relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-black"
                        >
                          {student.profile?.profilePhotoUrl ? (
                            <img
                              src={student.profile.profilePhotoUrl}
                              alt={fullName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            initials
                          )}
                        </div>
                        <div onClick={() => setSelected(student)}>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            {fullName}
                          </p>
                          <p className="font-mono text-xs text-slate-400">
                            {student.studentProfile?.studentId ?? '—'}
                          </p>
                        </div>
                      </div>
                      <span
                        onClick={() => setSelected(student)}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${statusStyle}`}
                      >
                        {student.status}
                      </span>
                    </div>
                    <div
                      onClick={() => setSelected(student)}
                      className="mt-1 ml-13 flex items-center justify-between pl-13 text-xs"
                      style={{ marginLeft: '52px' }}
                    >
                      <span className="text-slate-400">
                        {student.studentProfile?.cohort ?? 'No cohort'}
                      </span>
                      <span
                        className={`font-bold ${walletBal >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
                      >
                        GHS {walletBal.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {total > 0 && (
            <TablePagination page={page} perPage={perPage} total={total} onPageChange={setPage} onPerPageChange={setPerPage} />
          )}
        </div>

        {/* Right: Detail Panel */}
        <StudentDetailPanel
          student={selected}
          onClose={() => setSelected(null)}
          onActionComplete={handleActionComplete}
        />
      </div>

      <BulkActionsBar
        selectedIds={selectedIds}
        onClear={() => setSelectedIds([])}
        actions={[
          {
            label: 'Activate',
            icon: CheckCircle2,
            variant: 'success',
            confirmTitle: 'Activate Students',
            confirmMessage: `Are you sure you want to activate ${selectedIds.length} selected students?`,
            onClick: async (ids) => {
              const res = await bulkUpdateUserStatus(ids, 'ACTIVE')
              if (res.success) {
                toast.success(`Activated ${ids.length} students`)
                fetchStudents()
              } else toast.error(res.error)
            },
          },
          {
            label: 'Suspend',
            icon: AlertTriangle,
            variant: 'warning',
            confirmTitle: 'Suspend Students',
            confirmMessage: `Are you sure you want to suspend ${selectedIds.length} selected students?`,
            onClick: async (ids) => {
              const res = await bulkUpdateUserStatus(ids, 'SUSPENDED')
              if (res.success) {
                toast.success(`Suspended ${ids.length} students`)
                fetchStudents()
              } else toast.error(res.error)
            },
          },
          {
            label: 'Delete',
            icon: Trash2,
            variant: 'danger',
            confirmTitle: 'Delete Students',
            confirmMessage: `Are you sure you want to delete ${selectedIds.length} selected students? This action is reversible.`,
            onClick: async (ids) => {
              const res = await bulkDeleteUsers(ids)
              if (res.success) {
                toast.success(`Deleted ${ids.length} students`)
                fetchStudents()
              } else toast.error(res.error)
            },
          },
        ]}
      />
    </div>
  )
}
