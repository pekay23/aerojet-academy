'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Filter } from 'lucide-react'
import Link from 'next/link'

const PROGRAMME_LABELS: Record<string, string> = {
  FULL_TIME_4YEAR: '4-Year B1/B2',
  FULL_TIME_2YEAR: '2-Year B1',
  MILITARY_1YEAR: 'Military/Industry',
  MODULAR: 'Modular',
  EXAM_ONLY: 'Exam Only',
}

interface PipelineFiltersProps {
  intakeCycles: { id: string; name: string; isActive: boolean }[]
}

export default function PipelineFilters({ intakeCycles }: PipelineFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const cycle = searchParams.get('cycle') ?? ''
  const programme = searchParams.get('programme') ?? ''

  function navigate(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    const qs = params.toString()
    router.push(qs ? `/staff/admissions?${qs}` : '/staff/admissions')
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-slate-400" />
        <select
          value={cycle}
          onChange={(e) => navigate('cycle', e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm transition-colors focus:border-aerojet-blue focus:outline-none focus:ring-2 focus:ring-aerojet-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <option value="">All Intake Cycles</option>
          {intakeCycles.map((ic) => (
            <option key={ic.id} value={ic.id}>
              {ic.name}{ic.isActive ? ' (Active)' : ''}
            </option>
          ))}
        </select>
      </div>
      <div>
        <select
          value={programme}
          onChange={(e) => navigate('programme', e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm transition-colors focus:border-aerojet-blue focus:outline-none focus:ring-2 focus:ring-aerojet-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <option value="">All Programmes</option>
          {Object.entries(PROGRAMME_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {(cycle || programme) && (
        <Link
          href="/staff/admissions"
          className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Clear Filters
        </Link>
      )}
    </div>
  )
}
