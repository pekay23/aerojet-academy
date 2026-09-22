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
import { Plus, Loader2, Briefcase, Clock } from 'lucide-react'
import { useFormDirty } from '@/hooks/useFormDirty'
import { toast } from 'sonner'

interface OjtPeriod {
  id: string
  companyName: string
  companyAddress: string | null
  supervisorName: string | null
  status: string
  hoursCompleted: number
  hoursRequired: number
  startDate: string
  endDate: string | null
}

interface Enrollment {
  id: string
  programme: { code: string; name: string }
  ojtPeriods: OjtPeriod[]
}

export default function OjtSection({
  userId,
  enrollments,
}: {
  userId: string
  enrollments: Enrollment[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { markDirty, markClean } = useFormDirty()

  const [enrollmentId, setEnrollmentId] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [supervisorName, setSupervisorName] = useState('')
  const [supervisorEmail, setSupervisorEmail] = useState('')
  const [startDate, setStartDate] = useState('')
  const [hoursRequired, setHoursRequired] = useState('2000')

  const allOjt = enrollments.flatMap((e) =>
    e.ojtPeriods.map((o) => ({ ...o, programmeName: e.programme.name }))
  )

  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    ACTIVE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }

  const handleCreate = async () => {
    if (!enrollmentId || !companyName || !startDate) {
      setError('Enrollment, company name, and start date are required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/staff/students/${userId}/ojt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId,
          companyName,
          companyAddress: companyAddress || null,
          supervisorName: supervisorName || null,
          supervisorEmail: supervisorEmail || null,
          startDate,
          hoursRequired,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create')
      markClean()
      setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (ojtId: string, status: string) => {
    try {
      const res = await fetch(`/api/staff/students/${userId}/ojt`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ojtId, status }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to update')
        return
      }
      router.refresh()
    } catch {
      toast.error('Network error')
    }
  }

  if (enrollments.length === 0) return null

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xs font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
          <Briefcase className="h-4 w-4" /> On-the-Job Training (OJT)
        </h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1 text-xs">
              <Plus className="h-3 w-3" /> Add OJT
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-120">
            <DialogHeader>
              <DialogTitle>Add OJT Period</DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-3">
              <div>
                <label
                  htmlFor="ojt-enrollment"
                  className="mb-1 block text-xs font-bold text-slate-600"
                >
                  Enrollment
                </label>
                <select
                  id="ojt-enrollment"
                  name="enrollmentId"
                  value={enrollmentId}
                  onChange={(e) => {
                    setEnrollmentId(e.target.value)
                    markDirty()
                  }}
                  className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="">Select Enrollment</option>
                  {enrollments.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.programme.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="ojt-company-name"
                  className="mb-1 block text-xs font-bold text-slate-600"
                >
                  Company Name
                </label>
                <input
                  id="ojt-company-name"
                  name="companyName"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value)
                    markDirty()
                  }}
                  placeholder="e.g. Lufthansa Technik"
                  autoComplete="off"
                  className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label
                  htmlFor="ojt-company-address"
                  className="mb-1 block text-xs font-bold text-slate-600"
                >
                  Company Address
                </label>
                <input
                  id="ojt-company-address"
                  name="companyAddress"
                  value={companyAddress}
                  onChange={(e) => {
                    setCompanyAddress(e.target.value)
                    markDirty()
                  }}
                  autoComplete="off"
                  className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="ojt-sup-name"
                    className="mb-1 block text-xs font-bold text-slate-600"
                  >
                    Supervisor Name
                  </label>
                  <input
                    id="ojt-sup-name"
                    name="supervisorName"
                    value={supervisorName}
                    onChange={(e) => {
                      setSupervisorName(e.target.value)
                      markDirty()
                    }}
                    autoComplete="off"
                    className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label
                    htmlFor="ojt-sup-email"
                    className="mb-1 block text-xs font-bold text-slate-600"
                  >
                    Supervisor Email
                  </label>
                  <input
                    id="ojt-sup-email"
                    name="supervisorEmail"
                    value={supervisorEmail}
                    onChange={(e) => {
                      setSupervisorEmail(e.target.value)
                      markDirty()
                    }}
                    autoComplete="off"
                    className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="ojt-start-date"
                    className="mb-1 block text-xs font-bold text-slate-600"
                  >
                    Start Date
                  </label>
                  <input
                    id="ojt-start-date"
                    name="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value)
                      markDirty()
                    }}
                    autoComplete="off"
                    className="w-full rounded-md border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label
                    htmlFor="ojt-hours-req"
                    className="mb-1 block text-xs font-bold text-slate-600"
                  >
                    Hours Required
                  </label>
                  <input
                    id="ojt-hours-req"
                    name="hoursRequired"
                    type="number"
                    value={hoursRequired}
                    onChange={(e) => {
                      setHoursRequired(e.target.value)
                      markDirty()
                    }}
                    autoComplete="off"
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

      {allOjt.length === 0 ? (
        <p className="text-sm text-slate-400 italic">No OJT periods recorded.</p>
      ) : (
        <div className="space-y-3">
          {allOjt.map((ojt) => {
            const progress =
              ojt.hoursRequired > 0
                ? Math.min(100, Math.round((ojt.hoursCompleted / ojt.hoursRequired) * 100))
                : 0

            return (
              <div
                key={ojt.id}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-slate-700 dark:text-slate-200">
                      {ojt.companyName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {ojt.programmeName} &middot; Started{' '}
                      {new Date(ojt.startDate).toLocaleDateString()}
                      {ojt.supervisorName && ` &middot; Supervisor: ${ojt.supervisorName}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${statusColors[ojt.status] || 'bg-slate-100 text-slate-500'}`}
                    >
                      {ojt.status}
                    </span>
                    <select
                      id={`ojt-status-${ojt.id}`}
                      name="status"
                      aria-label="Update OJT status"
                      value={ojt.status}
                      onChange={(e) => handleStatusUpdate(ojt.id, e.target.value)}
                      className="rounded border border-slate-200 bg-white px-1 py-0.5 text-[10px] dark:border-slate-700 dark:bg-slate-800"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="ACTIVE">Active</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="FAILED">Failed</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {ojt.hoursCompleted} / {ojt.hoursRequired} hours
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className={`h-full rounded-full transition-all ${
                        progress >= 100 ? 'bg-emerald-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
