'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, ShieldAlert, Filter } from 'lucide-react'

interface Violation {
  id: string
  type: string
  severity: string
  detail: string | null
  createdAt: string
  reviewedAt: string | null
  session: { id: string; bankId: string }
  student: { firstName: string | null; lastName: string | null; email: string | null }
}

export function ProctorDashboardClient() {
  const [violations, setViolations] = useState<Violation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ severity: '', reviewed: '' })

  useEffect(() => {
    const fetchViolations = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (filter.severity) params.set('severity', filter.severity)
        if (filter.reviewed) params.set('reviewed', filter.reviewed)

        const res = await fetch(`/api/exams/proctoring/violations?${params}`)
        const json = await res.json()
        if (json.success) {
          setViolations(json.data.violations)
        }
      } catch {
        console.error('Failed to fetch violations')
      } finally {
        setLoading(false)
      }
    }
    fetchViolations()
  }, [filter])

  const severityColors: Record<string, string> = {
    WARNING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    NOTICE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Proctor Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Monitor exam violations and review flagged events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-aerojet-blue" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <Filter className="h-5 w-5 text-slate-400" />
        <select
          value={filter.severity}
          onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="">All Severities</option>
          <option value="WARNING">Warning</option>
          <option value="NOTICE">Notice</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <select
          value={filter.reviewed}
          onChange={(e) => setFilter({ ...filter, reviewed: e.target.value })}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="">All Status</option>
          <option value="false">Unreviewed</option>
          <option value="true">Reviewed</option>
        </select>
      </div>

      {/* Violations Table */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-aerojet-blue border-t-transparent" />
        </div>
      ) : violations.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
          <p className="text-lg font-medium text-slate-600 dark:text-slate-400">No violations found</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">All exams are proceeding normally.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="min-w-full divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Time</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Student</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Type</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Severity</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Detail</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {violations.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                    {new Date(v.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                    {v.student.firstName} {v.student.lastName}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{v.type}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${severityColors[v.severity] || 'bg-slate-100 text-slate-800'}`}>
                      {v.severity}
                    </span>
                  </td>
                  <td className="max-w-xs truncate px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                    {v.detail || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {v.reviewedAt ? (
                      <span className="text-green-600 dark:text-green-400">Reviewed</span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
