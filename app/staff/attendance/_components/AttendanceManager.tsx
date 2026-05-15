'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Loader2,
  Users,
  Calendar,
  Save,
  AlertTriangle,
} from 'lucide-react'

const STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const
type Status = typeof STATUSES[number]

const STATUS_CONFIG: Record<Status, { label: string; color: string; icon: any }> = {
  PRESENT: { label: 'Present', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle2 },
  ABSENT: { label: 'Absent', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: XCircle },
  LATE: { label: 'Late', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', icon: Clock },
  EXCUSED: { label: 'Excused', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', icon: ShieldCheck },
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
  const [stats, setStats] = useState<{ total: number; present: number; rate: number } | null>(null)

  const fetchRoster = useCallback(async () => {
    if (!classId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/staff/attendance?classId=${classId}&date=${date}`)
      const json = await res.json()
      if (json.data) {
        const { records, roster, stats } = json.data

        // Build student list from roster, merging existing records
        const existingMap = new Map<string, any>(records.map((r: any) => [r.userId, r]))
        const merged: StudentRecord[] = roster.map((u: any) => {
          const existing = existingMap.get(u.id) as any
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
        setStats(stats)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [classId, date])

  useEffect(() => { fetchRoster() }, [fetchRoster])

  const setStatus = (userId: string, status: Status) => {
    setStudents(prev => prev.map(s =>
      s.userId === userId ? { ...s, status, minutesLate: status === 'LATE' ? s.minutesLate || 5 : undefined } : s
    ))
  }

  const markAll = (status: Status) => {
    setStudents(prev => prev.map(s => ({ ...s, status })))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/staff/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId,
          date,
          records: students.map(s => ({
            userId: s.userId,
            status: s.status,
            minutesLate: s.minutesLate,
            notes: s.notes,
          })),
        }),
      })
      const json = await res.json()
      if (json.success) {
        fetchRoster() // refresh stats
      } else {
        alert(json.error || 'Failed to save')
      }
    } catch {
      alert('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const presentCount = students.filter(s => s.status === 'PRESENT' || s.status === 'LATE').length
  const rate = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4">
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-xs font-bold text-slate-500">Class</label>
          <select
            value={classId}
            onChange={e => setClassId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium dark:border-slate-700 dark:bg-slate-900"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[160px]">
          <label className="mb-1 block text-xs font-bold text-slate-500">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
          <Users className="mx-auto h-5 w-5 text-slate-400" />
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{students.length}</p>
          <p className="text-xs text-slate-500">Enrolled</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center dark:border-green-800/50 dark:bg-green-900/10">
          <CheckCircle2 className="mx-auto h-5 w-5 text-green-600" />
          <p className="mt-1 text-2xl font-bold text-green-800 dark:text-green-200">{presentCount}</p>
          <p className="text-xs text-green-600">Present</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center dark:border-red-800/50 dark:bg-red-900/10">
          <XCircle className="mx-auto h-5 w-5 text-red-600" />
          <p className="mt-1 text-2xl font-bold text-red-800 dark:text-red-200">{students.filter(s => s.status === 'ABSENT').length}</p>
          <p className="text-xs text-red-600">Absent</p>
        </div>
        <div className={`rounded-xl border p-4 text-center ${
          rate >= 90 ? 'border-green-200 bg-green-50 dark:border-green-800/50 dark:bg-green-900/10' : 'border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/10'
        }`}>
          {rate < 90 ? <AlertTriangle className="mx-auto h-5 w-5 text-amber-600" /> : <CheckCircle2 className="mx-auto h-5 w-5 text-green-600" />}
          <p className={`mt-1 text-2xl font-bold ${rate >= 90 ? 'text-green-800 dark:text-green-200' : 'text-amber-800 dark:text-amber-200'}`}>{rate}%</p>
          <p className="text-xs text-slate-500">Rate</p>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="flex gap-2">
        <button onClick={() => markAll('PRESENT')} className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300">
          All Present
        </button>
        <button onClick={() => markAll('ABSENT')} className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300">
          All Absent
        </button>
      </div>

      {/* Student List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-aerojet-blue" />
        </div>
      ) : students.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <Users className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <p className="font-bold text-slate-500">No students enrolled in this class.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="divide-y dark:divide-slate-800">
            {students.map((s, i) => {
              const fullName = s.profile ? `${s.profile.firstName} ${s.profile.lastName}` : s.email || s.userId
              return (
                <div key={s.userId} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
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
                    {STATUSES.map(status => {
                      const config = STATUS_CONFIG[status]
                      const Icon = config.icon
                      const active = s.status === status
                      return (
                        <button
                          key={status}
                          onClick={() => setStatus(s.userId, status)}
                          className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                            active
                              ? `${config.color} ring-2 ring-offset-1 ring-current`
                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-800'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
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

      {/* Save Button */}
      {students.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-aerojet-blue px-8 py-3 font-bold text-white hover:bg-aerojet-blue/90 disabled:opacity-50 dark:bg-aerojet-sky"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            Save Attendance
          </button>
        </div>
      )}
    </div>
  )
}
