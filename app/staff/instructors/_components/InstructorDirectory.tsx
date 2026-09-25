'use client'
import { formatDate } from '@/lib/utils/formatters'

import { useState, useEffect, useCallback } from 'react'

import {
  Search,
  Users,
  Shield as _Shield,
  Clock as _Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Award,
  Loader2,
  BookOpen as _BookOpen,
  Plus as _Plus,
} from 'lucide-react'

interface Qualification {
  id: string
  qualificationType: string
  issuedBy: string
  issueDate: string
  expiryDate: string | null
  notes: string | null
}

interface RecencyEntry {
  id: string
  activityType: string
  description: string
  hours: number
  date: string
}

interface Instructor {
  id: string
  employeeId: string
  department: string | null
  specialization: string | null
  modulesQualified: string[]
  hireDate: string | null
  recencyHours: number
  recencyCompliant: boolean
  expiringQualifications: number
  user: {
    id: string
    email: string
    status: string
    profile: { firstName: string; lastName: string; phone: string | null } | null
  }
  instructorQualifications: Qualification[]
  instructorRecency: RecencyEntry[]
}

export default function InstructorDirectory() {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const fetchInstructors = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ search, limit: '50' })
      const res = await fetch(`/api/staff/instructors?${params}`)
      const json = await res.json()
      if (json.data) {
        setInstructors(json.data.instructors)
        setTotal(json.data.total)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const t = setTimeout(fetchInstructors, 300)
    return () => clearTimeout(t)
  }, [fetchInstructors])

  const compliant = instructors.filter((i) => i.recencyCompliant).length
  const nonCompliant = instructors.filter((i) => !i.recencyCompliant).length
  const expiringQuals = instructors.reduce((sum, i) => sum + i.expiringQualifications, 0)

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{total}</p>
              <p className="text-xs text-slate-500">Total Instructors</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800/50 dark:bg-green-900/10">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-200 p-2 dark:bg-green-800/40">
              <CheckCircle2 className="h-5 w-5 text-green-700 dark:text-green-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-800 dark:text-green-200">{compliant}</p>
              <p className="text-xs text-green-600 dark:text-green-400">Recency Compliant</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800/50 dark:bg-red-900/10">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-200 p-2 dark:bg-red-800/40">
              <XCircle className="h-5 w-5 text-red-700 dark:text-red-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-800 dark:text-red-200">{nonCompliant}</p>
              <p className="text-xs text-red-600 dark:text-red-400">Non-Compliant</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-900/10">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-200 p-2 dark:bg-amber-800/40">
              <AlertTriangle className="h-5 w-5 text-amber-700 dark:text-amber-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-800 dark:text-amber-200">
                {expiringQuals}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">Expiring Quals (90d)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or employee ID..."
          className="focus:border-aerojet-blue focus:ring-aerojet-blue w-full rounded-xl border border-slate-200 bg-white py-3 pr-4 pl-10 text-sm focus:ring-1 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
        />
      </div>

      {/* Instructor List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="text-aerojet-blue h-8 w-8 animate-spin" />
        </div>
      ) : instructors.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <Users className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <p className="font-bold text-slate-500">No instructors found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {instructors.map((inst) => {
            const fullName = inst.user.profile
              ? `${inst.user.profile.firstName} ${inst.user.profile.lastName}`
              : inst.user.email
            const expanded = expandedId === inst.id

            return (
              <div
                key={inst.id}
                className="rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Header Row */}
                <button
                  onClick={() => setExpandedId(expanded ? null : inst.id)}
                  className="flex w-full items-center justify-between p-5 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-aerojet-blue/10 text-aerojet-blue dark:bg-aerojet-sky/10 dark:text-aerojet-sky flex h-10 w-10 items-center justify-center rounded-full font-bold">
                      {inst.user.profile?.firstName?.[0]}
                      {inst.user.profile?.lastName?.[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{fullName}</h3>
                      <p className="text-xs text-slate-500">
                        {inst.employeeId} • {inst.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Recency Badge */}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                        inst.recencyCompliant
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      }`}
                    >
                      {inst.recencyCompliant ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {inst.recencyHours}h / 35h
                    </span>
                    {/* Quals count */}
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <Award className="h-3 w-3" />
                      {inst.instructorQualifications.length} quals
                    </span>
                    <ChevronRight
                      className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
                    />
                  </div>
                </button>

                {/* Expanded Detail */}
                {expanded && (
                  <div className="border-t border-slate-100 px-5 pb-5 dark:border-slate-800">
                    <div className="mt-4 grid gap-6 lg:grid-cols-2">
                      {/* Profile Info */}
                      <div>
                        <h4 className="mb-3 text-xs font-bold tracking-widest text-slate-400 uppercase">
                          Profile
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Department</span>
                            <span className="font-medium text-slate-900 dark:text-white">
                              {inst.department || '—'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Specialization</span>
                            <span className="font-medium text-slate-900 dark:text-white">
                              {inst.specialization || '—'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Phone</span>
                            <span className="font-medium text-slate-900 dark:text-white">
                              {inst.user.profile?.phone || '—'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Modules Qualified</span>
                            <span className="font-medium text-slate-900 dark:text-white">
                              {inst.modulesQualified.length || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Recency Summary */}
                      <div>
                        <h4 className="mb-3 text-xs font-bold tracking-widest text-slate-400 uppercase">
                          Recency (24-month rolling)
                        </h4>
                        <div className="mb-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                          <div className="mb-1 flex justify-between text-sm">
                            <span className="text-slate-600 dark:text-slate-400">
                              Update Training Hours
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {inst.recencyHours}h / 35h
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                            <div
                              className={`h-full rounded-full transition-all ${inst.recencyCompliant ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(100, (inst.recencyHours / 35) * 100)}%` }}
                            />
                          </div>
                        </div>
                        {inst.instructorRecency.length > 0 && (
                          <div className="space-y-1">
                            {inst.instructorRecency.slice(0, 5).map((r) => (
                              <div key={r.id} className="flex items-center justify-between text-xs">
                                <span className="truncate text-slate-600 dark:text-slate-400">
                                  {r.description}
                                </span>
                                <span className="ml-2 shrink-0 font-mono font-bold text-slate-900 dark:text-white">
                                  {r.hours}h
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Qualifications Table */}
                    {inst.instructorQualifications.length > 0 && (
                      <div className="mt-6">
                        <h4 className="mb-3 text-xs font-bold tracking-widest text-slate-400 uppercase">
                          Qualifications
                        </h4>
                        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                          <table className="w-full text-left text-xs">
                            <thead className="border-b bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800">
                              <tr>
                                <th className="p-3">Type</th>
                                <th className="p-3">Issued By</th>
                                <th className="p-3">Issue Date</th>
                                <th className="p-3">Expiry</th>
                                <th className="p-3">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-slate-700">
                              {inst.instructorQualifications.map((q) => {
                                const expired = q.expiryDate && new Date(q.expiryDate) < new Date()
                                const expiringSoon =
                                  q.expiryDate &&
                                  !expired &&
                                  new Date(q.expiryDate) <=
                                    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
                                return (
                                  <tr key={q.id}>
                                    <td className="p-3 font-medium text-slate-900 dark:text-white">
                                      {q.qualificationType}
                                    </td>
                                    <td className="p-3 text-slate-600 dark:text-slate-400">
                                      {q.issuedBy}
                                    </td>
                                    <td className="p-3 text-slate-600 dark:text-slate-400">
                                      {formatDate(q.issueDate)}
                                    </td>
                                    <td className="p-3 text-slate-600 dark:text-slate-400">
                                      {q.expiryDate ? formatDate(q.expiryDate) : 'N/A'}
                                    </td>
                                    <td className="p-3">
                                      <span
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                          expired
                                            ? 'bg-red-100 text-red-700'
                                            : expiringSoon
                                              ? 'bg-amber-100 text-amber-700'
                                              : 'bg-green-100 text-green-700'
                                        }`}
                                      >
                                        {expired ? 'EXPIRED' : expiringSoon ? 'EXPIRING' : 'VALID'}
                                      </span>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
