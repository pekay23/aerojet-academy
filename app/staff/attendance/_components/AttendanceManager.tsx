'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Loader2,
  Users,
  Save,
  AlertTriangle,
} from 'lucide-react'
import { ErrorBanner } from '@/components/shared/ErrorBanner'
import { LoadingState } from '@/components/shared/LoadingState'
import { EmptyState } from '@/components/shared/EmptyState'
import { FormDirtyIndicator } from '@/components/shared/FormDirtyIndicator'
import { useFormDirty } from '@/hooks/useFormDirty'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

const STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const
type Status = (typeof STATUSES)[number]

const STATUS_CONFIG: Record<
  Status,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  PRESENT: {
    label: 'Present',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    icon: CheckCircle2,
  },
  ABSENT: {
    label: 'Absent',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    icon: XCircle,
  },
  LATE: {
    label: 'Late',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    icon: Clock,
  },
  EXCUSED: {
    label: 'Excused',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    icon: ShieldCheck,
  },
}

interface StudentRecord {
  userId: string
  status: Status
  minutesLate?: number
  notes?: string
  profile?: { firstName: string; lastName: string }
  studentId?: string
  email?: string
}

interface ClassOption {
  id: string
  name: string
  courseId: string
}

export default function AttendanceManager({ classes }: { classes: ClassOption[] }) {
  const [classId, setClassId] = useState(classes[0]?.id || '')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => void
  }>({ open: false, title: '', description: '', onConfirm: () => {} })
  const { isDirty: dirty, markDirty, markClean } = useFormDirty()
  // Track the last saved snapshot so we can detect unsaved changes
  const savedSnapshotRef = useRef<string>('')

  const fetchRoster = useCallback(async () => {
    if (!classId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/staff/attendance?classId=${classId}&date=${date}`)
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || `Request failed (${res.status})`)
      }
      const json = await res.json()
      if (json.success && json.data) {
        const { records, roster } = json.data

        // Build student list from roster, merging existing records
        type ExistingAttendanceRecord = {
          userId: string
          status: Status
          minutesLate?: number
          notes?: string
        }

        type RosterUser = {
          id: string
          email: string
          profile?: { firstName: string; lastName: string }
          studentProfile?: { studentId: string }
        }

        const existingMap = new Map<string, ExistingAttendanceRecord>(
          records.map((r: ExistingAttendanceRecord) => [r.userId, r])
        )
        const merged: StudentRecord[] = roster.map((u: RosterUser) => {
          const existing = existingMap.get(u.id)
          return {
            userId: u.id,
            status: existing?.status || 'PRESENT',
            minutesLate: existing?.minutesLate || undefined,
            notes: existing?.notes || '',
            profile: u.profile,
            studentId: u.studentProfile?.studentId,
            email: u.email,
          }
        })
        setStudents(merged)
        savedSnapshotRef.current = JSON.stringify(merged)
        markClean()
      } else {
        throw new Error(json.error || 'Failed to load attendance data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [classId, date, markClean])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchRoster()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchRoster])

  const handleClassChange = (newClassId: string) => {
    if (dirty && students.length > 0) {
      setConfirmDialog({
        open: true,
        title: 'Discard unsaved changes?',
        description: 'You have unsaved attendance changes. Changing class will discard them. Continue?',
        onConfirm: () => {
          setConfirmDialog((d) => ({ ...d, open: false }))
          setClassId(newClassId)
        },
      })
      return
    }
    setClassId(newClassId)
  }

  const handleDateChange = (newDate: string) => {
    if (dirty && students.length > 0) {
      setConfirmDialog({
        open: true,
        title: 'Discard unsaved changes?',
        description: 'You have unsaved attendance changes. Changing date will discard them. Continue?',
        onConfirm: () => {
          setConfirmDialog((d) => ({ ...d, open: false }))
          setDate(newDate)
        },
      })
      return
    }
    setDate(newDate)
  }

  const setStatus = (userId: string, status: Status) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.userId === userId
          ? { ...s, status, minutesLate: status === 'LATE' ? s.minutesLate || 5 : undefined }
          : s
      )
    )
    markDirty()
  }

  const markAll = (status: Status) => {
    setStudents((prev) => prev.map((s) => ({ ...s, status })))
    markDirty()
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/staff/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId,
          date,
          records: students.map((s) => ({
            userId: s.userId,
            status: s.status,
            minutesLate: s.minutesLate,
            notes: s.notes,
          })),
        }),
      })
      const json = await res.json()
      if (json.success) {
        savedSnapshotRef.current = JSON.stringify(students)
        markClean()
        fetchRoster() // refresh stats
      } else {
        setError(json.error || 'Failed to save')
      }
    } catch {
      setError('An error occurred while saving')
    } finally {
      setSaving(false)
    }
  }

  const presentCount = students.filter((s) => s.status === 'PRESENT' || s.status === 'LATE').length
  const rate = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4">
        <div className="min-w-50 flex-1">
          <label className="mb-1 block text-xs font-bold text-slate-500">Class</label>
          <select
            value={classId}
            onChange={(e) => handleClassChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium dark:border-slate-700 dark:bg-slate-900"
          >
            {classes.length === 0 ? (
              <option value="">No classes available</option>
            ) : (
              classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))
            )}
          </select>
        </div>
        <div className="min-w-40">
          <label className="mb-1 block text-xs font-bold text-slate-500">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
      </div>

      {/* Error banner */}
      {error && <ErrorBanner message={error} onRetry={fetchRoster} />}

      {/* Unsaved changes warning */}
      {dirty && (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-900/10 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Unsaved changes — save before navigating away.</span>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
          <Users className="mx-auto h-5 w-5 text-slate-400" />
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {students.length}
          </p>
          <p className="text-xs text-slate-500">Enrolled</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center dark:border-green-800/50 dark:bg-green-900/10">
          <CheckCircle2 className="mx-auto h-5 w-5 text-green-600" />
          <p className="mt-1 text-2xl font-bold text-green-800 dark:text-green-200">
            {presentCount}
          </p>
          <p className="text-xs text-green-600">Present</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center dark:border-red-800/50 dark:bg-red-900/10">
          <XCircle className="mx-auto h-5 w-5 text-red-600" />
          <p className="mt-1 text-2xl font-bold text-red-800 dark:text-red-200">
            {students.filter((s) => s.status === 'ABSENT').length}
          </p>
          <p className="text-xs text-red-600">Absent</p>
        </div>
        <div
          className={`rounded-xl border p-4 text-center ${
            rate >= 90
              ? 'border-green-200 bg-green-50 dark:border-green-800/50 dark:bg-green-900/10'
              : 'border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/10'
          }`}
        >
          {rate < 90 ? (
            <AlertTriangle className="mx-auto h-5 w-5 text-amber-600" />
          ) : (
            <CheckCircle2 className="mx-auto h-5 w-5 text-green-600" />
          )}
          <p
            className={`mt-1 text-2xl font-bold ${rate >= 90 ? 'text-green-800 dark:text-green-200' : 'text-amber-800 dark:text-amber-200'}`}
          >
            {rate}%
          </p>
          <p className="text-xs text-slate-500">Rate</p>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => markAll('PRESENT')}
          className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300"
        >
          All Present
        </button>
        <button
          onClick={() => markAll('ABSENT')}
          className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300"
        >
          All Absent
        </button>
      </div>

      {/* Student List */}
      {loading ? (
        <LoadingState variant="spinner" message="Loading attendance..." />
      ) : students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students enrolled"
          description="Students enrolled in this course will appear here."
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="divide-y dark:divide-slate-800">
            {students.map((s, i) => {
              const fullName = s.profile
                ? `${s.profile.firstName} ${s.profile.lastName}`
                : s.email || s.userId
              return (
                <div
                  key={s.userId}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{fullName}</p>
                      <p className="text-xs text-slate-500">{s.studentId || s.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUSES.map((status) => {
                      const config = STATUS_CONFIG[status]
                      const Icon = config.icon
                      const active = s.status === status
                      return (
                        <button
                          key={status}
                          aria-label={config.label}
                          onClick={() => setStatus(s.userId, status)}
                          className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                            active
                              ? `${config.color} ring-2 ring-current ring-offset-1`
                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-800'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                          {config.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((d) => ({ ...d, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel="Discard & Continue"
        cancelLabel="Keep Editing"
        variant="destructive"
        onConfirm={confirmDialog.onConfirm}
      />

      {/* Save Button */}
      {students.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-aerojet-blue hover:bg-aerojet-blue/90 dark:bg-aerojet-sky flex items-center gap-2 rounded-xl px-8 py-3 font-bold text-white disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            Save Attendance
            <FormDirtyIndicator isDirty={dirty} />
          </button>
        </div>
      )}
    </div>
  )
}
