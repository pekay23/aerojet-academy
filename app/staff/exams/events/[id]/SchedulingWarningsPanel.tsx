'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Users, UserX, Box, ShieldAlert } from 'lucide-react'

type ConflictType = 'CANDIDATE_OVERLAP' | 'EXAMINER_OVERLAP' | 'SPARE_CAPACITY' | 'UNSCHEDULED_GUARANTEED'

interface SchedulingConflict {
  type: ConflictType
  sittingId?: string
  userId?: string
  examinerId?: string
  moduleCode?: string
  description: string
}

const ICON_MAP: Record<ConflictType, typeof AlertTriangle> = {
  CANDIDATE_OVERLAP: Users,
  EXAMINER_OVERLAP: UserX,
  SPARE_CAPACITY: Box,
  UNSCHEDULED_GUARANTEED: ShieldAlert,
}

const SEVERITY_MAP: Record<ConflictType, { bg: string; text: string; border: string }> = {
  CANDIDATE_OVERLAP: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
  EXAMINER_OVERLAP: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
  SPARE_CAPACITY: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
  UNSCHEDULED_GUARANTEED: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
}

export default function SchedulingWarningsPanel({ eventId }: { eventId: string }) {
  const [conflicts, setConflicts] = useState<SchedulingConflict[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)
    fetch(`/api/staff/exam-sittings/conflicts?eventId=${eventId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch conflicts')
        const data = await res.json()
        setConflicts(data.conflicts ?? [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [eventId])

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <AlertTriangle className="h-4 w-4 animate-pulse" />
          Checking scheduling conflictsâ€¦
        </div>
      </div>
    )
  }

  if (error) return null
  if (conflicts.length === 0) return null

  const critical = conflicts.filter((c) => c.type === 'CANDIDATE_OVERLAP' || c.type === 'EXAMINER_OVERLAP')
  const warnings = conflicts.filter((c) => c.type !== 'CANDIDATE_OVERLAP' && c.type !== 'EXAMINER_OVERLAP')

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        Scheduling Warnings
        <span className="ml-auto text-xs font-medium text-slate-400">
          {conflicts.length} issue{conflicts.length !== 1 ? 's' : ''}
        </span>
      </h2>

      <div className="space-y-2">
        {critical.map((conflict, i) => {
          const Icon = ICON_MAP[conflict.type]
          const style = SEVERITY_MAP[conflict.type]
          return (
            <div key={`critical-${i}`} className={`flex items-start gap-3 rounded-xl border p-3 ${style.bg} ${style.border}`}>
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.text}`} />
              <span className={`text-sm font-medium ${style.text}`}>
                {conflict.description}
              </span>
            </div>
          )
        })}

        {warnings.map((conflict, i) => {
          const Icon = ICON_MAP[conflict.type]
          const style = SEVERITY_MAP[conflict.type]
          return (
            <div key={`warning-${i}`} className={`flex items-start gap-3 rounded-xl border p-3 ${style.bg} ${style.border}`}>
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.text}`} />
              <span className={`text-sm ${style.text}`}>
                {conflict.description}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
