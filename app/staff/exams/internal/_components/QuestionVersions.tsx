'use client'

import { useState, useEffect } from 'react'
import { History, User, Calendar, X } from 'lucide-react'

interface Version {
  id: string
  version: number
  text: string
  options: string[]
  correctAnswer: string
  points: number
  difficulty: string
  changeType: string
  changeReason: string | null
  changedAt: string
  changer: {
    id: string
    email: string
    profile: { firstName: string | null; lastName: string | null } | null
  } | null
}

export default function QuestionVersions({ questionId }: { questionId: string }) {
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  const fetchVersions = useCallback(async () => {
    try {
      const res = await fetch(`/api/staff/exams/internal/questions/${questionId}/versions`)
      const json = await res.json()
      if (json.data) setVersions(json.data)
    } finally {
      setLoading(false)
    }
  }, [questionId])

  useEffect(() => {
    if (expanded) fetchVersions()
  }, [expanded, questionId, fetchVersions])

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-aerojet-blue hover:text-aerojet-blue dark:border-slate-700 dark:text-slate-300"
      >
        <History className="h-3.5 w-3.5" />
        View History
      </button>
    )
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Version History</h4>
        <button
          onClick={() => setExpanded(false)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
          aria-label="Close version history"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center py-4">
          <History className="h-5 w-5 animate-spin text-aerojet-blue" />
        </div>
      ) : versions.length === 0 ? (
        <p className="py-4 text-center text-xs text-slate-400">No version history available.</p>
      ) : (
        <div className="space-y-3">
          {versions.map((v, _i) => (
            <div
              key={v.id}
              className="rounded-lg border border-slate-100 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-aerojet-blue/10 px-2 py-0.5 text-xs font-bold text-aerojet-blue">
                    v{v.version}
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    {v.changeType}
                  </span>
                </div>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Calendar className="h-3 w-3" />
                  {new Date(v.changedAt).toLocaleString('en-GB')}
                </span>
              </div>
              {v.changeReason && (
                <p className="mt-2 text-xs text-slate-500">{v.changeReason}</p>
              )}
              <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                <p><span className="font-bold">Text:</span> {v.text}</p>
                <p><span className="font-bold">Options:</span> {JSON.stringify(v.options)}</p>
                <p><span className="font-bold">Answer:</span> {v.correctAnswer}</p>
                <p><span className="font-bold">Points:</span> {v.points} | <span className="font-bold">Difficulty:</span> {v.difficulty}</p>
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                <User className="h-3 w-3" />
                {v.changer?.profile ? `${v.changer.profile.firstName} ${v.changer.profile.lastName}` : v.changer?.email || 'Unknown'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
