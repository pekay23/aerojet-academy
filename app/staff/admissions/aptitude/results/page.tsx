'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { CheckCircle2, XCircle, AlertTriangle, Clock, Ban, Loader2, RefreshCw } from 'lucide-react'

interface Session {
  id: string
  status: string
  startedAt: string | null
  submittedAt: string | null
  score: number | null
  totalPoints: number | null
  percentage: number | null
  passed: boolean | null
  tabSwitchCount: number
  fullscreenExits: number
  user: { firstName: string; lastName: string; email: string }
  bank: { name: string }
}

export default function SessionResultsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/staff/admissions/aptitude/sessions')
      const json = await res.json()
      if (json.data) setSessions(json.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const handleVoid = async (id: string) => {
    if (!confirm('Are you sure you want to void this session? It will be marked as failed.')) return
    const res = await fetch(`/api/staff/admissions/aptitude/sessions/${id}/void`, { method: 'POST' })
    if (res.ok) fetchSessions()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-aerojet-blue dark:text-white sm:text-3xl">
            Test Session Results
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            View aptitude test results, scores, and anti-cheat violations.
          </p>
        </div>
        <button onClick={fetchSessions} className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-left">Applicant</th>
                <th className="px-4 py-4 text-left">Test Bank</th>
                <th className="px-4 py-4 text-center">Score</th>
                <th className="px-4 py-4 text-center">Status</th>
                <th className="px-4 py-4 text-center">Anti-Cheat</th>
                <th className="px-4 py-4 text-center">Submitted</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sessions.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">No sessions found.</td></tr>
              ) : sessions.map(session => (
                <tr key={session.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800 dark:text-white">{session.user.firstName} {session.user.lastName}</div>
                    <div className="text-xs text-slate-500">{session.user.email}</div>
                  </td>
                  <td className="px-4 py-4 font-medium text-slate-600 dark:text-slate-400">{session.bank.name}</td>
                  <td className="px-4 py-4 text-center">
                    {session.score !== null ? (
                      <div className="font-black">
                        <span className="text-aerojet-blue">{session.score}</span>
                        <span className="text-slate-400">/{session.totalPoints}</span>
                        <div className="text-[10px] text-slate-500">{session.percentage?.toFixed(1)}%</div>
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {session.status === 'COMPLETED' ? (
                      <div className="flex justify-center">
                        {session.passed ? (
                          <div className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-600 dark:bg-emerald-900/30">
                            <CheckCircle2 className="h-3 w-3" /> PASSED
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-[10px] font-black text-red-600 dark:bg-red-900/30">
                            <XCircle className="h-3 w-3" /> FAILED
                          </div>
                        )}
                      </div>
                    ) : session.status === 'IN_PROGRESS' ? (
                      <div className="flex justify-center">
                        <div className="flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-600 dark:bg-blue-900/30">
                          <Clock className="h-3 w-3" /> IN PROGRESS
                        </div>
                      </div>
                    ) : session.status === 'VOIDED' ? (
                      <div className="flex justify-center">
                        <div className="flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600 dark:bg-slate-800">
                          <Ban className="h-3 w-3" /> VOIDED
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center">
                        <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-black text-amber-600 dark:bg-amber-900/30">
                          <AlertTriangle className="h-3 w-3" /> {session.status}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {(session.tabSwitchCount > 0 || session.fullscreenExits > 0) ? (
                      <div className="flex flex-col items-center gap-1 text-[10px] font-bold">
                        {session.tabSwitchCount > 0 && <span className="text-amber-500">{session.tabSwitchCount} tab switches</span>}
                        {session.fullscreenExits > 0 && <span className="text-amber-500">{session.fullscreenExits} fs exits</span>}
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400">Clean</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center text-xs text-slate-500">
                    {session.submittedAt ? format(new Date(session.submittedAt), 'MMM d, HH:mm') : '-'}
                  </td>
                  <td className="px-4 py-4 text-right">
                    {(session.status === 'COMPLETED' || session.status === 'FLAGGED') && (
                      <button onClick={() => handleVoid(session.id)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600" title="Void Session">
                        <Ban className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
