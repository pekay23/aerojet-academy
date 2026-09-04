'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  Filter,
  CheckSquare,
  Square,
  AlertCircle,
  Edit2,
  ChevronDown,
  BarChart3,
  Users,
  _ClipboardList,
} from 'lucide-react'
import { useSort, SortHeader } from '@/lib/hooks/useSort'

interface ScoreData {
  compositeScore: number
  aptitudeScore: number
  aptitudePercentile: number | null
  profileScore: number
  referralScore: number
  experienceScore: number
  interviewScore: number | null
  interviewEvaluatorCount: number
  isAutoShortlist: boolean
  isAutoReject: boolean
  mathRawScore: number | null
  mathPercentile: number | null
  verbalRawScore: number | null
  verbalPercentile: number | null
  engineeringRawScore: number | null
  engineeringPercentile: number | null
  reasoningRawScore: number | null
  reasoningPercentile: number | null
}

interface ApplicationRow {
  id: string
  applicantName: string
  email: string
  programmeChoice: string
  intakeCycle: string
  cvUrl: string | null
  scores: ScoreData
  metadata: any
}

function PercentileBar({ label, percentile, raw }: { label: string; percentile: number | null; raw?: string }) {
  if (percentile == null) return null
  const color =
    percentile >= 75 ? 'bg-green-500' : percentile >= 50 ? 'bg-blue-500' : percentile >= 25 ? 'bg-amber-500' : 'bg-red-500'
  const textColor =
    percentile >= 75
      ? 'text-green-700 dark:text-green-400'
      : percentile >= 50
        ? 'text-blue-700 dark:text-blue-400'
        : percentile >= 25
          ? 'text-amber-700 dark:text-amber-400'
          : 'text-red-700 dark:text-red-400'

  return (
    <div className="flex items-center gap-2">
      <span className="w-20 text-xs text-slate-500">{label}</span>
      <div className="relative h-2 flex-1 rounded-full bg-slate-200 dark:bg-slate-700">
        <div className={`absolute left-0 top-0 h-2 rounded-full ${color}`} style={{ width: `${Math.min(percentile, 100)}%` }} />
      </div>
      <span className={`w-10 text-right text-xs font-bold ${textColor}`}>P{Math.round(percentile)}</span>
      {raw && <span className="w-8 text-right text-xs text-slate-400">{raw}</span>}
    </div>
  )
}

function PercentileBadge({ value }: { value: number | null }) {
  if (value == null) return <span className="text-xs text-slate-400">--</span>
  const color =
    value >= 75
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : value >= 50
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        : value >= 25
          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${color}`}>P{Math.round(value)}</span>
  )
}

export default function ShortlistingTable({ data }: { data: ApplicationRow[] }) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [processing, setProcessing] = useState(false)
  const [editingScoreId, setEditingScoreId] = useState<string | null>(null)
  const [tempScore, setTempScore] = useState<string>('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredData = data.filter(
    (row) =>
      row.applicantName.toLowerCase().includes(search.toLowerCase()) ||
      row.email.toLowerCase().includes(search.toLowerCase()) ||
      row.programmeChoice.toLowerCase().includes(search.toLowerCase())
  )

  const { items: sortedData, requestSort, sortConfig } = useSort(filteredData)
  const displayData = sortedData

  const toggleSelectAll = () => {
    if (selectedIds.size === displayData.length && displayData.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(displayData.map((d) => d.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleAction = async (action: 'SHORTLIST' | 'REJECT', ids: string[]) => {
    if (ids.length === 0) return
    let reason = ''
    if (action === 'REJECT') {
      const input = prompt('Enter rejection reason (optional):')
      if (input === null) return
      reason = input
    }

    if (!confirm(`Are you sure you want to ${action.toLowerCase()} ${ids.length} candidate(s)?`)) return

    setProcessing(true)
    try {
      const res = await fetch('/api/staff/admissions/shortlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationIds: ids, action, reason }),
      })

      if (res.ok) {
        setSelectedIds(new Set())
        router.refresh()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to process applications')
      }
    } finally {
      setProcessing(false)
    }
  }

  const handleSaveScore = async (id: string) => {
    const score = parseInt(tempScore)
    if (isNaN(score) || score < 0 || score > 100) {
      toast.error('Score must be between 0 and 100')
      return
    }

    try {
      const res = await fetch(`/api/staff/admissions/shortlist/${id}/score`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experienceScore: score }),
      })
      if (res.ok) {
        setEditingScoreId(null)
        router.refresh()
      }
    } catch (_e) {
      toast.error('Failed to load shortlist')
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-4 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search applicants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
            <span className="mr-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              {selectedIds.size} selected
            </span>
            <button
              onClick={() => handleAction('REJECT', Array.from(selectedIds))}
              disabled={processing}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400"
            >
              <XCircle className="h-4 w-4" />
              Reject Selected
            </button>
            <button
              onClick={() => handleAction('SHORTLIST', Array.from(selectedIds))}
              disabled={processing}
              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              Shortlist Selected
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">
                <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-600">
                  {selectedIds.size === displayData.length && displayData.length > 0 ? (
                    <CheckSquare className="h-5 w-5 text-aerojet-blue" />
                  ) : (
                    <Square className="h-5 w-5" />
                  )}
                </button>
              </th>
              <SortHeader label="Candidate" sortKey="applicantName" currentSort={sortConfig} onSort={requestSort} className="px-4 py-3 font-medium" />
              <SortHeader label="Programme" sortKey="programmeChoice" currentSort={sortConfig} onSort={requestSort} className="px-4 py-3 font-medium" />
              <SortHeader label="Aptitude" sortKey="scores.aptitudeScore" currentSort={sortConfig} onSort={requestSort} className="px-4 py-3 font-medium" align="right" />
              <SortHeader label="Percentile" sortKey="scores.aptitudePercentile" currentSort={sortConfig} onSort={requestSort} className="px-4 py-3 font-medium" align="right" />
              <SortHeader label="Interview" sortKey="scores.interviewScore" currentSort={sortConfig} onSort={requestSort} className="px-4 py-3 font-medium" align="right" />
              <SortHeader label="Exp." sortKey="scores.experienceScore" currentSort={sortConfig} onSort={requestSort} className="px-4 py-3 font-medium" align="right" />
              <SortHeader label="Composite" sortKey="scores.compositeScore" currentSort={sortConfig} onSort={requestSort} className="px-4 py-3 font-medium" align="right" />
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {displayData.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-500">
                  No applicants pending shortlisting.
                </td>
              </tr>
            ) : (
              displayData.map((row) => {
                const isExpanded = expandedId === row.id
                return (
                  <tr key={row.id} className="group">
                    <td className="px-4 py-4 align-top">
                      <button onClick={() => toggleSelect(row.id)} className="text-slate-400">
                        {selectedIds.has(row.id) ? (
                          <CheckSquare className="h-5 w-5 text-aerojet-blue" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="font-medium text-slate-900 dark:text-white">{row.applicantName}</div>
                      <div className="text-xs text-slate-500">{row.email}</div>
                      <div className="mt-1 flex gap-2">
                        {row.cvUrl && (
                          <a
                            href={row.cvUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-xs font-medium text-aerojet-blue hover:underline"
                          >
                            <FileText className="h-3 w-3" /> CV
                          </a>
                        )}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : row.id)}
                          className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          <BarChart3 className="h-3 w-3" />
                          {isExpanded ? 'Hide' : 'Detail'}
                          <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>

                      {/* Expanded sub-score breakdown */}
                      {isExpanded && (
                        <div className="mt-3 w-72 space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                          <p className="mb-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                            Aptitude Sub-Scores (Criteria-Style)
                          </p>
                          <PercentileBar
                            label="Math"
                            percentile={row.scores.mathPercentile}
                            raw={row.scores.mathRawScore != null ? String(row.scores.mathRawScore) : undefined}
                          />
                          <PercentileBar
                            label="Verbal"
                            percentile={row.scores.verbalPercentile}
                            raw={row.scores.verbalRawScore != null ? String(row.scores.verbalRawScore) : undefined}
                          />
                          <PercentileBar
                            label="Engineering"
                            percentile={row.scores.engineeringPercentile}
                            raw={row.scores.engineeringRawScore != null ? String(row.scores.engineeringRawScore) : undefined}
                          />
                          <PercentileBar
                            label="Reasoning"
                            percentile={row.scores.reasoningPercentile}
                            raw={row.scores.reasoningRawScore != null ? String(row.scores.reasoningRawScore) : undefined}
                          />
                          {row.scores.interviewScore != null && (
                            <div className="mt-2 border-t border-slate-200 pt-2 dark:border-slate-700">
                              <div className="flex items-center gap-2 text-xs">
                                <Users className="h-3 w-3 text-purple-500" />
                                <span className="text-slate-500">Interview Avg:</span>
                                <span className="font-bold text-purple-700 dark:text-purple-400">
                                  {row.scores.interviewScore}/100
                                </span>
                                <span className="text-slate-400">
                                  ({row.scores.interviewEvaluatorCount} evaluator{row.scores.interviewEvaluatorCount !== 1 ? 's' : ''})
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="text-slate-600 dark:text-slate-300">{row.programmeChoice}</div>
                      <div className="text-xs text-slate-500">{row.intakeCycle}</div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {row.scores.aptitudeScore}%
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <PercentileBadge value={row.scores.aptitudePercentile} />
                    </td>
                    <td className="px-4 py-4 align-top">
                      {row.scores.interviewScore != null ? (
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold text-purple-700 dark:text-purple-400">
                            {row.scores.interviewScore}
                          </span>
                          <span className="text-xs text-slate-400">
                            /{row.scores.interviewEvaluatorCount}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">--</span>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top">
                      {editingScoreId === row.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            className="w-16 rounded border px-2 py-1 text-xs dark:bg-slate-800"
                            value={tempScore}
                            onChange={(e) => setTempScore(e.target.value)}
                          />
                          <button
                            onClick={() => handleSaveScore(row.id)}
                            className="text-xs font-bold text-green-600"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingScoreId(null)}
                            className="text-xs text-slate-500"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="group/edit flex items-center gap-2">
                          <span className="font-medium">{row.scores.experienceScore}</span>
                          <button
                            onClick={() => {
                              setTempScore(String(row.scores.experienceScore))
                              setEditingScoreId(row.id)
                            }}
                            className="hidden text-slate-400 hover:text-aerojet-blue group-hover/edit:block"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="text-lg font-black text-aerojet-blue dark:text-aerojet-sky">
                        {row.scores.compositeScore}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      {row.scores.isAutoShortlist ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Recommended
                        </span>
                      ) : row.scores.isAutoReject ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          <AlertCircle className="h-3 w-3" />
                          Flagged
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Neutral</span>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => handleAction('REJECT', [row.id])}
                          disabled={processing}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                          title="Reject"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleAction('SHORTLIST', [row.id])}
                          disabled={processing}
                          className="rounded-lg p-2 text-slate-400 hover:bg-green-50 hover:text-green-600 disabled:opacity-50 dark:hover:bg-green-900/20 dark:hover:text-green-400"
                          title="Shortlist"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
