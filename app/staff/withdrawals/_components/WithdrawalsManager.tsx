'use client'

import { useState, useTransition, useCallback } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, ShieldCheck, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  staffConfirmWithdrawal,
  rejectWithdrawal,
  adminApproveWithdrawal,
  staffInitiateWithdrawal,
} from '@/lib/withdrawal/actions'

export interface WR {
  id: string
  reason: string
  status: string
  createdAt: string
  rejectedReason: string | null
  user: {
    email: string
    profile: { firstName: string; lastName: string } | null
    studentProfile: { studentId: string } | null
  }
}

export interface StudentOption {
  id: string
  email: string
  profile: { firstName: string; lastName: string } | null
}

const STATUS_STYLE: Record<string, string> = {
  REQUESTED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  STAFF_CONFIRMED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ADMIN_APPROVED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  CANCELLED: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
}

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'Requested',
  STAFF_CONFIRMED: 'Staff Confirmed',
  ADMIN_APPROVED: 'Admin Approved',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
}

const FILTER_OPTIONS = [
  { key: 'OPEN', label: 'Open', statuses: ['REQUESTED', 'STAFF_CONFIRMED', 'ADMIN_APPROVED'] },
  { key: 'REQUESTED', label: 'Requested', statuses: ['REQUESTED'] },
  { key: 'STAFF_CONFIRMED', label: 'Staff Confirmed', statuses: ['STAFF_CONFIRMED'] },
  { key: 'ALL', label: 'All', statuses: null },
  { key: 'COMPLETED', label: 'Completed', statuses: ['COMPLETED'] },
  { key: 'REJECTED', label: 'REJECTED', statuses: ['REJECTED'] },
  { key: 'CANCELLED', label: 'Cancelled', statuses: ['CANCELLED'] },
] as const

const PAGE_SIZE = 25

type FilterKey = (typeof FILTER_OPTIONS)[number]['key']

export default function WithdrawalsManager({
  requests,
  isAdmin,
  students = [],
}: {
  requests: WR[]
  isAdmin: boolean
  students?: StudentOption[]
}) {
  const [isPending] = useTransition()
  const [filter, setFilter] = useState<FilterKey>('OPEN')
  const [page, setPage] = useState(1)
  const [optimisticStatus, setOptimisticStatus] = useState<Record<string, string>>({})
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; request: WR | null }>({ open: false, request: null })
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; request: WR | null }>({ open: false, request: null })
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; request: WR | null; reason: string }>({
    open: false,
    request: null,
    reason: '',
  })
  const [initiateDialog, setInitiateDialog] = useState<{ open: boolean; studentId: string; reason: string }>({
    open: false,
    studentId: '',
    reason: '',
  })

  const filteredRequests = requests.filter((r) => {
    const originalStatus = r.status
    if (filter === 'OPEN') {
      return ['REQUESTED', 'STAFF_CONFIRMED', 'ADMIN_APPROVED'].includes(originalStatus)
    }
    if (filter === 'ALL') {
      return true
    }
    return originalStatus === filter
  })

  const totalPages = Math.ceil(filteredRequests.length / PAGE_SIZE)
  const paginatedRequests = filteredRequests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleConfirm = useCallback(
    (request: WR) => {
      setConfirmDialog({ open: true, request })
    },
    []
  )

  const handleApprove = useCallback(
    (request: WR) => {
      setApproveDialog({ open: true, request })
    },
    []
  )

  const handleReject = useCallback(
    (request: WR) => {
      setRejectDialog({ open: true, request, reason: '' })
    },
    []
  )

  const handleInitiate = useCallback(() => {
    setInitiateDialog({ open: true, studentId: '', reason: '' })
  }, [])

  const executeConfirm = useCallback(async () => {
    if (!confirmDialog.request) return
    const requestId = confirmDialog.request.id

    setOptimisticStatus((prev) => ({ ...prev, [requestId]: 'STAFF_CONFIRMED' }))
    setLoadingAction(requestId)

    const result = await staffConfirmWithdrawal(requestId)

    setLoadingAction(null)
    if (result.error) {
      setOptimisticStatus((prev) => {
        const next = { ...prev }
        delete next[requestId]
        return next
      })
      toast.error(result.error)
    } else {
      toast.success('Confirmed')
    }
    setConfirmDialog({ open: false, request: null })
  }, [confirmDialog.request])

  const executeApprove = useCallback(async () => {
    if (!approveDialog.request) return
    const requestId = approveDialog.request.id

    setLoadingAction(requestId)

    const result = await adminApproveWithdrawal(requestId)

    setLoadingAction(null)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Withdrawal approved')
    }
    setApproveDialog({ open: false, request: null })
  }, [approveDialog.request])

  const executeReject = useCallback(async () => {
    if (!rejectDialog.request || !rejectDialog.reason.trim()) {
      toast.error('Please enter a rejection reason')
      return
    }
    const requestId = rejectDialog.request.id
    const reason = rejectDialog.reason.trim()

    setOptimisticStatus((prev) => ({ ...prev, [requestId]: 'REJECTED' }))
    setLoadingAction(requestId)

    const result = await rejectWithdrawal(requestId, reason)

    setLoadingAction(null)
    if (result.error) {
      setOptimisticStatus((prev) => {
        const next = { ...prev }
        delete next[requestId]
        return next
      })
      toast.error(result.error)
    } else {
      toast.success('Rejected')
    }
    setRejectDialog({ open: false, request: null, reason: '' })
  }, [rejectDialog.request, rejectDialog.reason])

  const executeInitiate = useCallback(async () => {
    if (!initiateDialog.studentId) {
      toast.error('Please select a student')
      return
    }
    if (!initiateDialog.reason.trim()) {
      toast.error('Please provide a reason for the withdrawal')
      return
    }

    setLoadingAction('initiate')

    const result = await staffInitiateWithdrawal(initiateDialog.studentId, initiateDialog.reason.trim())

    setLoadingAction(null)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Withdrawal initiated')
      setInitiateDialog({ open: false, studentId: '', reason: '' })
    }
  }, [initiateDialog.studentId, initiateDialog.reason])

  const getDisplayStatus = (request: WR) => {
    return optimisticStatus[request.id] ?? request.status
  }

  const getStatusLabel = (status: string) => {
    return STATUS_LABELS[status] ?? status.replace(/_/g, ' ')
  }

  const getEmptyMessage = () => {
    const filterOption = FILTER_OPTIONS.find((f) => f.key === filter)
    if (!filterOption) return 'No withdrawal requests.'
    return `No withdrawal requests (${filterOption.label.toLowerCase()}).`
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter withdrawal requests by status">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f.key}
              onClick={() => {
                setFilter(f.key)
                setPage(1)
              }}
              className={`rounded-full border px-3 py-1 text-xs font-bold transition-all ${
                filter === f.key
                  ? 'border-aerojet-blue bg-aerojet-blue text-white'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800'
              }`}
              aria-pressed={filter === f.key}
            >
              {f.label}
            </button>
          ))}
        </div>
        {students.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleInitiate}
            aria-label="Initiate new withdrawal request"
          >
            <Plus className="h-3 w-3" /> Initiate Withdrawal
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800" role="region" aria-label="Withdrawal requests table" tabIndex={0}>
        <table className="w-full text-sm" role="grid" aria-label="Withdrawal requests">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-left dark:border-slate-800 dark:bg-slate-900/50">
              <th className="px-4 py-3 text-[10px] font-black tracking-widest text-slate-400 uppercase" scope="col">
                Student
              </th>
              <th className="px-4 py-3 text-[10px] font-black tracking-widest text-slate-400 uppercase" scope="col">
                Reason
              </th>
              <th className="px-4 py-3 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase" scope="col">
                Status
              </th>
              <th className="px-4 py-3 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase" scope="col">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {paginatedRequests.map((r, index) => {
              const studentNumber = index + 1 + (page - 1) * PAGE_SIZE
              const profile = r.user.profile
              const name = profile
                ? `${profile.firstName} ${profile.lastName}`
                : r.user.email
              const displayName = profile && profile.lastName === 'One' && profile.firstName === 'Student'
                ? `Student ${studentNumber}`
                : name
              const displayStatus = getDisplayStatus(r)
              const canConfirm = displayStatus === 'REQUESTED'
              const canApprove = isAdmin && (displayStatus === 'REQUESTED' || displayStatus === 'STAFF_CONFIRMED')
              const canReject = ['REQUESTED', 'STAFF_CONFIRMED', 'ADMIN_APPROVED'].includes(displayStatus)
              const isLoading = loadingAction === r.id

              return (
                <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800 dark:text-slate-200">{displayName}</div>
                    <div className="text-xs text-slate-400">
                      {r.user.studentProfile?.studentId ?? r.user.email}
                    </div>
                  </td>
                  <td className="max-w-[320px] px-4 py-3 text-slate-600 dark:text-slate-300">
                    <p className="line-clamp-2">{r.reason}</p>
                    {r.rejectedReason && (
                      <p className="mt-1 text-xs text-red-500">Note: {r.rejectedReason}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                        STATUS_STYLE[displayStatus] ?? 'bg-slate-100 text-slate-500'
                      }`}
                      aria-label={`Status: ${getStatusLabel(displayStatus)}`}
                    >
                      {getStatusLabel(displayStatus)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {canConfirm && (
                        <Button
                          variant="default"
                          size="sm"
                          disabled={isPending || isLoading}
                          onClick={() => handleConfirm(r)}
                          aria-label={`Confirm withdrawal for student ${studentNumber}`}
                          aria-disabled={isPending || isLoading}
                        >
                          <CheckCircle2 className="h-3 w-3" /> Confirm
                        </Button>
                      )}
                      {canApprove && (
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          disabled={isPending || isLoading}
                          onClick={() => handleApprove(r)}
                          aria-label={`Approve withdrawal for student ${studentNumber}`}
                          aria-disabled={isPending || isLoading}
                        >
                          <ShieldCheck className="h-3 w-3" /> Approve
                        </Button>
                      )}
                      {canReject && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isPending || isLoading}
                          onClick={() => handleReject(r)}
                          aria-label={`Reject withdrawal for student ${studentNumber}`}
                          aria-disabled={isPending || isLoading}
                        >
                          <XCircle className="h-3 w-3" /> Reject
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {paginatedRequests.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">
                  {getEmptyMessage()}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
          <div className="flex items-center justify-between text-sm">
            <div className="text-slate-500 dark:text-slate-400" aria-live="polite">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
                aria-label="Previous page"
              >
                Prev
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                const pageNum = Math.max(1, page - 2) + i
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    aria-label={`Page ${pageNum}`}
                    aria-current={pageNum === page ? 'page' : undefined}
                  >
                    {pageNum}
                  </Button>
                )
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
                aria-label="Next page"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, request: null })}>
        <DialogContent aria-modal="true">
          <DialogHeader>
            <DialogTitle>Confirm Withdrawal</DialogTitle>
            <DialogDescription>
              Are you sure you want to confirm this withdrawal request? This will move it to Staff Confirmed status.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, request: null })}>
              Cancel
            </Button>
            <Button
              onClick={executeConfirm}
              disabled={isPending || !!loadingAction}
              aria-disabled={isPending || !!loadingAction}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={approveDialog.open} onOpenChange={(open) => !open && setApproveDialog({ open: false, request: null })}>
        <DialogContent aria-modal="true">
          <DialogHeader>
            <DialogTitle>Approve Withdrawal</DialogTitle>
            <DialogDescription>
              This will archive the student and mark all enrollments as withdrawn. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog({ open: false, request: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={executeApprove} disabled={isPending || !!loadingAction}>
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialog.open} onOpenChange={(open) => !open && setRejectDialog({ open: false, request: null, reason: '' })}>
        <DialogContent aria-modal="true">
          <DialogHeader>
            <DialogTitle>Reject Withdrawal</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this withdrawal request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-reason" className="block text-sm font-medium mb-1">
                Reason for rejection
              </Label>
              <Textarea
                id="reject-reason"
                value={rejectDialog.reason}
                onChange={(e) => setRejectDialog((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter rejection reason..."
                rows={3}
                aria-required="true"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, request: null, reason: '' })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={executeReject} disabled={isPending || !!loadingAction}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={initiateDialog.open} onOpenChange={(open) => !open && setInitiateDialog({ open: false, studentId: '', reason: '' })}>
        <DialogContent aria-modal="true">
          <DialogHeader>
            <DialogTitle>Initiate Withdrawal</DialogTitle>
            <DialogDescription>
              Create a new withdrawal request on behalf of a student.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
<div>
               <Label htmlFor="initiate-student" className="block text-sm font-medium mb-1">
                 Student
               </Label>
               <select
                 id="initiate-student"
                 value={initiateDialog.studentId}
                 onChange={(e) => setInitiateDialog((prev) => ({ ...prev, studentId: e.target.value }))}
onKeyDown={(e) => {
                    if (e.key === 'ArrowDown' && !initiateDialog.studentId) {
                      e.preventDefault()
                      const firstOption = e.currentTarget.querySelector('option:not([value=""])') as HTMLOptionElement | null
                      if (firstOption) {
                        const newValue = firstOption.value
                        setInitiateDialog((prev) => ({ ...prev, studentId: newValue }))
                        e.currentTarget.value = newValue
                        e.currentTarget.dispatchEvent(new Event('change', { bubbles: true }))
                      }
                    }
                    if (e.key === 'Enter') {
                      e.currentTarget.blur()
                    }
                  }}
                 className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                 aria-required="true"
                 role="combobox"
                 aria-label="Select student"
               >
                 <option value="">Select a student</option>
                 {students.map((s) => (
                   <option key={s.id} value={s.id}>
                     {s.profile
                       ? `${s.profile.firstName} ${s.profile.lastName} (${s.email})`
                       : s.email}
                   </option>
                 ))}
               </select>
             </div>
            <div>
              <Label htmlFor="initiate-reason" className="block text-sm font-medium mb-1">
                Reason
              </Label>
              <Textarea
                id="initiate-reason"
                value={initiateDialog.reason}
                onChange={(e) => setInitiateDialog((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter reason for withdrawal..."
                rows={3}
                aria-required="true"
              />
            </div>
          </div>
<DialogFooter>
             <Button variant="outline" onClick={() => setInitiateDialog({ open: false, studentId: '', reason: '' })}>
               Cancel
             </Button>
             <Button onClick={executeInitiate} disabled={isPending || !!loadingAction}>
               Initiate
             </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}