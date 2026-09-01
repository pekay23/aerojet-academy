'use client'

import { useEffect, useState, useCallback } from 'react'
import { Calendar, Clock, Plus, Trash2, Edit3, CheckCircle2, XCircle, Shield, Lock } from 'lucide-react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { TableSkeleton } from '@/components/shared/DashboardSkeleton'
import { formatDateTime } from '@/lib/utils'

interface ClassSchedule {
  id: string
  bankId: string
  classId: string
  scheduledStart: string | null
  scheduledEnd: string | null
  isActive: boolean
  allowLateStart: boolean
  sebRequired: boolean
  createdAt: string
  updatedAt: string
  class: {
    id: string
    name: string
    course: { code: string; name: string }
  }
}

interface ClassOption {
  id: string
  name: string
  course: { code: string; name: string }
}

interface BankSebConfig {
  lockdownLevel?: 'standard' | 'strict' | 'maximum'
  allowedApplications?: string[]
  blockedApplications?: string[]
  enablePrintScreen?: boolean
  enableClipboard?: boolean
  enableExitSequencer?: boolean
  allowQuit?: boolean
  showTaskbar?: boolean
  enableDeveloperTools?: boolean
}

export default function ClassSchedulePage({ bankId }: { bankId: string }) {
  const [schedules, setSchedules] = useState<ClassSchedule[]>([])
  const [availableClasses, setAvailableClasses] = useState<ClassOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [bankConfig, setBankConfig] = useState<BankSebConfig>({})
  const [savingBankConfig, setSavingBankConfig] = useState(false)

  const [form, setForm] = useState({
    classId: '',
    scheduledStart: '',
    scheduledEnd: '',
    allowLateStart: false,
    isActive: true,
    sebRequired: false,
  })

  const fetchSchedules = useCallback(async () => {
    const res = await fetch(`/api/staff/exams/internal/banks/${bankId}/schedule`)
    const json = await res.json()
    if (json.success) setSchedules(json.data || [])
  }, [bankId])

  const fetchAvailableClasses = useCallback(async () => {
    const res = await fetch('/api/staff/classes?limit=100')
    const json = await res.json()
    if (json.success) setAvailableClasses(json.data || [])
  }, [])

  const fetchBankSebConfig = useCallback(async () => {
    const res = await fetch(`/api/staff/exams/internal/banks/${bankId}/seb-config`)
    const json = await res.json()
    if (json.success && json.data) {
      setBankConfig(json.data)
    }
  }, [bankId])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      await Promise.all([fetchSchedules(), fetchAvailableClasses(), fetchBankSebConfig()])
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [fetchSchedules, fetchAvailableClasses, fetchBankSebConfig])

  const resetForm = () => {
    setForm({ classId: '', scheduledStart: '', scheduledEnd: '', allowLateStart: false, isActive: true, sebRequired: false })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async () => {
    if (!form.classId) return
    setSubmitting(true)
    const url = editingId
      ? `/api/staff/exams/internal/banks/${bankId}/schedule/${editingId}`
      : `/api/staff/exams/internal/banks/${bankId}/schedule`
    const method = editingId ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      resetForm()
      fetchSchedules()
    }
    setSubmitting(false)
  }

  const handleEdit = (schedule: ClassSchedule) => {
    setForm({
      classId: schedule.classId,
      scheduledStart: schedule.scheduledStart ? schedule.scheduledStart.slice(0, 16) : '',
      scheduledEnd: schedule.scheduledEnd ? schedule.scheduledEnd.slice(0, 16) : '',
      allowLateStart: schedule.allowLateStart,
      isActive: schedule.isActive,
      sebRequired: schedule.sebRequired,
    })
    setEditingId(schedule.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/staff/exams/internal/banks/${bankId}/schedule/${id}`, { method: 'DELETE' })
    fetchSchedules()
  }

  const handleBankConfigSave = async () => {
    setSavingBankConfig(true)
    await fetch(`/api/staff/exams/internal/banks/${bankId}/seb-config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bankConfig),
    })
    setSavingBankConfig(false)
  }

  const alreadyScheduled = schedules.map((s) => s.classId)

  if (loading) return <TableSkeleton rows={8} />

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Shield className="h-5 w-5 text-blue-700 dark:text-blue-300" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">SEB Configuration</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Lockdown settings applied to all SEB-required sessions for this exam bank.
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Lockdown Level</label>
            <select
              value={bankConfig.lockdownLevel || 'strict'}
              onChange={(e) => setBankConfig({ ...bankConfig, lockdownLevel: e.target.value as BankSebConfig['lockdownLevel'] })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="standard">Standard</option>
              <option value="strict">Strict</option>
              <option value="maximum">Maximum</option>
            </select>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={bankConfig.enablePrintScreen ?? false}
                onChange={(e) => setBankConfig({ ...bankConfig, enablePrintScreen: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              Block Print Screen
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={bankConfig.enableClipboard ?? false}
                onChange={(e) => setBankConfig({ ...bankConfig, enableClipboard: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              Block Clipboard
            </label>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={bankConfig.enableExitSequencer ?? false}
                onChange={(e) => setBankConfig({ ...bankConfig, enableExitSequencer: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              Enable Exit Sequencer
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={bankConfig.enableDeveloperTools ?? false}
                onChange={(e) => setBankConfig({ ...bankConfig, enableDeveloperTools: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              Block Dev Tools
            </label>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={bankConfig.allowQuit ?? false}
                onChange={(e) => setBankConfig({ ...bankConfig, allowQuit: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              Allow Quit
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={bankConfig.showTaskbar ?? false}
                onChange={(e) => setBankConfig({ ...bankConfig, showTaskbar: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              Show Taskbar
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Allowed Applications (one per line)</label>
            <textarea
              value={(bankConfig.allowedApplications || []).join('\n')}
              onChange={(e) => setBankConfig({ ...bankConfig, allowedApplications: e.target.value.split('\n').filter(Boolean) })}
              rows={3}
              placeholder="e.g.&#10;calc.exe&#10;notepad.exe"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Blocked Applications (one per line)</label>
            <textarea
              value={(bankConfig.blockedApplications || []).join('\n')}
              onChange={(e) => setBankConfig({ ...bankConfig, blockedApplications: e.target.value.split('\n').filter(Boolean) })}
              rows={3}
              placeholder="e.g.&#10;chrome.exe&#10;firefox.exe"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleBankConfigSave}
            disabled={savingBankConfig}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {savingBankConfig ? 'Saving...' : 'Save SEB Settings'}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Class Scheduling</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Schedule exams for specific classes. Students can only start exams within the scheduled window.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Schedule
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-4 text-base font-bold text-slate-900 dark:text-white">
            {editingId ? 'Edit Schedule' : 'New Schedule'}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Class</label>
              <select
                value={form.classId}
                onChange={(e) => setForm({ ...form, classId: e.target.value })}
                disabled={!!editingId}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white disabled:opacity-50"
              >
                <option value="">Select a class...</option>
                {availableClasses
                  .filter((c) => !editingId || c.id === form.classId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.course.code}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Start (UTC)</label>
              <input
                type="datetime-local"
                value={form.scheduledStart}
                onChange={(e) => setForm({ ...form, scheduledStart: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">End (UTC)</label>
              <input
                type="datetime-local"
                value={form.scheduledEnd}
                onChange={(e) => setForm({ ...form, scheduledEnd: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={form.allowLateStart}
                  onChange={(e) => setForm({ ...form, allowLateStart: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                Allow late start (+15 min grace)
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                Active
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800 dark:border-amber-800/50 dark:bg-amber-900/10 dark:text-amber-200">
                <input
                  type="checkbox"
                  checked={form.sebRequired}
                  onChange={(e) => setForm({ ...form, sebRequired: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <div>
                  <span className="font-bold">Require Safe Exam Browser (SEB)</span>
                  <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                    Students must use SEB to start this exam. Config files will be generated per session.
                  </span>
                </div>
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={resetForm}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!form.classId || submitting}
              className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Class</th>
              <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Start</th>
              <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">End</th>
              <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Late Start</th>
              <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">SEB</th>
              <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Status</th>
              <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {schedules.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  No schedules yet. Click "Add Schedule" to create one.
                </td>
              </tr>
            ) : (
              schedules.map((schedule) => (
                <tr key={schedule.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900 dark:text-white">{schedule.class.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{schedule.class.course.code}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {schedule.scheduledStart ? formatDateTime(schedule.scheduledStart) : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {schedule.scheduledEnd ? formatDateTime(schedule.scheduledEnd) : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {schedule.allowLateStart ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-slate-400" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {schedule.sebRequired ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        <Lock className="h-3 w-3" />
                        Required
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        schedule.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {schedule.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(schedule)}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        <Edit3 className="h-3 w-3" />
                        Edit
                      </button>
                      <ConfirmDialog
                        open={false}
                        onOpenChange={() => {}}
                        title="Delete Schedule"
                        description="Are you sure you want to delete this schedule?"
                        confirmLabel="Delete"
                        variant="destructive"
                        onConfirm={() => handleDelete(schedule.id)}
                      />
                      <button
                        onClick={() => handleDelete(schedule.id)}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
