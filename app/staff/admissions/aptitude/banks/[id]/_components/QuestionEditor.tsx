'use client'

import { useState, useEffect, useCallback } from 'react'
import { Pencil, Trash2, Loader2 } from 'lucide-react'
import { useFormDirty } from '@/hooks/useFormDirty'

interface Question {
  id: string
  category: string
  questionType: string
  difficulty: string
  text: string
  options: string[] | null
  correctAnswer: string
  points: number
  explanation: string | null
  isActive: boolean
}

interface QuestionEditorProps {
  bankId: string
  isCreating: boolean
  onCancelCreate: () => void
}

const CATEGORIES = ['MATH', 'ENGLISH', 'ENGINEERING', 'LOGICAL_REASONING', 'PHYSICS']
const TYPES = ['MCQ', 'NUMERIC_INPUT', 'TRUE_FALSE']
const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD']

export default function QuestionEditor({
  bankId,
  isCreating,
  onCancelCreate,
}: QuestionEditorProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const { markDirty, markClean } = useFormDirty()

  const [form, setForm] = useState({
    category: 'MATH',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    text: '',
    options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
    correctAnswer: 'Option 1',
    points: 1,
    explanation: '',
    isActive: true,
  })

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await fetch(`/api/staff/admissions/aptitude/banks/${bankId}/questions`)
      const json = await res.json()
      if (json.data) setQuestions(json.data)
    } catch (err) {
      console.error('[QuestionEditor] Failed to fetch questions:', err)
    } finally {
      setLoading(false)
    }
  }, [bankId])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  useEffect(() => {
    if (isCreating && !editingId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditingId('NEW')
      setForm({
        category: 'MATH',
        questionType: 'MCQ',
        difficulty: 'MEDIUM',
        text: '',
        options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
        correctAnswer: 'Option 1',
        points: 1,
        explanation: '',
        isActive: true,
      })
    }
  }, [isCreating, editingId])

  const handleSave = async () => {
    if (!form.text || !form.correctAnswer) return
    setSaving(true)
    try {
      const isNew = editingId === 'NEW'
      const url = isNew
        ? `/api/staff/admissions/aptitude/banks/${bankId}/questions`
        : `/api/staff/admissions/aptitude/banks/${bankId}/questions/${editingId}`

      const payload = {
        ...form,
        options: form.questionType === 'MCQ' ? form.options : null,
      }

      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        markClean()
        setEditingId(null)
        if (isNew) onCancelCreate()
        fetchQuestions()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this question?')) return
    await fetch(`/api/staff/admissions/aptitude/banks/${bankId}/questions/${id}`, {
      method: 'DELETE',
    })
    fetchQuestions()
  }

  const handleEdit = (q: Question) => {
    setForm({
      category: q.category,
      questionType: q.questionType,
      difficulty: q.difficulty,
      text: q.text,
      options: Array.isArray(q.options)
        ? q.options
        : ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      correctAnswer: q.correctAnswer,
      points: q.points,
      explanation: q.explanation || '',
      isActive: q.isActive,
    })
    setEditingId(q.id)
  }

  const handleOptionChange = (index: number, val: string) => {
    const newOpts = [...form.options]
    newOpts[index] = val
    setForm({ ...form, options: newOpts })
    markDirty()
  }

  const cancelEdit = () => {
    markClean()
    setEditingId(null)
    if (editingId === 'NEW') onCancelCreate()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {editingId && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-5 dark:border-blue-900/30 dark:bg-blue-900/10">
          <div className="mb-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-500 uppercase">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => {
                  setForm({ ...form, category: e.target.value })
                  markDirty()
                }}
                className="w-full rounded-lg border border-slate-200 p-2 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-500 uppercase">Type</label>
              <select
                value={form.questionType}
                onChange={(e) => {
                  setForm({ ...form, questionType: e.target.value })
                  markDirty()
                }}
                className="w-full rounded-lg border border-slate-200 p-2 text-sm"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-500 uppercase">
                Difficulty
              </label>
              <select
                value={form.difficulty}
                onChange={(e) => {
                  setForm({ ...form, difficulty: e.target.value })
                  markDirty()
                }}
                className="w-full rounded-lg border border-slate-200 p-2 text-sm"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-xs font-bold text-slate-500 uppercase">
              Question Text *
            </label>
            <textarea
              value={form.text}
              onChange={(e) => {
                setForm({ ...form, text: e.target.value })
                markDirty()
              }}
              rows={3}
              className="focus:border-aerojet-blue focus:ring-aerojet-blue/20 w-full rounded-lg border border-slate-200 p-3 text-sm focus:ring-2"
              placeholder="Enter question text..."
            />
          </div>

          {form.questionType === 'MCQ' && (
            <div className="mb-4 space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase">
                Options & Correct Answer
              </label>
              {form.options.map((opt: string, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="correct"
                    checked={form.correctAnswer === opt && opt !== ''}
                    onChange={() => {
                      setForm({ ...form, correctAnswer: opt })
                      markDirty()
                    }}
                    className="text-aerojet-blue h-4 w-4"
                  />
                  <input
                    value={opt}
                    onChange={(e) => {
                      handleOptionChange(i, e.target.value)
                      markDirty()
                    }}
                    className="flex-1 rounded-lg border border-slate-200 p-2 text-sm"
                    placeholder={`Option ${i + 1}`}
                  />
                </div>
              ))}
            </div>
          )}

          {form.questionType === 'TRUE_FALSE' && (
            <div className="mb-4 space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase">
                Correct Answer
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={form.correctAnswer === 'True'}
                    onChange={() => {
                      setForm({ ...form, correctAnswer: 'True' })
                      markDirty()
                    }}
                  />{' '}
                  True
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={form.correctAnswer === 'False'}
                    onChange={() => {
                      setForm({ ...form, correctAnswer: 'False' })
                      markDirty()
                    }}
                  />{' '}
                  False
                </label>
              </div>
            </div>
          )}

          {form.questionType === 'NUMERIC_INPUT' && (
            <div className="mb-4">
              <label className="mb-1 block text-xs font-bold text-slate-500 uppercase">
                Exact Answer (Number)
              </label>
              <input
                type="text"
                value={form.correctAnswer}
                onChange={(e) => {
                  setForm({ ...form, correctAnswer: e.target.value })
                  markDirty()
                }}
                className="w-full rounded-lg border border-slate-200 p-2 text-sm"
              />
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => {
                  setForm({ ...form, isActive: e.target.checked })
                  markDirty()
                }}
              />{' '}
              Active
            </label>
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving || !form.text || !form.correctAnswer}
                className="bg-aerojet-blue flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Question'}
              </button>
              <button
                onClick={cancelEdit}
                className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {questions.length === 0 && !editingId && (
          <div className="py-8 text-center text-sm font-bold text-slate-400">
            No questions in this bank yet.
          </div>
        )}
        {questions.map((q, i) => (
          <div
            key={q.id}
            className="flex items-start justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400">
                <span className="rounded bg-slate-200 px-1.5 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  Q{questions.length - i}
                </span>
                <span className="text-aerojet-blue">{q.category.replace('_', ' ')}</span>
                <span>•</span>
                <span>{q.questionType.replace('_', ' ')}</span>
                <span>•</span>
                <span
                  className={
                    q.difficulty === 'EASY'
                      ? 'text-green-500'
                      : q.difficulty === 'HARD'
                        ? 'text-red-500'
                        : 'text-amber-500'
                  }
                >
                  {q.difficulty}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                {q.text}
              </p>
              <div className="mt-2 text-xs font-bold text-emerald-600">Ans: {q.correctAnswer}</div>
            </div>
            <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 md:opacity-100">
              <button
                onClick={() => handleEdit(q)}
                className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(q.id)}
                className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
