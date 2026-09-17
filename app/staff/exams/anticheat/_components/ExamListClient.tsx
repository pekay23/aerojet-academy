'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, FileText, Calendar, Users, Pencil } from 'lucide-react'
import { toast } from 'sonner'

interface Exam {
  id: string
  title: string
  moduleCode: string
  licenceCategory?: string
  durationMinutes: number
  passMark: number
  status: string
  config: {
    fullscreen: boolean
    sebRequired: boolean
    violationThreshold: number
    strictMode: boolean
  }
  createdAt: string
  _count: { questions: number; sessions: number }
}

export function ExamListClient() {
  const router = useRouter()
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const fetchExams = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)

      const res = await fetch(`/api/exams?${params}`)
      const json = await res.json()
      if (json.success) {
        setExams(json.data.exams)
      }
    } catch {
      toast.error('Failed to load exams')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchExams()
  }, [statusFilter, fetchExams])

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      title: formData.get('title') as string,
      moduleCode: formData.get('moduleCode') as string,
      licenceCategory: formData.get('licenceCategory') as string,
      durationMinutes: parseInt(formData.get('durationMinutes') as string),
      passMark: parseInt(formData.get('passMark') as string),
      config: {
        fullscreen: formData.get('fullscreen') === 'on',
        sebRequired: formData.get('sebRequired') === 'on',
        violationThreshold: parseInt(formData.get('violationThreshold') as string) || 3,
        strictMode: formData.get('strictMode') === 'on',
      },
      status: 'draft',
    }

    const res = await fetch('/api/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      toast.success('Exam created')
      setShowCreateModal(false)
      fetchExams()
    } else {
      toast.error('Failed to create exam')
    }
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    archived: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Exam Management</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Create and manage secure examinations with anti-cheat controls
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-xl bg-aerojet-blue px-4 py-2 font-bold text-white shadow-md transition-all hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          New Exam
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Exams Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      ) : exams.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <FileText className="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No exams found</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Create your first exam to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-aerojet-blue/10">
                    <FileText className="h-5 w-5 text-aerojet-blue" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{exam.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{exam.moduleCode}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-bold ${statusColors[exam.status]}`}>
                  {exam.status}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {exam.durationMinutes} min
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {exam._count.sessions} sessions
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Pass mark: {exam.passMark}% · {exam._count.questions} questions
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => router.push(`/staff/exams/anticheat/${exam.id}`)}
                    className="rounded-lg p-2 text-slate-400 hover:text-aerojet-blue hover:bg-aerojet-blue/10"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create New Exam</h2>
            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
                <input name="title" required className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Module Code</label>
                  <input name="moduleCode" required placeholder="M1" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Licence Category</label>
                  <input name="licenceCategory" placeholder="B1.1" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Duration (minutes)</label>
                  <input name="durationMinutes" type="number" required min="1" defaultValue="90" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Pass Mark (%)</label>
                  <input name="passMark" type="number" required min="1" max="100" defaultValue="75" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input name="fullscreen" type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Enforce fullscreen mode</span>
                </label>
                <label className="flex items-center gap-2">
                  <input name="sebRequired" type="checkbox" className="rounded" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Require Safe Exam Browser</span>
                </label>
                <label className="flex items-center gap-2">
                  <input name="strictMode" type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Strict mode (any key = submit)</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="rounded-lg border border-slate-300 px-4 py-2 font-bold text-slate-700 dark:border-slate-700 dark:text-slate-300">
                  Cancel
                </button>
                <button type="submit" className="rounded-lg bg-aerojet-blue px-4 py-2 font-bold text-white hover:bg-blue-700">
                  Create Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
