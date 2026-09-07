'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Star } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Entry {
  id: string
  date: string
  aircraftType: string
  aircraftRegistration: string
  ataChapter: { code: string; title: string }
  taskDescription: string
  maintenanceType: string
  durationHours: number
  supervisorSignature: boolean
  studentSignature: boolean
  verifiedByManagement: boolean
  competencyRating: number | null
}

interface Props {
  entries: Entry[]
  logbookId: string
  staffId: string
}

export default function ReviewSignoffPanel({ entries, logbookId: _logbookId, staffId: _staffId }: Props) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [commentId, setCommentId] = useState<string | null>(null)
  const [comments, setComments] = useState<Record<string, string>>({})

  const sign = async (entryId: string) => {
    setLoadingId(entryId)
    try {
      const res = await fetch(`/api/staff/ojt/entries/${entryId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: comments[entryId] || null }),
      })
      if (!res.ok) throw new Error('Failed to sign')
      toast.success('Signed as supervisor')
      setComments((c) => ({ ...c, [entryId]: '' }))
      setCommentId(null)
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to sign')
    } finally {
      setLoadingId(null)
    }
  }

  const verify = async (entryId: string) => {
    setLoadingId(entryId)
    try {
      const res = await fetch(`/api/staff/ojt/entries/${entryId}/verify`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to verify')
      toast.success('Verified by management')
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to verify')
    } finally {
      setLoadingId(null)
    }
  }

  const rate = async (entryId: string, rating: number) => {
    setLoadingId(entryId)
    try {
      const res = await fetch(`/api/staff/ojt/entries/${entryId}/competency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      })
      if (!res.ok) throw new Error('Failed to rate')
      toast.success(`Rated ${rating}/5`)
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to rate')
    } finally {
      setLoadingId(null)
    }
  }

  const statusBadge = (entry: Entry) => {
    if (entry.verifiedByManagement) {
      return <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Fully Verified</span>
    }
    if (entry.supervisorSignature) {
      return <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-black text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Supervisor Signed</span>
    }
    return <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Unsigned</span>
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-lg font-black text-slate-900 dark:text-white">Entry Review & Sign-off</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400">Date</th>
              <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400">ATA</th>
              <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400">Task</th>
              <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400">Type</th>
              <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400">Hours</th>
              <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400">Status</th>
              <th className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-slate-50 dark:border-slate-800/50">
                <td className="px-3 py-3 text-xs text-slate-600 dark:text-slate-300">
                  {new Date(entry.date).toLocaleDateString('en-GB')}
                </td>
                <td className="px-3 py-3 text-xs font-bold text-slate-700 dark:text-slate-200">
                  {entry.ataChapter.code}
                </td>
                <td className="max-w-[240px] truncate px-3 py-3 text-xs text-slate-600 dark:text-slate-300">
                  {entry.taskDescription}
                </td>
                <td className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">{entry.maintenanceType}</td>
                <td className="px-3 py-3 text-xs font-bold text-slate-700 dark:text-slate-200">{entry.durationHours.toFixed(1)}</td>
                <td className="px-3 py-3">{statusBadge(entry)}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-2">
                    {!entry.supervisorSignature && (
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => setCommentId(commentId === entry.id ? null : entry.id)}
                          className="rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400"
                        >
                          {commentId === entry.id ? 'Cancel' : 'Comment'}
                        </button>
                        {commentId === entry.id && (
                          <textarea
                            value={comments[entry.id] || ''}
                            onChange={(e) => setComments((c) => ({ ...c, [entry.id]: e.target.value }))}
                            placeholder="Supervisor comments (optional)"
                            rows={2}
                            className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                        )}
                        <button
                          onClick={() => sign(entry.id)}
                          disabled={loadingId === entry.id}
                          className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50 dark:bg-blue-900/30 dark:text-blue-400"
                        >
                          {loadingId === entry.id ? '...' : 'Sign'}
                        </button>
                      </div>
                    )}
                    {entry.supervisorSignature && !entry.verifiedByManagement && (
                      <button
                        onClick={() => verify(entry.id)}
                        disabled={loadingId === entry.id}
                        className="rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 dark:bg-emerald-900/30 dark:text-emerald-400"
                      >
                        {loadingId === entry.id ? '...' : 'Verify'}
                      </button>
                    )}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => rate(entry.id, star)}
                          disabled={loadingId === entry.id}
                          className="disabled:opacity-50"
                        >
                          <Star
                            className={`h-3.5 w-3.5 ${
                              entry.competencyRating && star <= entry.competencyRating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
