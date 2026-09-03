'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Calendar, Users, FileText, Settings, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

interface Exam {
  id: string
  title: string
  moduleCode: string
  licenceCategory?: string
  durationMinutes: number
  passMark: number
  status: string
  config: Record<string, any>
  createdAt: string
  _count: { questions: number; sessions: number }
}

interface Session {
  id: string
  startTime: string
  endTime: string
  location?: string
  status: string
  _count: { attempts: number; accessCodes: number }
}

export function ExamDetailClient({ examId }: { examId: string }) {
  const router = useRouter()
  const [exam, setExam] = useState<Exam | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'questions'>('overview')

  const fetchExam = async () => {
    setLoading(true)
    try {
      const [examRes, sessionsRes] = await Promise.all([
        fetch(`/api/exams/${examId}`),
        fetch(`/api/exams/${examId}/sessions?limit=10`),
      ])

      const examJson = await examRes.json()
      const sessionsJson = await sessionsRes.json()

      if (examJson.success) setExam(examJson.data)
      if (sessionsJson.success) setSessions(sessionsJson.data.sessions)
    } catch {
      toast.error('Failed to load exam')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchExam()
  }, [examId])

  const handleCreateSession = async () => {
    const startTime = prompt('Session start time (ISO format):', new Date().toISOString())
    if (!startTime) return

    const endTime = prompt('Session end time (ISO format):', new Date(Date.now() + 90 * 60 * 1000).toISOString())
    if (!endTime) return

    const res = await fetch(`/api/exams/${examId}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startTime,
        endTime,
        accessCodeCount: 20,
      }),
    })

    if (res.ok) {
      toast.success('Session created with access codes')
      fetchExam()
    } else {
      toast.error('Failed to create session')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-aerojet-blue border-t-transparent" />
      </div>
    )
  }

  if (!exam) {
    return <div className="p-8 text-center text-red-500">Exam not found</div>
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Settings },
    { id: 'sessions', label: 'Sessions', icon: Calendar },
    { id: 'questions', label: 'Questions', icon: FileText },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <button onClick={() => router.push('/staff/exams/anticheat')} className="hover:text-aerojet-blue">
              Exams
            </button>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-slate-900 dark:text-white">{exam.title}</span>
          </div>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{exam.title}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {exam.moduleCode} · {exam.durationMinutes} min · {exam.passMark}% pass mark
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-sm font-bold ${exam.status === 'active' ? 'bg-green-100 text-green-800' : exam.status === 'draft' ? 'bg-slate-100 text-slate-800' : 'bg-red-100 text-red-800'}`}>
            {exam.status}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-aerojet-blue text-aerojet-blue'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{exam._count.questions}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Questions</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
                <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{exam._count.sessions}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Sessions</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{exam.durationMinutes}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Minutes</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <Settings className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{exam.passMark}%</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Pass Mark</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Exam Sessions</h2>
            <button
              onClick={handleCreateSession}
              className="flex items-center gap-2 rounded-lg bg-aerojet-blue px-3 py-2 text-sm font-bold text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              New Session
            </button>
          </div>

          {sessions.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
              <Calendar className="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
              <p className="text-lg font-medium text-slate-600 dark:text-slate-400">No sessions yet</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">Create a session to generate access codes for candidates.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Start Time</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">End Time</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Attempts</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Access Codes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {sessions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                        {new Date(s.startTime).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                        {new Date(s.endTime).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{s.location || '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`rounded-full px-2 py-1 text-xs font-bold ${s.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{s._count.attempts}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{s._count.accessCodes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'questions' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <FileText className="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
          <p className="text-lg font-medium text-slate-600 dark:text-slate-400">Question management coming soon</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">Questions will be importable via the shared question import pipeline.</p>
        </div>
      )}
    </div>
  )
}
