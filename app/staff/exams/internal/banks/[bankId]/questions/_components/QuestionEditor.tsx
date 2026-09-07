'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Pencil,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
  Upload,
  X,
  CheckSquare,
  Square,
  RotateCcw,
  Eye,
  EyeOff,
} from 'lucide-react'

interface Question {
  id: string
  text: string
  options: string[]
  correctAnswer: string
  points: number
  subTopic: string | null
  difficulty: string
  syllabusRef: string | null
  knowledgeLevel: number | null
  explanation: string | null
  isActive: boolean
  status: string
}

interface QuestionEditorProps {
  bankId: string
}

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD']

export default function QuestionEditor({ bankId }: QuestionEditorProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkImporting, setBulkImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    count: number
    errors: { row: number; message: string }[]
  } | null>(null)

  // Selection state for bulk operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Retired questions state
  const [showRetired, setShowRetired] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)

  const [form, setForm] = useState({
    text: '',
    options: ['', '', ''],
    correctAnswer: '',
    subTopic: '',
    difficulty: 'MEDIUM' as 'EASY' | 'MEDIUM' | 'HARD',
    points: 1,
    syllabusRef: '',
    knowledgeLevel: null as number | null,
    explanation: '',
    isActive: true,
  })

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await fetch(`/api/staff/exams/internal/banks/${bankId}/questions`)
      if (!res.ok) throw new Error(`Failed to load questions (${res.status})`)
      const json = await res.json()
      if (json.data) setQuestions(json.data)
    } catch (e) {
      console.error('Failed to fetch questions:', e)
    } finally {
      setLoading(false)
    }
  }, [bankId])

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchQuestions()
  }, [fetchQuestions])

  const resetForm = () => {
    setForm({
      text: '',
      options: ['', '', ''],
      correctAnswer: '',
      subTopic: '',
      difficulty: 'MEDIUM',
      points: 1,
      syllabusRef: '',
      knowledgeLevel: null,
      explanation: '',
      isActive: true,
    })
    setEditingId(null)
  }

  const handleCreate = () => {
    resetForm()
    setEditingId('NEW')
  }

  const handleEdit = (q: Question) => {
    setForm({
      text: q.text,
      options: q.options.length === 3 ? q.options : ['', '', ''],
      correctAnswer: q.correctAnswer,
      subTopic: q.subTopic || '',
      difficulty: q.difficulty as 'EASY' | 'MEDIUM' | 'HARD',
      points: q.points,
      syllabusRef: q.syllabusRef || '',
      knowledgeLevel: q.knowledgeLevel,
      explanation: q.explanation || '',
      isActive: q.isActive,
    })
    setEditingId(q.id)
  }

  const handleSave = async () => {
    if (!form.text || !form.correctAnswer || form.options.some((o) => !o.trim())) return
    setSaving(true)
    try {
      const isNew = editingId === 'NEW'
      const url = isNew
        ? `/api/staff/exams/internal/banks/${bankId}/questions`
        : `/api/staff/exams/internal/banks/${bankId}/questions/${editingId}`

      const payload = {
        text: form.text,
        options: form.options.map((o) => o.trim()),
        correctAnswer: form.correctAnswer,
        subTopic: form.subTopic || undefined,
        difficulty: form.difficulty,
        points: form.points,
        syllabusRef: form.syllabusRef || undefined,
        knowledgeLevel: form.knowledgeLevel || undefined,
        explanation: form.explanation || undefined,
        isActive: form.isActive,
      }

      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        resetForm()
        fetchQuestions()
      }
    } finally {
      setSaving(false)
    }
  }

  // Delete single question - open custom modal
  const handleDeleteClick = (id: string) => {
    setDeleteTarget(id)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await fetch(`/api/staff/exams/internal/banks/${bankId}/questions/${deleteTarget}`, {
        method: 'DELETE',
      })
      setSelectedIds((prev) => {
        const n = new Set(prev)
        n.delete(deleteTarget)
        return n
      })
      fetchQuestions()
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
      setDeleteTarget(null)
    }
  }

  // Bulk delete selected questions
  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return
    setDeleteTarget(null)
    setShowDeleteModal(true)
  }

  const confirmBulkDelete = async () => {
    if (selectedIds.size === 0) return
    setDeleting(true)
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/staff/exams/internal/banks/${bankId}/questions/${id}`, { method: 'DELETE' })
        )
      )
      setSelectedIds(new Set())
      fetchQuestions()
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  // Restore a retired question
  const handleRestore = async (id: string) => {
    setRestoring(id)
    try {
      await fetch(`/api/staff/exams/internal/banks/${bankId}/questions/${id}/restore`, {
        method: 'POST',
      })
      fetchQuestions()
    } finally {
      setRestoring(null)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === questions.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(questions.map((q) => q.id)))
    }
  }

  const handleOptionChange = (index: number, val: string) => {
    const newOpts = [...form.options]
    newOpts[index] = val
    setForm({ ...form, options: newOpts })
    if (form.correctAnswer === form.options[index]) {
      setForm({ ...form, options: newOpts, correctAnswer: val })
    }
  }

  const handleBulkImport = async () => {
    if (!bulkText.trim()) return
    setBulkImporting(true)
    setImportResult(null)
    try {
      const items = bulkText
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => {
          const parts = line.split('|')
          const text = (parts[0] || '').trim()
          const optionA = (parts[1] || '').trim()
          const optionB = (parts[2] || '').trim()
          const optionC = (parts[3] || '').trim()
          const options = [optionA, optionB, optionC].filter(Boolean)
          const correctAnswer = (parts[4] || '').trim()
          const subTopic = (parts[5] || '').trim() || undefined
          const difficulty = (parts[6] || 'MEDIUM').trim() as 'EASY' | 'MEDIUM' | 'HARD'
          const points = parseInt((parts[7] || '1').trim()) || 1
          const syllabusRef = (parts[8] || '').trim() || undefined
          const explanation = (parts[9] || '').trim() || undefined
          return {
            text,
            options,
            correctAnswer,
            subTopic,
            difficulty,
            points,
            syllabusRef,
            explanation,
          }
        })

      const res = await fetch(`/api/staff/exams/internal/banks/${bankId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      })
      const json = await res.json()
      if (json.data) {
        setImportResult({ count: json.data.count, errors: json.data.errors || [] })
        if (json.data.count > 0) {
          setBulkText('')
          fetchQuestions()
        }
      }
    } finally {
      setBulkImporting(false)
    }
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
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {deleteTarget ? 'Retire Question' : 'Retire Questions'}
                </h3>
                <p className="text-sm text-slate-500">
                  {deleteTarget
                    ? 'This question will be marked inactive but preserved in version history.'
                    : `You are about to retire ${selectedIds.size} questions. They will be marked inactive but preserved in version history.`}
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteTarget(null)
                }}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={deleteTarget ? confirmDelete : confirmBulkDelete}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Retiring...' : deleteTarget ? 'Retire' : `Retire ${selectedIds.size}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingId && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-5 dark:border-blue-900/30 dark:bg-blue-900/10">
          <h3 className="mb-4 text-sm font-black tracking-widest text-slate-500 uppercase">
            {editingId === 'NEW' ? 'New Question' : 'Edit Question'}
          </h3>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="question-text"
                className="mb-1 block text-xs font-bold text-slate-500 uppercase"
              >
                Question Text *
              </label>
              <textarea
                id="question-text"
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                rows={3}
                className="focus:border-aerojet-blue focus:ring-aerojet-blue/20 w-full rounded-lg border border-slate-200 p-3 text-sm focus:ring-2"
                placeholder="Enter question text..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="option-a"
                  className="mb-1 block text-xs font-bold text-slate-500 uppercase"
                >
                  Option A *
                </label>
                <input
                  id="option-a"
                  value={form.options[0]}
                  onChange={(e) => handleOptionChange(0, e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm"
                  placeholder="Option A"
                />
              </div>
              <div>
                <label
                  htmlFor="option-b"
                  className="mb-1 block text-xs font-bold text-slate-500 uppercase"
                >
                  Option B *
                </label>
                <input
                  id="option-b"
                  value={form.options[1]}
                  onChange={(e) => handleOptionChange(1, e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm"
                  placeholder="Option B"
                />
              </div>
              <div>
                <label
                  htmlFor="option-c"
                  className="mb-1 block text-xs font-bold text-slate-500 uppercase"
                >
                  Option C *
                </label>
                <input
                  id="option-c"
                  value={form.options[2]}
                  onChange={(e) => handleOptionChange(2, e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm"
                  placeholder="Option C"
                />
              </div>
            </div>

            <fieldset className="rounded-lg border border-slate-200 p-3">
              <legend className="text-xs font-bold text-slate-500 uppercase">
                Correct Answer *
              </legend>
              <div className="flex gap-3">
                {['A', 'B', 'C'].map((label, i) => (
                  <label
                    key={label}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50"
                  >
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={form.correctAnswer === form.options[i]}
                      onChange={() => setForm({ ...form, correctAnswer: form.options[i] })}
                      className="text-aerojet-blue h-4 w-4"
                    />
                    <span className="text-sm font-medium">
                      {label}: {form.options[i] || '—'}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label
                  htmlFor="sub-topic"
                  className="mb-1 block text-xs font-bold text-slate-500 uppercase"
                >
                  Sub-Topic
                </label>
                <input
                  id="sub-topic"
                  value={form.subTopic}
                  onChange={(e) => setForm({ ...form, subTopic: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm"
                  placeholder="e.g. Electricity"
                />
              </div>
              <div>
                <label
                  htmlFor="difficulty"
                  className="mb-1 block text-xs font-bold text-slate-500 uppercase"
                >
                  Difficulty
                </label>
                <select
                  id="difficulty"
                  value={form.difficulty}
                  onChange={(e) =>
                    setForm({ ...form, difficulty: e.target.value as 'EASY' | 'MEDIUM' | 'HARD' })
                  }
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm"
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="points"
                  className="mb-1 block text-xs font-bold text-slate-500 uppercase"
                >
                  Points
                </label>
                <input
                  id="points"
                  type="number"
                  min={1}
                  value={form.points}
                  onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 1 })}
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="syllabus-ref"
                  className="mb-1 block text-xs font-bold text-slate-500 uppercase"
                >
                  Syllabus Ref
                </label>
                <input
                  id="syllabus-ref"
                  value={form.syllabusRef}
                  onChange={(e) => setForm({ ...form, syllabusRef: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm"
                  placeholder="e.g. 3.2.1"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="explanation"
                className="mb-1 block text-xs font-bold text-slate-500 uppercase"
              >
                Explanation (shown after exam)
              </label>
              <textarea
                id="explanation"
                value={form.explanation}
                onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                rows={3}
                className="focus:border-aerojet-blue focus:ring-aerojet-blue/20 w-full rounded-lg border border-slate-200 p-3 text-sm focus:ring-2"
                placeholder="Explain why the correct answer is correct and why the others are wrong..."
              />
              <p className="mt-1 text-[10px] text-slate-400">
                Optional. Students can choose to view this after their exam is published.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-bold">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="text-aerojet-blue focus:ring-aerojet-blue h-4 w-4 rounded border-slate-300"
                />
                Active
              </label>
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={
                    saving ||
                    !form.text ||
                    !form.correctAnswer ||
                    form.options.some((o) => !o.trim())
                  }
                  className="bg-aerojet-blue flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Question'}
                </button>
                <button
                  onClick={resetForm}
                  className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-black text-slate-800 dark:text-white">
            Questions ({questions.filter((q) => q.isActive).length})
          </h3>
          {questions.some((q) => !q.isActive) && (
            <button
              onClick={() => setShowRetired(!showRetired)}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400"
            >
              {showRetired ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {showRetired
                ? 'Hide Retired'
                : `Show Retired (${questions.filter((q) => !q.isActive).length})`}
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulkImport(!showBulkImport)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
          >
            <Upload className="h-4 w-4" />
            Bulk Import
          </button>
          <button
            onClick={handleCreate}
            className="bg-aerojet-blue flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Question
          </button>
        </div>
      </div>

      {showBulkImport && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-5 dark:border-blue-900/30 dark:bg-blue-900/10">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-black tracking-widest text-slate-500 uppercase">
              Bulk Import
            </h4>
            <button
              onClick={() => {
                setShowBulkImport(false)
                setImportResult(null)
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mb-3 text-xs text-slate-500">
            Paste one question per line. Format:{' '}
            <code className="rounded bg-slate-200 px-1 py-0.5 text-[10px]">
              Question text | Option A | Option B | Option C | Correct Answer | Sub-Topic |
              Difficulty | Points | Syllabus Ref | Explanation
            </code>
          </p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={8}
            className="focus:border-aerojet-blue focus:ring-aerojet-blue/20 mb-3 w-full rounded-lg border border-slate-200 p-3 font-mono text-xs focus:ring-2"
            placeholder={`What is the maximum voltage for a DC circuit? | 50V | 100V | 150V | 50V | Electrical fundamentals | EASY | 1 | 3.1.1 | DC circuits are limited to 50V for safety`}
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400">
              {bulkText.split('\n').filter((l) => l.trim()).length} lines
            </span>
            <button
              onClick={handleBulkImport}
              disabled={bulkImporting || !bulkText.trim()}
              className="bg-aerojet-blue flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {bulkImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Import Questions'}
            </button>
          </div>
          {importResult && (
            <div
              className={`mt-3 rounded-lg p-3 text-xs ${importResult.errors.length > 0 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}
            >
              <p className="font-bold">{importResult.count} questions imported successfully</p>
              {importResult.errors.length > 0 && (
                <ul className="mt-1 list-inside list-disc">
                  {importResult.errors.map((err, i) => (
                    <li key={i}>
                      Row {err.row}: {err.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {questions.length === 0 ? (
        <div className="py-12 text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-400">No questions in this bank yet.</p>
          <button
            onClick={handleCreate}
            className="text-aerojet-blue mt-3 text-xs font-bold hover:underline"
          >
            Add your first question
          </button>
        </div>
      ) : (
        <QuestionList
          questions={questions}
          selectedIds={selectedIds}
          showRetired={showRetired}
          restoring={restoring}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onBulkDelete={handleBulkDelete}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onRestore={handleRestore}
        />
      )}
    </div>
  )
}

// Separate component for the question list to avoid IIFE issues
function QuestionList({
  questions,
  selectedIds,
  showRetired,
  restoring,
  onToggleSelect,
  onToggleSelectAll,
  onBulkDelete,
  onEdit,
  onDelete,
  onRestore,
}: {
  questions: Question[]
  selectedIds: Set<string>
  showRetired: boolean
  restoring: string | null
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  onBulkDelete: () => void
  onEdit: (q: Question) => void
  onDelete: (id: string) => void
  onRestore: (id: string) => void
}) {
  const activeQuestions = questions.filter((q) => q.isActive)
  const retiredQuestions = questions.filter((q) => !q.isActive)
  const displayQuestions = showRetired ? [...activeQuestions, ...retiredQuestions] : activeQuestions

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-900/30 dark:bg-blue-900/10">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {selectedIds.size} question{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <button
            onClick={onBulkDelete}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
          >
            <Trash2 className="h-3 w-3" />
            Retire Selected
          </button>
        </div>
      )}

      {/* Select All Header */}
      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-700 dark:bg-slate-800/50">
        <button
          onClick={onToggleSelectAll}
          className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          {selectedIds.size === displayQuestions.length && displayQuestions.length > 0 ? (
            <CheckSquare className="h-4 w-4 text-blue-600" />
          ) : (
            <Square className="h-4 w-4" />
          )}
          {selectedIds.size === displayQuestions.length && displayQuestions.length > 0
            ? 'Deselect All'
            : 'Select All'}
        </button>
        <span className="text-xs text-slate-400">
          ({selectedIds.size} of {displayQuestions.length})
        </span>
      </div>

      {/* Retired Section Header */}
      {showRetired && retiredQuestions.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 dark:border-amber-900/30 dark:bg-amber-900/10">
          <RotateCcw className="h-4 w-4 text-amber-600" />
          <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
            Retired Questions ({retiredQuestions.length}) — Click restore to reactivate
          </span>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-2">
        {displayQuestions.map((q, i) => (
          <div
            key={q.id}
            className={`flex items-start justify-between rounded-xl border p-4 transition-colors ${
              !q.isActive
                ? 'border-amber-200 bg-amber-50/30 opacity-75 dark:border-amber-900/30 dark:bg-amber-900/10'
                : selectedIds.has(q.id)
                  ? 'border-blue-300 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-900/20'
                  : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50'
            }`}
          >
            <div className="flex items-start gap-3">
              {q.isActive ? (
                <button onClick={() => onToggleSelect(q.id)} className="mt-1 flex-shrink-0">
                  {selectedIds.has(q.id) ? (
                    <CheckSquare className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Square className="h-4 w-4 text-slate-400" />
                  )}
                </button>
              ) : (
                <div className="mt-1 flex h-4 w-4 items-center justify-center">
                  <RotateCcw className="h-4 w-4 text-amber-500" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400">
                  <span
                    className={`rounded px-1.5 py-0.5 ${
                      q.status === 'APPROVED'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : q.status === 'REJECTED'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                    }`}
                  >
                    {q.status}
                  </span>
                  <span>{q.difficulty}</span>
                  <span>•</span>
                  <span>{q.points} pts</span>
                  {q.subTopic && (
                    <>
                      <span>•</span>
                      <span>{q.subTopic}</span>
                    </>
                  )}
                  {!q.isActive && (
                    <>
                      <span>•</span>
                      <span className="text-red-500">RETIRED</span>
                    </>
                  )}
                </div>
                <p className="mt-1.5 text-sm font-medium text-slate-800 dark:text-slate-200">
                  {q.text}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span>A: {q.options[0]}</span>
                  <span>B: {q.options[1]}</span>
                  <span>C: {q.options[2]}</span>
                  <span className="font-bold text-emerald-600">Ans: {q.correctAnswer}</span>
                </div>
                {q.explanation && (
                  <p className="mt-1.5 line-clamp-2 text-xs text-slate-400 italic">
                    {q.explanation}
                  </p>
                )}
              </div>
            </div>
            <div className="ml-3 flex items-center gap-1">
              {q.isActive ? (
                <>
                  <button
                    onClick={() => onEdit(q)}
                    aria-label={`Edit question ${i + 1}`}
                    className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(q.id)}
                    aria-label={`Retire question ${i + 1}`}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onRestore(q.id)}
                  disabled={restoring === q.id}
                  aria-label={`Restore question ${i + 1}`}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                >
                  {restoring === q.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  Restore
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
