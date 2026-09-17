'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Plus,
  Clock,
  Wrench,
  Shield,
  FileCheck,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Edit,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { useConfirmDialog } from '@/hooks/use-confirm-dialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { LogbookPreview } from '@/components/shared/LogbookPreview'
import ReviewSignoffPanel from './ReviewSignoffPanel'
import MentorAssignments from './MentorAssignments'

interface Entry {
  id: string
  date: string
  aircraftType: string
  aircraftRegistration: string
  ataChapter: { id?: string; code: string; title: string; category: string }
  ataChapterId: string // Needed for form binding
  taskDescription: string
  workOrderReference: string | null
  maintenanceManualRef: string | null
  maintenanceType: string
  durationHours: number
  supervisorId: string
  supervisorSignature: boolean
  studentSignature: boolean
  verifiedByManagement: boolean
  licenceCategory: string | null
  workEnvironment: string | null
  toolsUsed: string | null
  partNumbersUsed: string | null
  safetyPrecautions: string | null
  competencyRating: number | null
}

interface LogbookData {
  id: string
  studentName: string
  studentId: string
  email: string
  programme: string
  licenceCategory: string
  facilityName: string
  facilityApprovalNo: string | null
  startDate: string
  targetEndDate: string | null
  totalLoggedHours: number
  status: string
  entries: Entry[]
  analytics: {
    monthsExperience: number
    totalHours: number
    hoursByType: Record<string, number>
    ataChaptersCovered: number
    totalATAChapters: number
    signedEntries: number
    unsignedEntries: number
  }
  mentorAssignments: Array<{
    id: string
    mentorId: string
    assignedDate: string
    endDate?: string | null
    isPrimary: boolean
    notes: string | null
  }>
}

interface ATAOption {
  id: string
  label: string
  category: string
}

interface SupervisorOption {
  id: string
  label: string
}

const MAINTENANCE_TYPES = [
  'LINE',
  'BASE',
  'COMPONENT_OVERHAUL',
  'ENGINE_OVERHAUL',
  'MODIFICATION',
  'REPAIR',
  'TROUBLESHOOTING',
  'INSPECTION',
  'SERVICING',
  'NDT',
]

const WORK_ENVIRONMENTS = ['HANGAR', 'APRON', 'WORKSHOP', 'SIMULATOR']
const LICENCE_CATEGORIES = ['A', 'B1', 'B2', 'B3', 'C']

const TYPE_COLORS: Record<string, string> = {
  LINE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  BASE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  COMPONENT_OVERHAUL: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  ENGINE_OVERHAUL: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  MODIFICATION: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  REPAIR: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  TROUBLESHOOTING: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  INSPECTION: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  SERVICING: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  NDT: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
}

export default function LogbookDetail({
  logbook,
  ataChapters,
  supervisors,
  staffId,
  mentorAssignments = [],
}: {
  logbook: LogbookData
  ataChapters: ATAOption[]
  supervisors: SupervisorOption[]
  staffId: string
  mentorAssignments: LogbookData['mentorAssignments']
}) {
  const router = useRouter()
  const confirmDialog = useConfirmDialog()
  const [showForm, setShowForm] = useState(false)
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null)

  const defaultFormValues = {
    date: new Date().toISOString().split('T')[0],
    aircraftType: '',
    aircraftRegistration: '',
    ataChapterId: ataChapters[0]?.id || '',
    taskDescription: '',
    workOrderReference: '',
    maintenanceManualRef: '',
    maintenanceType: 'LINE',
    durationHours: 1,
    supervisorId: supervisors[0]?.id || '',
    licenceCategory: logbook.licenceCategory,
    workEnvironment: '',
    toolsUsed: '',
    partNumbersUsed: '',
    safetyPrecautions: '',
  }

  const [form, setForm] = useState(defaultFormValues)
  const [editingFacility, setEditingFacility] = useState(false)
  const [facilityForm, setFacilityForm] = useState({
    facilityName: logbook.facilityName,
    facilityApprovalNo: logbook.facilityApprovalNo || '',
  })
  const [savingFacility, setSavingFacility] = useState(false)

  const handleCreateClick = () => {
    setForm(defaultFormValues)
    setEditingEntryId(null)
    setShowForm(!showForm)
  }

  const handleEditClick = (entry: Entry) => {
    setEditingEntryId(entry.id)
    setForm({
      date: new Date(entry.date).toISOString().split('T')[0],
      aircraftType: entry.aircraftType,
      aircraftRegistration: entry.aircraftRegistration,
      ataChapterId: entry.ataChapter?.id || entry.ataChapterId || ataChapters[0]?.id || '',
      taskDescription: entry.taskDescription,
      workOrderReference: entry.workOrderReference || '',
      maintenanceManualRef: entry.maintenanceManualRef || '',
      maintenanceType: entry.maintenanceType,
      durationHours: entry.durationHours,
      supervisorId: entry.supervisorId,
      licenceCategory: entry.licenceCategory || logbook.licenceCategory,
      workEnvironment: entry.workEnvironment || '',
      toolsUsed: entry.toolsUsed || '',
      partNumbersUsed: entry.partNumbersUsed || '',
      safetyPrecautions: entry.safetyPrecautions || '',
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteClick = (entryId: string) => {
    confirmDialog.confirm({
      title: 'Delete Logbook Entry',
      description:
        'Are you sure you want to permanently delete this OJT experience entry? Total hours will be recalculated.',
      onConfirm: async () => {
        setSaving(true)
        try {
          const res = await fetch(`/api/staff/ojt/entries/${entryId}`, { method: 'DELETE' })
          if (res.ok) {
            toast.success('Entry deleted')
            router.refresh()
          } else {
            toast.error('Failed to delete entry')
          }
        } catch {
          toast.error('An error occurred')
        } finally {
          setSaving(false)
          confirmDialog.close()
        }
      },
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const isEdit = !!editingEntryId
      const url = isEdit
        ? `/api/staff/ojt/entries/${editingEntryId}`
        : `/api/staff/ojt/${logbook.id}`
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          durationHours: Number(form.durationHours),
        }),
      })

      if (res.ok) {
        toast.success(isEdit ? 'Logbook entry updated' : 'Logbook entry added')
        setShowForm(false)
        setEditingEntryId(null)
        setForm(defaultFormValues)
        router.refresh()
      } else {
        const json = await res.json()
        toast.error(json.error || 'Failed to save entry')
      }
    } catch {
      toast.error('An error occurred.')
    } finally {
      setSaving(false)
    }
  }

  const a = logbook.analytics

  return (
    <div className="space-y-6">
      {/* Premium Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={confirmDialog.onOpenChange}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        loading={saving}
      />

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/staff/ojt"
          className="hover:text-aerojet-blue flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-aerojet-blue text-2xl font-black dark:text-white">
            {logbook.studentName}
          </h1>
          {editingFacility ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                setSavingFacility(true)
                try {
                  const res = await fetch(`/api/staff/ojt/${logbook.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(facilityForm),
                  })
                  if (!res.ok) throw new Error('Failed to update')
                  toast.success('Facility details updated')
                  setEditingFacility(false)
                  router.refresh()
                } catch {
                  toast.error('Failed to update facility details')
                } finally {
                  setSavingFacility(false)
                }
              }}
              className="mt-1 flex items-center gap-2"
            >
              <input
                type="text"
                value={facilityForm.facilityName}
                onChange={(e) => setFacilityForm({ ...facilityForm, facilityName: e.target.value })}
                className="rounded-lg border border-slate-200 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800"
                placeholder="Facility name"
              />
              <input
                type="text"
                value={facilityForm.facilityApprovalNo}
                onChange={(e) =>
                  setFacilityForm({ ...facilityForm, facilityApprovalNo: e.target.value })
                }
                className="rounded-lg border border-slate-200 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800"
                placeholder="Approval No."
              />
              <button
                type="submit"
                disabled={savingFacility}
                className="bg-aerojet-blue rounded-lg px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
              >
                {savingFacility ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingFacility(false)
                  setFacilityForm({
                    facilityName: logbook.facilityName,
                    facilityApprovalNo: logbook.facilityApprovalNo || '',
                  })
                }}
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
            </form>
          ) : (
            <p className="text-sm text-slate-500">
              {logbook.studentId} · {logbook.licenceCategory} · {logbook.facilityName}
              {logbook.facilityApprovalNo && ` (${logbook.facilityApprovalNo})`}
              <button
                onClick={() => setEditingFacility(true)}
                className="hover:text-aerojet-blue ml-2 rounded p-1 text-slate-400"
                title="Edit facility details"
              >
                <Edit className="h-3.5 w-3.5" />
              </button>
            </p>
          )}
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            logbook.status === 'ACTIVE'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : logbook.status === 'COMPLETED'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          }`}
        >
          {logbook.status}
        </span>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-400 uppercase">
            <Clock className="h-3.5 w-3.5" /> Total Hours
          </div>
          <div className="mt-1 text-2xl font-black text-slate-800 dark:text-white">
            {a.totalHours}h
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-400 uppercase">
            <Wrench className="h-3.5 w-3.5" /> Entries
          </div>
          <div className="mt-1 text-2xl font-black text-slate-800 dark:text-white">
            {logbook.entries.length}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-400 uppercase">
            <Shield className="h-3.5 w-3.5" /> ATA Coverage
          </div>
          <div className="mt-1 text-2xl font-black text-slate-800 dark:text-white">
            {a.ataChaptersCovered}/{a.totalATAChapters}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-400 uppercase">
            <FileCheck className="h-3.5 w-3.5" /> Signed
          </div>
          <div className="mt-1 text-2xl font-black text-green-600">{a.signedEntries}</div>
          {a.unsignedEntries > 0 && (
            <div className="text-xs text-amber-500">{a.unsignedEntries} unsigned</div>
          )}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            Experience
          </div>
          <div className="mt-1 text-2xl font-black text-slate-800 dark:text-white">
            {a.monthsExperience} mo
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            Line / Base
          </div>
          <div className="mt-1 text-lg font-black text-slate-800 dark:text-white">
            {a.hoursByType['LINE'] || 0}h / {a.hoursByType['BASE'] || 0}h
          </div>
        </div>
      </div>

      {/* Maintenance type breakdown */}
      {Object.keys(a.hoursByType).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(a.hoursByType)
            .sort((a, b) => b[1] - a[1])
            .map(([type, hours]) => (
              <span
                key={type}
                className={`rounded-full px-3 py-1 text-xs font-bold ${TYPE_COLORS[type] || 'bg-slate-100 text-slate-600'}`}
              >
                {type.replace(/_/g, ' ')}: {hours}h
              </span>
            ))}
        </div>
      )}

      <LogbookPreview mode="staff" logbook={logbook} />

      {/* Add / Edit Entry Form */}
      {logbook.status === 'ACTIVE' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={handleCreateClick}
            className="flex w-full items-center justify-between px-6 py-4"
          >
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-white">
              <Plus className="text-aerojet-blue h-5 w-5" />{' '}
              {editingEntryId ? 'Edit Logbook Entry' : 'Add Logbook Entry'}
            </div>
            {showForm ? (
              <ChevronUp className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}
          </button>

          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="border-t border-slate-200 px-6 py-5 dark:border-slate-800"
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Date
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Aircraft Type
                  </label>
                  <input
                    value={form.aircraftType}
                    onChange={(e) => setForm({ ...form, aircraftType: e.target.value })}
                    required
                    placeholder="e.g. B737-800"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Registration
                  </label>
                  <input
                    value={form.aircraftRegistration}
                    onChange={(e) => setForm({ ...form, aircraftRegistration: e.target.value })}
                    required
                    placeholder="e.g. 9H-ABC"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                    ATA Chapter
                  </label>
                  <select
                    value={form.ataChapterId}
                    onChange={(e) => setForm({ ...form, ataChapterId: e.target.value })}
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {ataChapters.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Maintenance Type
                  </label>
                  <select
                    value={form.maintenanceType}
                    onChange={(e) => setForm({ ...form, maintenanceType: e.target.value })}
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {MAINTENANCE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Duration (hours)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    value={form.durationHours}
                    onChange={(e) =>
                      setForm({ ...form, durationHours: parseFloat(e.target.value) || 0.25 })
                    }
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Supervisor
                  </label>
                  <select
                    value={form.supervisorId}
                    onChange={(e) => setForm({ ...form, supervisorId: e.target.value })}
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {supervisors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Licence Category
                  </label>
                  <select
                    value={form.licenceCategory}
                    onChange={(e) => setForm({ ...form, licenceCategory: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {LICENCE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Work Environment
                  </label>
                  <select
                    value={form.workEnvironment}
                    onChange={(e) => setForm({ ...form, workEnvironment: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">Select...</option>
                    {WORK_ENVIRONMENTS.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Task Description
                  </label>
                  <textarea
                    value={form.taskDescription}
                    onChange={(e) => setForm({ ...form, taskDescription: e.target.value })}
                    required
                    rows={3}
                    placeholder="Detailed description of maintenance task performed..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Work Order Ref
                  </label>
                  <input
                    value={form.workOrderReference}
                    onChange={(e) => setForm({ ...form, workOrderReference: e.target.value })}
                    placeholder="WO-2026-001"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Manual Reference
                  </label>
                  <input
                    value={form.maintenanceManualRef}
                    onChange={(e) => setForm({ ...form, maintenanceManualRef: e.target.value })}
                    placeholder="AMM 32-10-01"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Tools / Equipment Used
                  </label>
                  <input
                    value={form.toolsUsed}
                    onChange={(e) => setForm({ ...form, toolsUsed: e.target.value })}
                    placeholder="Torque wrench, multimeter"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Part Numbers Used
                  </label>
                  <input
                    value={form.partNumbersUsed}
                    onChange={(e) => setForm({ ...form, partNumbersUsed: e.target.value })}
                    placeholder="P/N 12345-01"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Safety Precautions
                  </label>
                  <input
                    value={form.safetyPrecautions}
                    onChange={(e) => setForm({ ...form, safetyPrecautions: e.target.value })}
                    placeholder="LOTO applied, aircraft grounded, safety pins installed"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingEntryId(null)
                  }}
                  className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-aerojet-blue flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {editingEntryId ? 'Update Entry' : 'Add Entry'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Entries Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Aircraft</th>
              <th className="px-4 py-3 font-medium">ATA</th>
              <th className="px-4 py-3 font-medium">Task</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Hours</th>
              <th className="px-4 py-3 font-medium">Signed</th>
              <th className="w-10 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {logbook.entries.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  No logbook entries yet. Add the first entry above.
                </td>
              </tr>
            ) : (
              logbook.entries.map((entry) => (
                <React.Fragment key={entry.id}>
                  <tr
                    onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                    className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                      {format(new Date(entry.date), 'dd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800 dark:text-white">
                        {entry.aircraftType}
                      </div>
                      <div className="text-xs text-slate-500">{entry.aircraftRegistration}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {entry.ataChapter.code}
                      </span>
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-600 dark:text-slate-300">
                      {entry.taskDescription}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${TYPE_COLORS[entry.maintenanceType] || ''}`}
                      >
                        {entry.maintenanceType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-white">
                      {entry.durationHours}h
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {entry.supervisorSignature ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-slate-300" />
                        )}
                        {entry.studentSignature ? (
                          <CheckCircle2 className="h-4 w-4 text-blue-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-slate-300" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {expandedEntry === entry.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </td>
                  </tr>
                  {expandedEntry === entry.id && (
                    <tr key={`${entry.id}-detail`}>
                      <td colSpan={8} className="bg-slate-50 px-6 py-4 dark:bg-slate-800/30">
                        <div className="grid gap-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <span className="font-bold text-slate-400">ATA Chapter</span>
                            <p className="text-slate-700 dark:text-slate-300">
                              {entry.ataChapter.code} — {entry.ataChapter.title}
                            </p>
                          </div>
                          <div>
                            <span className="font-bold text-slate-400">Full Description</span>
                            <p className="text-slate-700 dark:text-slate-300">
                              {entry.taskDescription}
                            </p>
                          </div>
                          {entry.workOrderReference && (
                            <div>
                              <span className="font-bold text-slate-400">Work Order</span>
                              <p className="text-slate-700 dark:text-slate-300">
                                {entry.workOrderReference}
                              </p>
                            </div>
                          )}
                          {entry.maintenanceManualRef && (
                            <div>
                              <span className="font-bold text-slate-400">Manual Ref</span>
                              <p className="text-slate-700 dark:text-slate-300">
                                {entry.maintenanceManualRef}
                              </p>
                            </div>
                          )}
                          {entry.licenceCategory && (
                            <div>
                              <span className="font-bold text-slate-400">Licence Category</span>
                              <p className="text-slate-700 dark:text-slate-300">
                                {entry.licenceCategory}
                              </p>
                            </div>
                          )}
                          {entry.workEnvironment && (
                            <div>
                              <span className="font-bold text-slate-400">Work Environment</span>
                              <p className="text-slate-700 dark:text-slate-300">
                                {entry.workEnvironment}
                              </p>
                            </div>
                          )}
                          {entry.toolsUsed && (
                            <div>
                              <span className="font-bold text-slate-400">Tools / Equipment</span>
                              <p className="text-slate-700 dark:text-slate-300">
                                {entry.toolsUsed}
                              </p>
                            </div>
                          )}
                          {entry.partNumbersUsed && (
                            <div>
                              <span className="font-bold text-slate-400">Part Numbers</span>
                              <p className="text-slate-700 dark:text-slate-300">
                                {entry.partNumbersUsed}
                              </p>
                            </div>
                          )}
                          {entry.safetyPrecautions && (
                            <div className="sm:col-span-2">
                              <span className="font-bold text-slate-400">Safety Precautions</span>
                              <p className="text-slate-700 dark:text-slate-300">
                                {entry.safetyPrecautions}
                              </p>
                            </div>
                          )}
                          {entry.competencyRating && (
                            <div>
                              <span className="font-bold text-slate-400">Competency Rating</span>
                              <p className="text-slate-700 dark:text-slate-300">
                                {entry.competencyRating}/5
                              </p>
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-400">Signatures</span>
                            <div className="mt-1 space-y-0.5">
                              <div className="flex items-center gap-1">
                                {entry.supervisorSignature ? (
                                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-slate-300" />
                                )}
                                <span className="text-slate-600 dark:text-slate-300">
                                  Supervisor
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {entry.studentSignature ? (
                                  <CheckCircle2 className="h-3 w-3 text-blue-500" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-slate-300" />
                                )}
                                <span className="text-slate-600 dark:text-slate-300">Student</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {entry.verifiedByManagement ? (
                                  <CheckCircle2 className="h-3 w-3 text-purple-500" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-slate-300" />
                                )}
                                <span className="text-slate-600 dark:text-slate-300">
                                  Management
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Controls */}
                          <div className="flex items-center gap-3 border-t border-slate-200/60 pt-3 sm:col-span-2 lg:col-span-4 dark:border-slate-700/60">
                            <span className="font-bold text-slate-400">Admin Controls:</span>
                            <button
                              onClick={() => handleEditClick(entry)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600 transition hover:bg-slate-100 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            >
                              <Edit className="h-3.5 w-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClick(entry.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600 transition hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ReviewSignoffPanel entries={logbook.entries} logbookId={logbook.id} staffId={staffId} />
      <MentorAssignments
        logbookId={logbook.id}
        mentorAssignments={mentorAssignments}
        availableMentors={supervisors}
        staffId={staffId}
      />
    </div>
  )
}

import React from 'react'
