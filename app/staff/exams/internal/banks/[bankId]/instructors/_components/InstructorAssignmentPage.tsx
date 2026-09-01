'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, UserPlus, UserCheck, UserX, Shield, Users } from 'lucide-react'
import { useConfirmDialog } from '@/hooks/use-confirm-dialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { TableSkeleton } from '@/components/shared/DashboardSkeleton'
import { toast } from 'sonner'
import { cn, formatDate } from '@/lib/utils'

interface InstructorAssignment {
  id: string
  bankId: string
  instructorId: string
  canEdit: boolean
  canReview: boolean
  canMonitor: boolean
  canPublish: boolean
  assignedAt: string
  assignedBy: string
  updatedAt: string
  user: {
    id: string
    email: string
    profile?: { firstName: string; lastName: string } | null
    instructorProfile?: { employeeId: string; department: string | null } | null
  }
}

interface InstructorOption {
  id: string
  email: string
  profile?: { firstName: string; lastName: string } | null
  instructorProfile?: { employeeId: string; department: string | null } | null
}

interface InstructorAssignmentPageProps {
  bankId: string
  bankName: string
  courseCode: string
  courseId: string
}

export default function InstructorAssignmentPage({ bankId, bankName, courseCode, courseId }: InstructorAssignmentPageProps) {
  const [assignments, setAssignments] = useState<InstructorAssignment[]>([])
  const [availableInstructors, setAvailableInstructors] = useState<InstructorOption[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedInstructor, setSelectedInstructor] = useState<string | null>(null)
  const [permissions, setPermissions] = useState({ canEdit: false, canReview: false, canMonitor: true, canPublish: false })
  const [submitting, setSubmitting] = useState(false)
  const [auditLog, setAuditLog] = useState<{ description: string; createdAt: string }[]>([])
  const [bulkAssigning, setBulkAssigning] = useState(false)

  const confirmDialog = useConfirmDialog()

  const fetchAssignments = useCallback(async () => {
    const res = await fetch(`/api/staff/exams/internal/banks/${bankId}/instructors`)
    const json = await res.json()
    if (json.success) setAssignments(json.data || [])
  }, [bankId])

  const fetchAvailableInstructors = useCallback(async () => {
    const res = await fetch('/api/staff/users?role=INSTRUCTOR&limit=100')
    const json = await res.json()
    if (json.success) setAvailableInstructors(json.data || [])
  }, [])

  const fetchAuditLog = useCallback(async () => {
    const res = await fetch(`/api/staff/audit-logs?action=EXAM_BANK_INSTRUCTOR_ASSIGNED&limit=10`)
    const json = await res.json()
    if (json.success) {
      const logs = (json.data || []) as any[]
      const relevant = logs.filter((l) => l.description?.includes(bankId) || l.changes?.bankId === bankId)
      setAuditLog(relevant.map((l: any) => ({ description: l.description, createdAt: l.createdAt })))
    }
  }, [bankId])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      await Promise.all([fetchAssignments(), fetchAvailableInstructors(), fetchAuditLog()])
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [fetchAssignments, fetchAvailableInstructors, fetchAuditLog])

  const handleAssign = async () => {
    if (!selectedInstructor) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/staff/exams/internal/banks/${bankId}/instructors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructorId: selectedInstructor, canEdit: permissions.canEdit, canReview: permissions.canReview, canMonitor: permissions.canMonitor }),
      })
      if (res.ok) {
        setShowAssignModal(false)
        setSelectedInstructor(null)
        setPermissions({ canEdit: false, canReview: false, canMonitor: true, canPublish: false })
        toast.success('Instructor assigned successfully')
        fetchAssignments()
        fetchAuditLog()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to assign instructor')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleBulkAssign = async () => {
    setBulkAssigning(true)
    try {
      const res = await fetch(`/api/staff/exams/internal/banks/${bankId}/instructors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulk: true, canEdit: false, canReview: false, canMonitor: true }),
      })
      if (res.ok) {
        toast.success('Bulk assignment completed')
        fetchAssignments()
        fetchAuditLog()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to bulk assign')
      }
    } finally {
      setBulkAssigning(false)
    }
  }

  const handleUpdate = async (assignmentId: string, updates: Partial<InstructorAssignment>) => {
    await fetch(`/api/staff/exams/internal/banks/${bankId}/instructors/${assignmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    toast.success('Permissions updated')
    fetchAssignments()
    fetchAuditLog()
  }

  const handleRevoke = async (assignmentId: string) => {
    confirmDialog.confirm({
      title: 'Revoke Instructor Access',
      description: 'Are you sure you want to revoke this instructor\'s access? This action cannot be undone.',
      onConfirm: async () => {
        await fetch(`/api/staff/exams/internal/banks/${bankId}/instructors/${assignmentId}`, { method: 'DELETE' })
        toast.success('Access revoked')
        fetchAssignments()
        fetchAuditLog()
      },
    })
  }

  const filteredInstructors = availableInstructors.filter((inst) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    const name = `${inst.profile?.firstName || ''} ${inst.profile?.lastName || ''}`.toLowerCase()
    const email = inst.email.toLowerCase()
    const empId = inst.instructorProfile?.employeeId?.toLowerCase() || ''
    return name.includes(q) || email.includes(q) || empId.includes(q)
  })

  const unassignedInstructors = filteredInstructors.filter(
    (inst) => !assignments.some((a) => a.instructorId === inst.id)
  )

  if (loading) return <TableSkeleton rows={10} />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white" data-tour-id="instructor-assignment-title">
            Instructor Access
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {bankName} • {courseCode} • Assign instructors and manage their permissions.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleBulkAssign}
            disabled={bulkAssigning}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white transition-all',
              bulkAssigning ? 'bg-slate-400' : 'bg-slate-700 hover:bg-slate-800'
            )}
          >
            {bulkAssigning ? <Users className="h-4 w-4 animate-pulse" /> : <Users className="h-4 w-4" />}
            {bulkAssigning ? 'Assigning...' : 'Assign All Course Instructors'}
          </button>
          <button
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-2 rounded-xl bg-aerojet-blue px-4 py-2 text-sm font-bold text-white hover:bg-aerojet-blue/90"
            data-tour-id="assign-instructor-button"
          >
            <UserPlus className="h-4 w-4" />
            Assign Instructor
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Instructor</th>
              <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Employee ID</th>
              <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Can Edit</th>
              <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Can Review</th>
              <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Can Monitor</th>
              <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Assigned</th>
              <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {assignments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  No instructors assigned yet. Click "Assign Instructor" to add one.
                </td>
              </tr>
            ) : (
              assignments.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900 dark:text-white">
                      {assignment.user.profile
                        ? `${assignment.user.profile.firstName} ${assignment.user.profile.lastName}`
                        : assignment.user.email}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{assignment.user.email}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {assignment.user.instructorProfile?.employeeId || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <PermissionToggle
                      enabled={assignment.canEdit}
                      onChange={(val) => handleUpdate(assignment.id, { canEdit: val })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <PermissionToggle
                      enabled={assignment.canReview}
                      onChange={(val) => handleUpdate(assignment.id, { canReview: val })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <PermissionToggle
                      enabled={assignment.canMonitor}
                      onChange={(val) => handleUpdate(assignment.id, { canMonitor: val })}
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {formatDate(assignment.assignedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleRevoke(assignment.id)}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <UserX className="h-3 w-3" />
                      Revoke
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50" data-tour-id="assignment-audit-log">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
          <Shield className="h-4 w-4" />
          Recent Assignment Changes
        </h3>
        <div className="space-y-2">
          {auditLog.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">No recent changes.</p>
          ) : (
            auditLog.map((entry, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">{entry.description}</span>
                <span className="text-slate-400 dark:text-slate-500">
                  {formatDate(entry.createdAt)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={confirmDialog.onOpenChange}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel="Revoke"
        variant="destructive"
        onConfirm={confirmDialog.onConfirm}
      />

      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Assign Instructor</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Search Instructors
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Name, email, or employee ID..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700">
                {unassignedInstructors.length === 0 ? (
                  <p className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                    No instructors found.
                  </p>
                ) : (
                  unassignedInstructors.map((inst) => (
                    <button
                      key={inst.id}
                      onClick={() => setSelectedInstructor(inst.id)}
                      className={cn(
                        'flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800',
                        selectedInstructor === inst.id && 'bg-blue-50 dark:bg-blue-900/20'
                      )}
                    >
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {inst.profile ? `${inst.profile.firstName} ${inst.profile.lastName}` : inst.email}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {inst.email} {inst.instructorProfile?.employeeId && `• ${inst.instructorProfile.employeeId}`}
                        </div>
                      </div>
                      {selectedInstructor === inst.id && <UserCheck className="h-4 w-4 text-blue-600" />}
                    </button>
                  ))
                )}
              </div>

              {selectedInstructor && (
                <div className="space-y-2 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Permissions</p>
                  <PermissionCheckboxes permissions={permissions} onChange={setPermissions} />
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  disabled={!selectedInstructor || submitting}
                  className="flex-1 rounded-xl bg-aerojet-blue px-4 py-2.5 text-sm font-bold text-white hover:bg-aerojet-blue/90 disabled:opacity-50"
                >
                  {submitting ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PermissionToggle({ enabled, onChange }: { enabled: boolean; onChange: (val: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        enabled ? 'bg-aerojet-blue' : 'bg-slate-200 dark:bg-slate-700'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 rounded-full bg-white transition-transform',
          enabled ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  )
}

function PermissionCheckboxes({
  permissions,
  onChange,
}: {
  permissions: { canEdit: boolean; canReview: boolean; canMonitor: boolean; canPublish: boolean }
  onChange: (val: { canEdit: boolean; canReview: boolean; canMonitor: boolean; canPublish: boolean }) => void
}) {
  const toggle = (key: keyof typeof permissions) => {
    onChange({ ...permissions, [key]: !permissions[key] })
  }

  return (
    <div className="space-y-2">
      {([
        ['canEdit', 'Can Edit Questions'],
        ['canReview', 'Can Review/Approve'],
        ['canMonitor', 'Can Monitor Sessions'],
      ] as const).map(([key, label]) => (
        <label key={key} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <input
            type="checkbox"
            checked={permissions[key]}
            onChange={() => toggle(key)}
            className="h-4 w-4 rounded border-slate-300 text-aerojet-blue focus:ring-aerojet-blue"
          />
          {label}
        </label>
      ))}
      <label className="flex items-center gap-2 text-sm text-slate-400">
        <input
          type="checkbox"
          checked={permissions.canPublish}
          disabled
          className="h-4 w-4 rounded border-slate-300 text-aerojet-blue focus:ring-aerojet-blue disabled:opacity-50"
        />
        Can Publish Results (admin only)
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 dark:bg-slate-700 dark:text-slate-400">
          Admin only
        </span>
      </label>
    </div>
  )
}
