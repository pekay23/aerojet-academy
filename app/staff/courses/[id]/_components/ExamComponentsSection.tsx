'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Loader2, Trash2, FileText, CheckSquare, Pencil, ChevronDown, ChevronRight, ClipboardList } from 'lucide-react'

interface ExamComponentData {
  id: string
  code: string
  name: string
  type: string
  duration: number
  questionCount: number | null
  categoryCode: string | null
  individualPrice: string | number | null
  poolPrice: string | number | null
  _count: { exams: number; bookings: number }
}

export default function ExamComponentsSection({
  courseId,
  currency = 'EUR',
  components,
}: {
  courseId: string
  currency?: string
  components: ExamComponentData[]
}) {
  const getSymbol = () => {
    switch (currency) {
      case 'EUR':
        return '€'
      case 'GHS':
        return 'GH₵'
      case 'USD':
        return '$'
      default:
        return '€'
    }
  }
  const symbol = getSymbol()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  // Form state
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [type, setType] = useState<'MCQ' | 'ESSAY'>('MCQ')
  const [duration, setDuration] = useState('90')
  const [individualPrice, setIndividualPrice] = useState('520')
  const [poolPrice, setPoolPrice] = useState('300')
  const [questionCount, setQuestionCount] = useState('')
  const [categoryCode, setCategoryCode] = useState('')

  const useGrouped = components.length > 8

  const grouped = useMemo(() => {
    if (!useGrouped) return null
    const groups: Record<string, ExamComponentData[]> = {}
    for (const comp of components) {
      const key = comp.categoryCode || 'Uncategorized'
      if (!groups[key]) groups[key] = []
      groups[key].push(comp)
    }
    // Sort keys: A, B1, B2, B3, then Uncategorized
    const order = ['A', 'B1', 'B2', 'B3', 'Uncategorized']
    return Object.entries(groups).sort(
      ([a], [b]) => (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 99 : order.indexOf(b))
    )
  }, [components, useGrouped])

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const resetForm = () => {
    setCode('')
    setName('')
    setType('MCQ')
    setDuration('90')
    setIndividualPrice('520')
    setPoolPrice('300')
    setQuestionCount('')
    setCategoryCode('')
    setError('')
    setEditingId(null)
  }

  const openEdit = (comp: ExamComponentData) => {
    setEditingId(comp.id)
    setCode(comp.code)
    setName(comp.name)
    setType(comp.type as 'MCQ' | 'ESSAY')
    setDuration(String(comp.duration))
    setIndividualPrice(String(comp.individualPrice))
    setPoolPrice(String(comp.poolPrice))
    setQuestionCount(comp.questionCount ? String(comp.questionCount) : '')
    setCategoryCode(comp.categoryCode || '')
    setOpen(true)
  }

  const handleSave = async () => {
    if (!code || !name) {
      setError('Code and name are required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const isEditing = !!editingId
      const url = isEditing
        ? `/api/staff/courses/${courseId}/exam-components/${editingId}`
        : `/api/staff/courses/${courseId}/exam-components`
      const method = isEditing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, name, type, duration, individualPrice, poolPrice, questionCount: questionCount || undefined, categoryCode: categoryCode || undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      setOpen(false)
      resetForm()
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (componentId: string, hasRelated = false) => {
    const comp = components.find((c) => c.id === componentId)
    const msg = hasRelated
      ? `This component has ${comp?._count.exams || 0} exam(s) and ${comp?._count.bookings || 0} booking(s). Force-deleting will remove all related records. Continue?`
      : 'Delete this exam component? This cannot be undone.'
    if (!confirm(msg)) return
    setDeleting(componentId)
    try {
      const url = hasRelated
        ? `/api/staff/courses/${courseId}/exam-components/${componentId}?force=true`
        : `/api/staff/courses/${courseId}/exam-components/${componentId}`
      const res = await fetch(url, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to delete')
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setDeleting(null)
    }
  }

  const renderCard = (comp: ExamComponentData) => (
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
            {comp.type}
            {comp.questionCount ? ` · ${comp.questionCount} questions` : ''}
            {' · '}{comp.duration}min
            {comp.categoryCode ? ` · Cat ${comp.categoryCode}` : ''}
            {' · '}{comp._count.exams} exam{comp._count.exams !== 1 ? 's' : ''}
            {' · '}{comp._count.bookings} booking{comp._count.bookings !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => openEdit(comp)}
          className="rounded p-1 text-slate-400 transition-colors hover:text-blue-500"
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <span className="text-xs text-slate-500">
          {symbol}
          {Number(comp.individualPrice || 0).toFixed(0)} / {symbol}
          {Number(comp.poolPrice || 0).toFixed(0)}
        </span>
        <button
          onClick={() => handleDelete(comp.id, comp._count.exams > 0 || comp._count.bookings > 0)}
          disabled={deleting === comp.id}
          className="rounded p-1 text-slate-400 transition-colors hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
          title={
            comp._count.exams > 0 || comp._count.bookings > 0
              ? 'Force-delete: has exams or bookings'
              : 'Delete'
          }
        >
          {deleting === comp.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  )

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase">
          Exam Components
          {components.length > 0 && (
            <span className="ml-2 text-slate-300">({components.length})</span>
          )}
        </h2>
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o)
            if (!o) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1 text-xs">
              <Plus className="h-3 w-3" /> Add Component
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[440px]">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Edit Exam Component' : 'Add Exam Component'}
              </DialogTitle>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600">Questions</label>
                  <input
                    type="number"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(e.target.value)}
                    placeholder="e.g. 32"
                    className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600">Category</label>
                  <select
                    value={categoryCode}
                    onChange={(e) => setCategoryCode(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="">— None —</option>
                    <option value="A">Cat A</option>
                    <option value="B1">Cat B1</option>
                    <option value="B2">Cat B2</option>
                    <option value="B3">Cat B3</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600">
                    Duration (min)
                  </label>
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
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false)
                  resetForm()
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingId ? (
                  'Save Changes'
                ) : (
                  'Create'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {components.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50">
              <ClipboardList className="h-6 w-6 text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-500">No exam components</p>
            <p className="mt-1 text-xs text-slate-400">
              Add exam components to configure assessments for this course.
            </p>
          </div>
        ) : useGrouped && grouped ? (
          // Grouped by category
          <div className="space-y-4">
            {grouped.map(([groupKey, items]) => {
              const isCollapsed = collapsedGroups.has(groupKey)
              return (
                <div key={groupKey}>
                  <button
                    onClick={() => toggleGroup(groupKey)}
                    className="mb-2 flex w-full items-center gap-2 text-left"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    )}
                    <span className="text-xs font-black tracking-wider text-slate-500 uppercase">
                      {groupKey === 'Uncategorized' ? 'Uncategorized' : `Cat ${groupKey}`}
                    </span>
                    <span className="text-[10px] text-slate-400">({items.length})</span>
                  </button>
                  {!isCollapsed && (
                    <div className="space-y-2 pl-5">{items.map(renderCard)}</div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          // Flat list for small counts
          components.map(renderCard)
        )}
      </div>
    </div>
  )
}
