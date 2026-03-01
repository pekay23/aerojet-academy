'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Loader2, Trash2, FileText, CheckSquare } from 'lucide-react'

interface ExamComponentData {
  id: string
  code: string
  name: string
  type: string
  duration: number
  individualPrice: string | number | null
  poolPrice: string | number | null
  _count: { exams: number; bookings: number }
}

export default function ExamComponentsSection({
  courseId,
  components,
}: {
  courseId: string
  components: ExamComponentData[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')

  // Form state
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [type, setType] = useState<'MCQ' | 'ESSAY'>('MCQ')
  const [duration, setDuration] = useState('90')
  const [individualPrice, setIndividualPrice] = useState('520')
  const [poolPrice, setPoolPrice] = useState('300')

  const resetForm = () => {
    setCode('')
    setName('')
    setType('MCQ')
    setDuration('90')
    setIndividualPrice('520')
    setPoolPrice('300')
    setError('')
  }

  const handleCreate = async () => {
    if (!code || !name) {
      setError('Code and name are required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/staff/courses/${courseId}/exam-components`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, name, type, duration, individualPrice, poolPrice }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create')
      setOpen(false)
      resetForm()
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (componentId: string) => {
    if (!confirm('Delete this exam component? This cannot be undone.')) return
    setDeleting(componentId)
    try {
      const res = await fetch(`/api/staff/courses/${courseId}/exam-components/${componentId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete')
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase">
          Exam Components
        </h2>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm() }}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1 text-xs">
              <Plus className="h-3 w-3" /> Add Component
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[440px]">
            <DialogHeader>
              <DialogTitle>Add Exam Component</DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600">Code</label>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="M7_MCQ"
                    className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'MCQ' | 'ESSAY')}
                    className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="MCQ">MCQ</option>
                    <option value="ESSAY">Essay</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Module 7 MCQ Exam"
                  className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600">Duration (min)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600">Individual</label>
                  <input
                    type="number"
                    value={individualPrice}
                    onChange={(e) => setIndividualPrice(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600">Pool</label>
                  <input
                    type="number"
                    value={poolPrice}
                    onChange={(e) => setPoolPrice(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {components.length === 0 ? (
          <p className="text-sm text-slate-400 italic">
            No exam components configured for this course.
          </p>
        ) : (
          components.map((comp) => (
            <div
              key={comp.id}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50"
            >
              <div className="flex items-center gap-3">
                {comp.type === 'MCQ' ? (
                  <CheckSquare className="h-5 w-5 text-blue-500" />
                ) : (
                  <FileText className="h-5 w-5 text-purple-500" />
                )}
                <div>
                  <p className="font-bold text-slate-700 dark:text-slate-200">
                    <span className="mr-2 font-mono text-xs text-slate-400">{comp.code}</span>
                    {comp.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {comp.type} &middot; {comp.duration}min &middot;{' '}
                    {comp._count.exams} exam{comp._count.exams !== 1 ? 's' : ''} &middot;{' '}
                    {comp._count.bookings} booking{comp._count.bookings !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  &euro;{Number(comp.individualPrice || 0).toFixed(0)} / &euro;{Number(comp.poolPrice || 0).toFixed(0)}
                </span>
                <button
                  onClick={() => handleDelete(comp.id)}
                  disabled={deleting === comp.id || comp._count.exams > 0 || comp._count.bookings > 0}
                  className="rounded p-1 text-slate-400 transition-colors hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                  title={comp._count.exams > 0 || comp._count.bookings > 0 ? 'Cannot delete: has exams or bookings' : 'Delete'}
                >
                  {deleting === comp.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
