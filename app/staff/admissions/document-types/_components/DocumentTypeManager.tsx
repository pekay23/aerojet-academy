'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, GripVertical, Check, X, FileText, Loader2 } from 'lucide-react'
import { useFormDirty } from '@/hooks/useFormDirty'

interface DocumentType {
  id: string
  name: string
  slug: string
  description: string | null
  fileTypes: string
  maxSizeMB: number
  isRequired: boolean
  applicableProgrammes: string[]
  sortOrder: number
  isActive: boolean
  _count: { documents: number }
}

const PROGRAMME_OPTIONS = [
  { value: 'FULL_TIME_4YEAR', label: '4-Year Full-Time' },
  { value: 'FULL_TIME_2YEAR', label: '2-Year Full-Time' },
  { value: 'MILITARY_1YEAR', label: 'Military 1-Year' },
  { value: 'MODULAR', label: 'Modular' },
  { value: 'EXAM_ONLY', label: 'Exam Only' },
]

export default function DocumentTypeManager() {
  const [docTypes, setDocTypes] = useState<DocumentType[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    fileTypes: 'application/pdf,image/jpeg,image/png',
    maxSizeMB: 4,
    isRequired: true,
    applicableProgrammes: [] as string[],
    sortOrder: 0,
    isActive: true,
  })

  const { markDirty, markClean } = useFormDirty()

  const fetchTypes = useCallback(async () => {
    try {
      const res = await fetch('/api/staff/admissions/document-types')
      const json = await res.json()
      if (json.data) setDocTypes(json.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTypes()
  }, [fetchTypes])

  const autoSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

  const resetForm = () => {
    setForm({
      name: '',
      slug: '',
      description: '',
      fileTypes: 'application/pdf,image/jpeg,image/png',
      maxSizeMB: 4,
      isRequired: true,
      applicableProgrammes: [],
      sortOrder: docTypes.length,
      isActive: true,
    })
    setEditingId(null)
    setShowForm(false)
    markClean()
  }

  const handleSave = async () => {
    if (!form.name || !form.slug) return
    setSaving(true)
    try {
      const url = editingId
        ? `/api/staff/admissions/document-types/${editingId}`
        : '/api/staff/admissions/document-types'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        markClean()
        resetForm()
        fetchTypes()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (dt: DocumentType) => {
    setForm({
      name: dt.name,
      slug: dt.slug,
      description: dt.description ?? '',
      fileTypes: dt.fileTypes,
      maxSizeMB: dt.maxSizeMB,
      isRequired: dt.isRequired,
      applicableProgrammes: dt.applicableProgrammes,
      sortOrder: dt.sortOrder,
      isActive: dt.isActive,
    })
    setEditingId(dt.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document type?')) return
    await fetch(`/api/staff/admissions/document-types/${id}`, { method: 'DELETE' })
    fetchTypes()
  }

  const toggleActive = async (dt: DocumentType) => {
    await fetch(`/api/staff/admissions/document-types/${dt.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !dt.isActive }),
    })
    fetchTypes()
  }

  const toggleProgramme = (prog: string) => {
    setForm((prev) => ({
      ...prev,
      applicableProgrammes: prev.applicableProgrammes.includes(prog)
        ? prev.applicableProgrammes.filter((p) => p !== prog)
        : [...prev.applicableProgrammes, prog],
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="text-aerojet-blue h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-aerojet-blue text-2xl font-black tracking-tight sm:text-3xl dark:text-white">
            Document Types
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Configure which documents applicants must upload during the admissions process.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className="bg-aerojet-blue shadow-aerojet-blue/20 hover:shadow-aerojet-blue/30 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl"
        >
          <Plus className="h-4 w-4" /> Add Type
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <h3 className="text-aerojet-blue mb-4 text-lg font-black dark:text-white">
            {editingId ? 'Edit Document Type' : 'New Document Type'}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold tracking-widest text-slate-500 uppercase">
                Name *
              </label>
              <input
                value={form.name}
                onChange={(e) => {
                  setForm((f) => ({
                    ...f,
                    name: e.target.value,
                    ...(!editingId ? { slug: autoSlug(e.target.value) } : {}),
                  }))
                  markDirty()
                }}
                className="focus:border-aerojet-blue focus:ring-aerojet-blue/20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="e.g. National ID"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold tracking-widest text-slate-500 uppercase">
                Slug *
              </label>
              <input
                value={form.slug}
                onChange={(e) => {
                  setForm((f) => ({ ...f, slug: e.target.value }))
                  markDirty()
                }}
                className="focus:border-aerojet-blue focus:ring-aerojet-blue/20 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm focus:ring-2 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="e.g. national-id"
                disabled={!!editingId}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-bold tracking-widest text-slate-500 uppercase">
                Description
              </label>
              <input
                value={form.description}
                onChange={(e) => {
                  setForm((f) => ({ ...f, description: e.target.value }))
                  markDirty()
                }}
                className="focus:border-aerojet-blue focus:ring-aerojet-blue/20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="Brief description for applicants"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold tracking-widest text-slate-500 uppercase">
                Max Size (MB)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={form.maxSizeMB}
                onChange={(e) => {
                  setForm((f) => ({ ...f, maxSizeMB: parseInt(e.target.value) || 4 }))
                  markDirty()
                }}
                className="focus:border-aerojet-blue focus:ring-aerojet-blue/20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="flex items-end gap-6">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={form.isRequired}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, isRequired: e.target.checked }))
                    markDirty()
                  }}
                  className="text-aerojet-blue h-4 w-4 rounded border-slate-300"
                />
                Required
              </label>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, isActive: e.target.checked }))
                    markDirty()
                  }}
                  className="text-aerojet-blue h-4 w-4 rounded border-slate-300"
                />
                Active
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-2 block text-xs font-bold tracking-widest text-slate-500 uppercase">
                Applicable Programmes
                <span className="ml-2 text-[10px] font-medium text-slate-400 normal-case">
                  (empty = all programmes)
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                {PROGRAMME_OPTIONS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => toggleProgramme(p.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      form.applicableProgrammes.includes(p.value)
                        ? 'bg-aerojet-blue text-white shadow-md'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !form.name || !form.slug}
              className="bg-aerojet-blue flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:shadow-lg disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {editingId ? 'Update' : 'Create'}
            </button>
            <button
              onClick={resetForm}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400"
            >
              <X className="h-4 w-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {docTypes.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <FileText className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p className="text-sm font-bold text-slate-400">No document types configured yet.</p>
            <p className="mt-1 text-xs text-slate-400">Create your first one to get started.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50/50 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:bg-slate-800/20">
              <tr>
                <th className="px-6 py-4 text-left">Document</th>
                <th className="px-4 py-4 text-center">Required</th>
                <th className="px-4 py-4 text-center">Max Size</th>
                <th className="px-4 py-4 text-center">Programmes</th>
                <th className="px-4 py-4 text-center">Uploads</th>
                <th className="px-4 py-4 text-center">Status</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {docTypes.map((dt) => (
                <tr
                  key={dt.id}
                  className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-slate-300" />
                      <div>
                        <span className="text-aerojet-blue font-black dark:text-white">
                          {dt.name}
                        </span>
                        <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 dark:bg-slate-800">
                          {dt.slug}
                        </span>
                        {dt.description && (
                          <p className="mt-0.5 text-xs text-slate-400">{dt.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {dt.isRequired ? (
                      <span className="rounded-lg bg-red-50 px-2 py-1 text-[10px] font-black text-red-600">
                        Required
                      </span>
                    ) : (
                      <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-400">
                        Optional
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center text-xs font-bold text-slate-500">
                    {dt.maxSizeMB} MB
                  </td>
                  <td className="px-4 py-4 text-center">
                    {dt.applicableProgrammes.length === 0 ? (
                      <span className="text-[10px] font-bold text-green-600">All</span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400">
                        {dt.applicableProgrammes.length} selected
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-600">
                      {dt._count.documents}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button onClick={() => toggleActive(dt)}>
                      <span
                        className={`rounded-lg px-2 py-1 text-[10px] font-black ${
                          dt.isActive
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {dt.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => handleEdit(dt)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {dt._count.documents === 0 && (
                        <button
                          onClick={() => handleDelete(dt.id)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
