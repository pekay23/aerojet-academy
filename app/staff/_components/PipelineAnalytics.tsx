'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BarChart3,
  _TrendingUp,
  _Users,
  _CheckCircle2,
  _XCircle,
  _ArrowRight,
  Loader2,
} from 'lucide-react'

interface FunnelStage {
  stage: string
  label: string
  count: number
  percent: number
}

interface PipelineData {
  total: number
  funnel: FunnelStage[]
  programmeBreakdown: { programme: string; count: number }[]
  outcomes: { enrolled: number; rejected: number; withdrawn: number; conversionRate: number }
  recentActivity: { newApplications: number; newEnrollments: number }
  cycles: { id: string; name: string }[]
}

const STAGE_COLORS: Record<string, string> = {
  REGISTERED: 'bg-slate-400',
  PAYMENT_PENDING: 'bg-amber-400',
  PAYMENT_VERIFIED: 'bg-blue-400',
  APTITUDE_PENDING: 'bg-purple-400',
  APTITUDE_COMPLETED: 'bg-purple-500',
  SHORTLISTED: 'bg-indigo-500',
  INTERVIEW_SCHEDULED: 'bg-cyan-500',
  INTERVIEW_COMPLETED: 'bg-cyan-600',
  SELECTED: 'bg-emerald-400',
  MEDICAL_PENDING: 'bg-rose-400',
  MEDICAL_SUBMITTED: 'bg-rose-500',
  MEDICAL_CLEARED: 'bg-green-500',
  ENROLLED: 'bg-green-600',
  REJECTED: 'bg-red-500',
  WITHDRAWN: 'bg-slate-500',
}

export default function PipelineAnalytics() {
  const [data, setData] = useState<PipelineData | null>(null)
  const [loading, setLoading] = useState(true)
  const [cycleId, setCycleId] = useState('')

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const params = cycleId ? `?intakeCycleId=${cycleId}` : ''
      const res = await fetch(`/api/staff/admissions/pipeline${params}`)
      const json = await res.json()
      if (json.data) setData(json.data)
    } catch { /* silent */ } finally { setLoading(false) }
  }, [cycleId])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetch_() }, [fetch_])

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-aerojet-blue" />
      </div>
    )
  }

  const maxCount = Math.max(1, ...data.funnel.map(s => s.count))

  return (
    <div className="space-y-6">
      {/* Header + Cycle Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
            <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white">Admissions Pipeline</h3>
            <p className="text-[11px] text-slate-400">{data.total} total applications</p>
          </div>
        </div>
        {data.cycles.length > 0 && (
          <select
            value={cycleId}
            onChange={e => setCycleId(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="">All Intakes</option>
            {data.cycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-bold text-slate-400">Total</p>
          <p className="text-xl font-black text-slate-900 dark:text-white">{data.total}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 dark:border-green-800/50 dark:bg-green-900/10">
          <p className="text-xs font-bold text-green-600">Enrolled</p>
          <p className="text-xl font-black text-green-800 dark:text-green-200">{data.outcomes.enrolled}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800/50 dark:bg-red-900/10">
          <p className="text-xs font-bold text-red-600">Rejected</p>
          <p className="text-xl font-black text-red-800 dark:text-red-200">{data.outcomes.rejected}</p>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-800/50 dark:bg-indigo-900/10">
          <p className="text-xs font-bold text-indigo-600">Conversion</p>
          <p className="text-xl font-black text-indigo-800 dark:text-indigo-200">{data.outcomes.conversionRate}%</p>
        </div>
      </div>

      {/* Funnel Bars */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Stage Distribution</h4>
        <div className="space-y-2">
          {data.funnel.filter(s => s.count > 0).map(stage => (
            <div key={stage.stage} className="flex items-center gap-3">
              <span className="w-36 truncate text-xs font-medium text-slate-600 dark:text-slate-400">{stage.label}</span>
              <div className="relative h-6 flex-1 rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all ${STAGE_COLORS[stage.stage] || 'bg-slate-400'}`}
                  style={{ width: `${Math.max(2, (stage.count / maxCount) * 100)}%` }}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                  {stage.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Programme Breakdown */}
      {data.programmeBreakdown.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">By Programme</h4>
          <div className="flex flex-wrap gap-3">
            {data.programmeBreakdown.map(p => (
              <div key={p.programme} className="rounded-lg bg-slate-50 px-4 py-2 dark:bg-slate-800">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{p.count}</p>
                <p className="text-[10px] font-medium text-slate-500">{p.programme || 'Unset'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="flex gap-3">
        <div className="flex-1 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-800/50 dark:bg-blue-900/10">
          <p className="text-xs font-bold text-blue-600">New Apps (7d)</p>
          <p className="text-lg font-black text-blue-800 dark:text-blue-200">{data.recentActivity.newApplications}</p>
        </div>
        <div className="flex-1 rounded-xl border border-green-200 bg-green-50 p-3 dark:border-green-800/50 dark:bg-green-900/10">
          <p className="text-xs font-bold text-green-600">Enrolled (7d)</p>
          <p className="text-lg font-black text-green-800 dark:text-green-200">{data.recentActivity.newEnrollments}</p>
        </div>
      </div>
    </div>
  )
}
