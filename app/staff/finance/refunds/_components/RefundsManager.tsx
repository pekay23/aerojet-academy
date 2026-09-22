'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from 'use-debounce'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, ShieldCheck, Plus, Search, User as UserIcon } from 'lucide-react'
import {
  requestRefund,
  staffConfirmRefund,
  rejectRefund,
  approveAndProcessRefund,
} from '@/lib/refund/actions'
import { useFormDirty } from '@/hooks/useFormDirty'
import RejectRefundDialog from '@/components/shared/RejectRefundDialog'
import {
  getRefundStatusStyle,
  CURRENCY_OPTIONS,
  REFUND_FILTERS,
  type RefundRow,
} from '@/lib/types/staff'

export default function RefundsManager({
  refunds,
  isAdmin,
}: {
  refunds: RefundRow[]
  isAdmin: boolean
}) {
  const [filter, setFilter] = useState('OPEN')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    student: '',
    studentId: '' as string,
    amount: '',
    reason: '',
    currency: 'EUR' as 'EUR' | 'USD' | 'GHS',
  })

  const { markDirty, markClean } = useFormDirty()

  // Student search (debounced typeahead)
  const [studentQuery, setStudentQuery] = useState('')
  const [debouncedQuery] = useDebounce(studentQuery, 200)
  const [options, setOptions] = useState<
    Array<{
      id: string
      name: string
      email: string
      studentId: string | null
    }>
  >([])
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  // Reject dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null)
  const [rejectLoading, setRejectLoading] = useState(false)

  // Confirm dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'confirm' | 'approve' | null>(null)
  const [confirmTargetId, setConfirmTargetId] = useState<string | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  // Load student options
  useEffect(() => {
    if (!showCreate) return
    if (debouncedQuery.trim().length < 1) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOptions([])
      return
    }
    let cancelled = false
    setSearching(true)
    ;(async () => {
      try {
        const params = new URLSearchParams({
          role: 'STUDENT',
          search: debouncedQuery.trim(),
          limit: '8',
        })
        const res = await fetch(`/api/staff/users?${params}`, { cache: 'no-store' })
        if (!res.ok) throw new Error('search failed')
        const json = await res.json()
        if (cancelled) return
        const rows: Array<{
          id: string
          profile?: { firstName: string; lastName: string } | null
          email: string
          studentProfile?: { studentId: string } | null
        }> = json?.data ?? []
        setOptions(
          rows.map((u) => ({
            id: u.id,
            name:
              u.profile?.firstName && u.profile?.lastName
                ? `${u.profile.firstName} ${u.profile.lastName}`
                : u.email,
            email: u.email,
            studentId: u.studentProfile?.studentId ?? null,
          }))
        )
      } catch (_e) {
        if (!cancelled) setOptions([])
      } finally {
        if (!cancelled) setSearching(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [debouncedQuery, showCreate])

  const pickStudent = (s: {
    id: string
    name: string
    email: string
    studentId: string | null
  }) => {
    setForm((f) => ({ ...f, student: s.email, studentId: s.id }))
    setStudentQuery(`${s.name} · ${s.email}`)
    setShowDropdown(false)
  }

  const handleAction = useCallback(
    async (
      action: () => Promise<{ error?: string; success?: boolean }>,
      successMessage: string,
      errorMessage?: string
    ) => {
      try {
        const res = await action()
        if (res.error) toast.error(res.error)
        else toast.success(successMessage)
      } catch (_e) {
        toast.error(errorMessage ?? 'Action failed')
      }
    },
    []
  )

  const create = () => {
    if (!form.student.trim() || !form.amount || !form.reason.trim()) {
      toast.error('Student, amount and reason are all required.')
      return
    }
    handleAction(
      () =>
        requestRefund({
          student: form.studentId || form.student.trim(),
          amount: Number(form.amount),
          reason: form.reason.trim(),
          currency: form.currency,
        }),
      'Refund request created'
    )
    markClean()
    setForm({ student: '', studentId: '', amount: '', reason: '', currency: 'EUR' })
    setStudentQuery('')
    setShowCreate(false)
  }

  const handleConfirm = (action: 'confirm' | 'approve', id: string) => {
    setConfirmAction(action)
    setConfirmTargetId(id)
    setConfirmDialogOpen(true)
  }

  const handleConfirmAction = async () => {
    if (!confirmTargetId || !confirmAction) return
    setConfirmLoading(true)
    try {
      if (confirmAction === 'confirm') {
        await handleAction(() => staffConfirmRefund(confirmTargetId), 'Confirmed')
      } else if (confirmAction === 'approve') {
        await handleAction(() => approveAndProcessRefund(confirmTargetId), 'Refund processed')
      }
    } finally {
      setConfirmLoading(false)
      setConfirmAction(null)
      setConfirmTargetId(null)
      setConfirmDialogOpen(false)
    }
  }

  const handleReject = (id: string) => {
    setRejectTargetId(id)
    setRejectDialogOpen(true)
  }

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectTargetId) return
    setRejectLoading(true)
    try {
      await handleAction(() => rejectRefund(rejectTargetId, reason), 'Rejected')
    } finally {
      setRejectLoading(false)
      setRejectTargetId(null)
      setRejectDialogOpen(false)
    }
  }

  const visible = refunds.filter((r) =>
    filter === 'OPEN'
      ? ['REQUESTED', 'STAFF_CONFIRMED', 'ADMIN_APPROVED'].includes(r.status)
      : filter === 'ALL'
        ? true
        : r.status === filter
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Refund status filters">
          {REFUND_FILTERS.map((f: { value: string; label: string }) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full border px-3 py-1 text-xs font-bold transition-all ${
                filter === f.value
                  ? 'border-aerojet-blue bg-aerojet-blue text-white'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800'
              }`}
              aria-pressed={filter === f.value}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowCreate((s) => !s)}
          className="bg-aerojet-blue hover:bg-aerojet-blue/90 flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-white"
          aria-expanded={showCreate}
          aria-controls="create-refund-form"
        >
          <Plus className="h-4 w-4" /> New Refund
        </button>
      </div>

      {showCreate && (
        <div
          id="create-refund-form"
          className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          role="region"
          aria-label="Create new refund"
        >
          {/* Student typeahead */}
          <div className="relative">
            <label
              htmlFor="refund-student-search"
              className="mb-1 block text-[10px] font-black tracking-widest text-slate-500 uppercase"
            >
              Student
            </label>
            <Search className="pointer-events-none absolute top-8.5 left-3 h-4 w-4 text-slate-400" />
            <input
              id="refund-student-search"
              value={studentQuery}
              onChange={(e) => {
                setStudentQuery(e.target.value)
                setShowDropdown(true)
                if (form.studentId) setForm((f) => ({ ...f, studentId: '', student: '' }))
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              placeholder="Search by name, email, or student ID…"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 pl-9 text-sm dark:border-slate-700 dark:bg-slate-800"
              autoComplete="off"
              aria-autocomplete="list"
              aria-controls="student-search-results"
            />
            {showDropdown && (studentQuery.length > 0 || options.length > 0) && (
              <div
                id="student-search-results"
                className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
                role="listbox"
              >
                {searching && (
                  <div className="px-3 py-2 text-xs text-slate-400" role="option" aria-selected={false}>
                    Searching…
                  </div>
                )}
                {!searching && options.length === 0 && studentQuery.length > 0 && (
                  <div className="px-3 py-2 text-xs text-slate-400" role="option" aria-selected={false}>
                    No matches.
                  </div>
                )}
                {options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    role="option"
                    aria-selected={form.studentId === opt.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickStudent(opt)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <UserIcon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                        {opt.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {opt.email}
                        {opt.studentId && <span className="ml-2 font-mono">· {opt.studentId}</span>}
                      </p>
                    </div>
                    {form.studentId === opt.id && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            {/* Amount + currency */}
            <div className="sm:col-span-2">
              <label
                htmlFor="refund-amount"
                className="mb-1 block text-[10px] font-black tracking-widest text-slate-500 uppercase"
              >
                Amount
              </label>
              <div className="flex">
                <input
                  id="refund-amount"
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.amount}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, amount: e.target.value }))
                    markDirty()
                  }}
                  placeholder="0.00"
                  className="w-full rounded-l-lg border border-r-0 border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  aria-required="true"
                />
                <select
                  id="refund-currency"
                  value={form.currency}
                  onChange={(e) => {
                    setForm((f) => ({
                      ...f,
                      currency: e.target.value as typeof form.currency,
                    }))
                    markDirty()
                  }}
                  className="rounded-r-lg border border-l-0 border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-100"
                  aria-label="Currency"
                >
                  {CURRENCY_OPTIONS.map((c: { value: string; label: string }) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reason */}
            <div className="sm:col-span-2">
              <label
                htmlFor="refund-reason"
                className="mb-1 block text-[10px] font-black tracking-widest text-slate-500 uppercase"
              >
                Reason
              </label>
              <input
                id="refund-reason"
                value={form.reason}
                onChange={(e) => {
                  setForm((f) => ({ ...f, reason: e.target.value }))
                  markDirty()
                }}
                placeholder="Why is this refund being issued?"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                aria-required="true"
                maxLength={500}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setShowCreate(false)}
              className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={create}
              disabled={!form.studentId || !form.amount || !form.reason}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Create refund
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
        <table className="w-full text-sm" role="grid">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-left dark:border-slate-800 dark:bg-slate-900/50">
              <th
                scope="col"
                className="px-4 py-3 text-[10px] font-black tracking-widest text-slate-400 uppercase"
              >
                Student
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-[10px] font-black tracking-widest text-slate-400 uppercase"
              >
                Amount
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-[10px] font-black tracking-widest text-slate-400 uppercase"
              >
                Reason
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {visible.map((r) => {
              const name = r.user.profile
                ? `${r.user.profile.firstName} ${r.user.profile.lastName}`
                : r.user.email
              const canConfirm = r.status === 'REQUESTED'
              const canApprove =
                isAdmin && (r.status === 'REQUESTED' || r.status === 'STAFF_CONFIRMED')
              const canReject = ['REQUESTED', 'STAFF_CONFIRMED', 'ADMIN_APPROVED'].includes(
                r.status
              )

              return (
                <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800 dark:text-slate-200">{name}</div>
                    <div className="text-xs text-slate-400">
                      {r.user.studentProfile?.studentId ?? r.user.email}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono font-black text-slate-800 dark:text-slate-200">
                    {r.currency} {Number(r.amount).toFixed(2)}
                  </td>
                  <td className="max-w-70 px-4 py-3 text-slate-600 dark:text-slate-300">
                    <p className="line-clamp-2">{r.reason}</p>
                    {r.rejectedReason && (
                      <p className="mt-1 text-xs text-red-500">Note: {r.rejectedReason}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${getRefundStatusStyle(r.status)}`}
                    >
                      {r.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {canConfirm && (
                        <button
                          disabled={confirmLoading}
                          onClick={() => handleConfirm('confirm', r.id)}
                          className="flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                          aria-label={`Confirm refund for ${name}`}
                        >
                          <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Confirm
                        </button>
                      )}
                      {canApprove && (
                        <button
                          disabled={confirmLoading}
                          onClick={() => handleConfirm('approve', r.id)}
                          className="flex items-center gap-1 rounded bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                          aria-label={`Approve and process refund for ${name}`}
                        >
                          <ShieldCheck className="h-3 w-3" aria-hidden="true" /> Approve & Pay
                        </button>
                      )}
                      {canReject && (
                        <button
                          disabled={rejectLoading}
                          onClick={() => handleReject(r.id)}
                          className="flex items-center gap-1 rounded bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-300"
                          aria-label={`Reject refund for ${name}`}
                        >
                          <XCircle className="h-3 w-3" aria-hidden="true" /> Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                  No refunds.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Confirm Dialog */}
      <RejectRefundDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onConfirm={handleRejectConfirm}
        onCancel={() => setRejectTargetId(null)}
        loading={rejectLoading}
        title="Reject Refund"
        description="Please provide a reason for rejecting this refund. This will be recorded and shown to the student."
        placeholder="Enter rejection reason..."
        maxLength={500}
      />

      {/* Confirm Action Dialog */}
      <ConfirmActionDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirmAction}
        onCancel={() => {
          setConfirmAction(null)
          setConfirmTargetId(null)
        }}
        loading={confirmLoading}
        action={confirmAction}
      />
    </div>
  )
}

/* ─── Confirm Action Dialog Component ─── */
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ConfirmActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
  action: 'confirm' | 'approve' | null
}

function ConfirmActionDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  loading,
  action,
}: ConfirmActionDialogProps) {
  if (!action) return null

  const isApprove = action === 'approve'
  const title = isApprove ? 'Approve & Process Refund' : 'Confirm Refund'
  const description = isApprove
    ? "This will credit the refund amount to the student's wallet. This action cannot be undone."
    : 'This will mark the refund as staff-confirmed and ready for admin approval.'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <DialogContent className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-aerojet-blue text-lg font-black dark:text-white">
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
              {description}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={onConfirm}
              disabled={loading}
              className={
                isApprove ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
              }
            >
              {loading ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {isApprove ? 'Processing...' : 'Confirming...'}
                </>
              ) : isApprove ? (
                'Approve & Pay'
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
