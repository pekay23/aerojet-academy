'use client'
import { formatDate } from '@/lib/utils/formatters'

import { useState } from 'react'
import { toast } from 'sonner'
import { ShieldAlert, Clock, CheckCircle2, XCircle, AlertCircle, Send } from 'lucide-react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

export interface Violation {
  id: string
  type: string
  severity: 'WARNING' | 'NOTICE' | 'CRITICAL'
  detail: string | null
  deviceInfo: Record<string, unknown> | null
  reviewOutcome: 'PENDING' | 'GRACIOUS' | 'STRICT' | 'DISMISSED'
  reviewNote: string | null
  reviewedAt: string | null
  reviewedBy: string | null
  createdAt: string
  student: { id: string; name: string; email: string }
}

interface ViolationReviewPanelProps {
  sessionId: string
  violations: Violation[]
}

const SEVERITY_LABELS: Record<
  string,
  { label: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  WARNING: { label: 'Warning', Icon: AlertCircle },
  NOTICE: { label: 'Notice', Icon: ShieldAlert },
  CRITICAL: { label: 'Critical', Icon: ShieldAlert },
}

const VIOLATION_TYPE_LABELS: Record<string, string> = {
  FULLSCREEN_EXIT: 'Fullscreen Exit',
  TAB_SWITCH: 'Tab Switch',
  KEYBOARD_SHORTCUT: 'Keyboard Shortcut',
  NETWORK_DISCONNECT: 'Network Disconnect',
  EXAM_INTERFACE_UNLOAD: 'Exam Interface Unload',
}

function SeverityBadge({ severity }: { severity: Violation['severity'] }) {
  const config: Record<Violation['severity'], string> = {
    WARNING:
      'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    NOTICE:
      'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
    CRITICAL:
      'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  }
  const { Icon } = SEVERITY_LABELS[severity] || { Icon: AlertCircle }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${config[severity]}`}
    >
      <Icon className="h-3 w-3" />
      {SEVERITY_LABELS[severity]?.label ?? severity}
    </span>
  )
}

function ReviewStatusBadge({ outcome }: { outcome: Violation['reviewOutcome'] }) {
  const config: Record<Violation['reviewOutcome'], string> = {
    PENDING:
      'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    GRACIOUS:
      'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    STRICT:
      'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    DISMISSED:
      'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  }
  const label =
    outcome === 'PENDING'
      ? 'Pending Review'
      : outcome.charAt(0).toUpperCase() + outcome.slice(1).toLowerCase()
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${config[outcome]}`}
    >
      {label}
    </span>
  )
}

export default function ViolationReviewPanel({ sessionId, violations }: ViolationReviewPanelProps) {
  const [items, setItems] = useState<Violation[]>(violations)
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  const [confirmState, setConfirmState] = useState<{
    open: boolean
    title: string
    description: string
    confirmLabel: string
    onConfirm: () => void
  }>({ open: false, title: '', description: '', confirmLabel: 'Confirm', onConfirm: () => {} })

  const pendingCount = items.filter((v) => v.reviewOutcome === 'PENDING').length
  const criticalCount = items.filter((v) => v.severity === 'CRITICAL').length

  const patchOutcome = async (
    ids: string[],
    outcome: Violation['reviewOutcome'],
    note?: string
  ) => {
    if (ids.length === 0) return
    const key = ids.join(',')
    setLoadingIds((prev) => new Set([...prev, key]))
    try {
      const res = await fetch(`/api/staff/exams/internal/sessions/${sessionId}/violations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ violationIds: ids, outcome, reviewNote: note }),
      })
      const json = await res.json()
      if (json.success) {
        setItems((prev) =>
          prev.map((v) =>
            ids.includes(v.id)
              ? { ...v, reviewOutcome: outcome, reviewNote: note || v.reviewNote }
              : v
          )
        )
      } else {
        toast.error(json.error || 'Failed to update outcome')
      }
    } catch {
      toast.error('Failed to update outcome')
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  const handleOutcome = (violationId: string, outcome: Violation['reviewOutcome']) => {
    if (outcome === 'STRICT') {
      // End Exam Now — confirm destructive action
      setConfirmState({
        open: true,
        title: 'End Exam Now?',
        description:
          "This will immediately terminate the student's exam session and auto-submit all answers. This action cannot be undone.",
        confirmLabel: 'End Exam',
        onConfirm: () => forceEndExam(),
      })
    } else {
      patchOutcome([violationId], outcome)
    }
  }

  const forceEndExam = async () => {
    setConfirmState((prev) => ({ ...prev, open: false }))
    setBulkLoading(true)
    try {
      const res = await fetch(`/api/staff/exams/internal/sessions/${sessionId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Terminated via violation review — STRICT outcome' }),
      })
      const json = await res.json()
      if (json.success) {
        // Mark all pending violations as STRICT
        const pendingIds = items.filter((v) => v.reviewOutcome === 'PENDING').map((v) => v.id)
        if (pendingIds.length > 0) {
          await patchOutcome(pendingIds, 'STRICT', 'Session force-ended by admin')
        }
        toast.success('Exam ended and submitted. Student notified.')
      } else {
        toast.error(json.error || 'Failed to end exam')
      }
    } catch {
      toast.error('Failed to end exam')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleBulk = (outcome: Violation['reviewOutcome']) => {
    const pendingIds = items.filter((v) => v.reviewOutcome === 'PENDING').map((v) => v.id)
    if (pendingIds.length === 0) return

    if (outcome === 'STRICT') {
      setConfirmState({
        open: true,
        title: `End Exam & Mark ${pendingIds.length} violation(s) as Strict?`,
        description:
          "This will immediately terminate the student's exam session and auto-submit all answers. This action cannot be undone.",
        confirmLabel: 'End Exam',
        onConfirm: async () => {
          setConfirmState((prev) => ({ ...prev, open: false }))
          await forceEndExam()
        },
      })
    } else if (outcome === 'DISMISSED') {
      setConfirmState({
        open: true,
        title: `Dismiss ${pendingIds.length} violation(s)?`,
        description:
          'These violations will be marked as dismissed and will not affect the exam outcome.',
        confirmLabel: 'Dismiss All',
        onConfirm: async () => {
          setConfirmState((prev) => ({ ...prev, open: false }))
          await patchOutcome(pendingIds, 'DISMISSED', 'Dismissed in bulk by admin')
        },
      })
    } else {
      setConfirmState({
        open: true,
        title: `Allow Continue for ${pendingIds.length} violation(s)?`,
        description:
          'These violations will be marked as GRACIOUS — the student may continue without penalty.',
        confirmLabel: 'Allow Continue',
        onConfirm: async () => {
          setConfirmState((prev) => ({ ...prev, open: false }))
          await patchOutcome(pendingIds, 'GRACIOUS', 'Allowed to continue in bulk by admin')
        },
      })
    }
  }

  const isLoading = (id: string) => loadingIds.has(id)

  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-500">
        <ShieldAlert className="mx-auto mb-2 h-6 w-6 opacity-50" />
        No violations recorded for this session.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary + Bulk Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900 dark:text-white">{items.length}</span>
            <span className="text-slate-500">total violations</span>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-amber-600">{pendingCount}</span>
              <span className="text-slate-500">pending review</span>
            </div>
          )}
          {criticalCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-red-600">{criticalCount}</span>
              <span className="text-slate-500">critical</span>
            </div>
          )}
        </div>

        {pendingCount > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleBulk('DISMISSED')}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <XCircle className="h-3 w-3" />
              Dismiss All
            </button>
            <button
              onClick={() => handleBulk('GRACIOUS')}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-white px-3 py-2 text-xs font-bold text-green-700 hover:bg-green-50 disabled:opacity-50 dark:border-green-800 dark:bg-green-900/20"
            >
              <CheckCircle2 className="h-3 w-3" />
              Allow Continue
            </button>
            <button
              onClick={() => handleBulk('STRICT')}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:bg-red-900/20"
            >
              <Send className="h-3 w-3" />
              End Exam
            </button>
          </div>
        )}
      </div>

      {/* Violations Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="px-3 py-2 text-left font-bold text-slate-400">Time</th>
              <th className="px-3 py-2 text-left font-bold text-slate-400">Type</th>
              <th className="px-3 py-2 text-left font-bold text-slate-400">Severity</th>
              <th className="px-3 py-2 text-left font-bold text-slate-400">Detail</th>
              <th className="px-3 py-2 text-left font-bold text-slate-400">Status</th>
              <th className="px-3 py-2 text-center font-bold text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((v) => (
              <tr key={v.id} className="border-b border-slate-100 dark:border-slate-800">
                <td className="px-3 py-2.5 whitespace-nowrap text-slate-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(v.createdAt).toLocaleTimeString()}
                  </div>
                  <div className="text-[10px] text-slate-400">{formatDate(v.createdAt)}</div>
                </td>
                <td className="px-3 py-2.5">
                  {v.type ? (
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {VIOLATION_TYPE_LABELS[v.type] ?? v.type}
                    </span>
                  ) : (
                    <span className="text-slate-400">Unknown</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <SeverityBadge severity={v.severity} />
                </td>
                <td className="max-w-xs truncate px-3 py-2.5 text-slate-600 dark:text-slate-400">
                  {v.detail || <span className="italic">No detail captured</span>}
                </td>
                <td className="px-3 py-2.5">
                  <ReviewStatusBadge outcome={v.reviewOutcome} />
                </td>
                <td className="px-3 py-2.5">
                  {v.reviewOutcome === 'PENDING' ? (
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOutcome(v.id, 'GRACIOUS')}
                        disabled={isLoading(v.id)}
                        className="rounded p-1 text-green-600 hover:bg-green-50 disabled:opacity-50 dark:hover:bg-green-900/20"
                        title="Allow Continue (GRACIOUS)"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleOutcome(v.id, 'STRICT')}
                        disabled={isLoading(v.id)}
                        className="rounded p-1 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/20"
                        title="End Exam Now (STRICT)"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleOutcome(v.id, 'DISMISSED')}
                        disabled={isLoading(v.id)}
                        className="rounded p-1 text-blue-600 hover:bg-blue-50 disabled:opacity-50 dark:hover:bg-blue-900/20"
                        title="Dismiss (DISMISSED)"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-slate-400">Reviewed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={confirmState.open}
        onOpenChange={(open) => setConfirmState((prev) => ({ ...prev, open }))}
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel={confirmState.confirmLabel}
        variant={confirmState.title.includes('End') ? 'destructive' : 'default'}
        loading={bulkLoading}
        onConfirm={confirmState.onConfirm}
      />
    </div>
  )
}
