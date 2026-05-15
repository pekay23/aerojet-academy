'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Check, X, Calendar, Users, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface IntakeCycle {
  id: string
  name: string
  description: string | null
  startDate: string
  endDate: string
  isActive: boolean
  academicYear: { id: string; name: string } | null
  _count: { applications: number }
}

interface AcademicYear {
  id: string
  name: string
}

export default function IntakeCycleManager() {
  const [cycles, setCycles] = useState<IntakeCycle[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    academicYearId: '' as string | null,
    startDate: '',
    endDate: '',
    isActive: true,
  })

  const fetchCycles = useCallback(async () => {
    try {
      const res = await fetch('/api/staff/admissions/intake-cycles?limit=50')
      const json = await res.json()
      if (json.data) setCycles(json.data)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAcademicYears = useCallback(async () => {
    try {
      const res = await fetch('/api/staff/academic-years')
      const json = await res.json()
      if (json.data) setAcademicYears(json.data)
    } catch {
      // Non-critical
    }
  }, [])

  useEffect(() => {
    fetchCycles()
    fetchAcademicYears()
  }, [fetchCycles, fetchAcademicYears])

  const resetForm = () => {
    setForm({ name: '', description: '', academicYearId: null, startDate: '', endDate: '', isActive: true })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSave = async () => {
    if (!form.name || !form.startDate || !form.endDate) return
    setSaving(true)
    try {
      const url = editingId
        ? `/api/staff/admissions/intake-cycles/${editingId}`
        : '/api/staff/admissions/intake-cycles'
      const method = editingId ? 'PUT' : 'POST'
      const payload = {
        ...form,
        academicYearId: form.academicYearId || null,
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        resetForm()
        fetchCycles()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (cycle: IntakeCycle) => {
    setForm({
      name: cycle.name,
      description: cycle.description ?? '',
      academicYearId: cycle.academicYear?.id ?? null,
      startDate: cycle.startDate.split('T')[0],
      endDate: cycle.endDate.split('T')[0],
      isActive: cycle.isActive,
    })
    setEditingId(cycle.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this intake cycle?')) return
    await fetch(`/api/staff/admissions/intake-cycles/${id}`, { method: 'DELETE' })
    fetchCycles()
  }

  const toggleActive = async (cycle: IntakeCycle) => {
    await fetch(`/api/staff/admissions/intake-cycles/${cycle.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !cycle.isActive }),
    })
    fetchCycles()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-aerojet-blue" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-aerojet-blue dark:text-white sm:text-3xl">
            Intake Cycles
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Manage admissions intake periods and link them to academic years.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-2 rounded-xl bg-aerojet-blue px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-aerojet-blue/20 transition-all hover:shadow-xl hover:shadow-aerojet-blue/30"
        >
          <Plus className="h-4 w-4" /> New Cycle
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-4 text-lg font-black text-aerojet-blue dark:text-white">
            {editingId ? 'Edit Intake Cycle' : 'New Intake Cycle'}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-500">Name *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-aerojet-blue focus:outline-none focus:ring-2 focus:ring-aerojet-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="e.g. September 2026 Intake"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-500">Description</label>
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-aerojet-blue focus:outline-none focus:ring-2 focus:ring-aerojet-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="Optional description"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-500">Start Date *</label>
              <input
                type="date"
                value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-aerojet-blue focus:outline-none focus:ring-2 focus:ring-aerojet-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-500">End Date *</label>
              <input
                type="date"
                value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-aerojet-blue focus:outline-none focus:ring-2 focus:ring-aerojet-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-500">Academic Year</label>
              <select
                value={form.academicYearId ?? ''}
                onChange={e => setForm(f => ({ ...f, academicYearId: e.target.value || null }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-aerojet-blue focus:outline-none focus:ring-2 focus:ring-aerojet-blue/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="">None</option>
                {academicYears.map(ay => (
                  <option key={ay.id} value={ay.id}>{ay.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-aerojet-blue"
                />
                Active
              </label>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !form.name || !form.startDate || !form.endDate}
              className="flex items-center gap-2 rounded-xl bg-aerojet-blue px-5 py-2.5 text-sm font-bold text-white transition-all hover:shadow-lg disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
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

      {/* List */}
      {cycles.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Calendar className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <p className="text-sm font-bold text-slate-400">No intake cycles yet.</p>
          <p className="mt-1 text-xs text-slate-400">Create your first intake cycle to start grouping applicants.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cycles.map(cycle => (
            <div
              key={cycle.id}
              className={`group relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition-all hover:shadow-xl dark:bg-slate-900 ${
                cycle.isActive
                  ? 'border-emerald-200 dark:border-emerald-800'
                  : 'border-slate-100 opacity-60 dark:border-slate-800'
              }`}
            >
              {/* Status dot */}
              <div className={`absolute right-4 top-4 h-2.5 w-2.5 rounded-full ${cycle.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />

              <h3 className="pr-8 text-base font-black text-aerojet-blue dark:text-white">{cycle.name}</h3>
              {cycle.description && (
                <p className="mt-1 text-xs text-slate-400">{cycle.description}</p>
              )}

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(cycle.startDate), 'MMM d, yyyy')} — {format(new Date(cycle.endDate), 'MMM d, yyyy')}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Users className="h-3.5 w-3.5" />
                  {cycle._count.applications} application{cycle._count.applications !== 1 ? 's' : ''}
                </div>
                {cycle.academicYear && (
                  <div className="mt-1">
                    <span className="rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-black text-indigo-600">
                      {cycle.academicYear.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <button
                  onClick={() => handleEdit(cycle)}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </button>
                <button
                  onClick={() => toggleActive(cycle)}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-500 transition-colors hover:bg-amber-50 hover:text-amber-600"
                >
                  {cycle.isActive ? 'Deactivate' : 'Activate'}
                </button>
                {cycle._count.applications === 0 && (
                  <button
                    onClick={() => handleDelete(cycle.id)}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
