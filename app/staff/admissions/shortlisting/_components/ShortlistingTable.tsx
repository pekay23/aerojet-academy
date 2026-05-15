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
  Edit2
} from 'lucide-react'

interface ScoreData {
  compositeScore: number
  aptitudeScore: number
  profileScore: number
  referralScore: number
  experienceScore: number
  isAutoShortlist: boolean
  isAutoReject: boolean
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

export default function ShortlistingTable({ data }: { data: ApplicationRow[] }) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [processing, setProcessing] = useState(false)
  const [editingScoreId, setEditingScoreId] = useState<string | null>(null)
  const [tempScore, setTempScore] = useState<string>('')

  // Filter
  const filteredData = data.filter((row) =>
    row.applicantName.toLowerCase().includes(search.toLowerCase()) ||
    row.email.toLowerCase().includes(search.toLowerCase()) ||
    row.programmeChoice.toLowerCase().includes(search.toLowerCase())
  )

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredData.length && filteredData.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredData.map((d) => d.id)))
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
      if (input === null) return // Cancelled
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
        body: JSON.stringify({ experienceScore: score })
      })
      if (res.ok) {
        setEditingScoreId(null)
        router.refresh()
      }
    } catch (e) {
      console.error(e)
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
                  {selectedIds.size === filteredData.length && filteredData.length > 0 ? (
                    <CheckSquare className="h-5 w-5 text-aerojet-blue" />
                  ) : (
                    <Square className="h-5 w-5" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 font-medium">Candidate</th>
              <th className="px-4 py-3 font-medium">Programme</th>
              <th className="px-4 py-3 font-medium">Aptitude Score</th>
              <th className="px-4 py-3 font-medium">Exp. Score</th>
              <th className="px-4 py-3 font-medium">Total Score</th>
              <th className="px-4 py-3 font-medium">Auto-Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  No applicants pending shortlisting.
                </td>
              </tr>
            ) : (
              filteredData.map((row) => (
                <tr
                  key={row.id}
                  className={`group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                    selectedIds.has(row.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                  }`}
                >
                  <td className="px-4 py-4">
                    <button onClick={() => toggleSelect(row.id)} className="text-slate-400">
                      {selectedIds.has(row.id) ? (
                        <CheckSquare className="h-5 w-5 text-aerojet-blue" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-slate-900 dark:text-white">
                      {row.applicantName}
                    </div>
                    <div className="text-xs text-slate-500">{row.email}</div>
                    {row.cvUrl && (
                      <a
                        href={row.cvUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 flex items-center gap-1 text-xs font-medium text-aerojet-blue hover:underline"
                      >
                        <FileText className="h-3 w-3" /> View CV
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                    {row.programmeChoice}
                    <div className="text-xs text-slate-500">{row.intakeCycle}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {row.scores.aptitudeScore}%
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {editingScoreId === row.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          className="w-16 rounded border px-2 py-1 text-xs dark:bg-slate-800"
                          value={tempScore}
                          onChange={(e) => setTempScore(e.target.value)}
                        />
                        <button onClick={() => handleSaveScore(row.id)} className="text-green-600 text-xs font-bold">Save</button>
                        <button onClick={() => setEditingScoreId(null)} className="text-slate-500 text-xs">Cancel</button>
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
                  <td className="px-4 py-4">
                    <div className="text-lg font-black text-aerojet-blue dark:text-aerojet-sky">
                      {row.scores.compositeScore}
                    </div>
                  </td>
                  <td className="px-4 py-4">
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
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => handleAction('REJECT', [row.id])}
                        disabled={processing}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                        title="Reject Candidate"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleAction('SHORTLIST', [row.id])}
                        disabled={processing}
                        className="rounded-lg p-2 text-slate-400 hover:bg-green-50 hover:text-green-600 disabled:opacity-50 dark:hover:bg-green-900/20 dark:hover:text-green-400"
                        title="Shortlist Candidate"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
