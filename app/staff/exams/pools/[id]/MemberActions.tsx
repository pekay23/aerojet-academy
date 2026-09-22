'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { AlertCircle, CheckCircle2, MoreVertical, UserMinus, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

interface MemberActionsProps {
  membershipId: string
  bookingId?: string | null
  sittingId?: string | null
  memberName: string
  status: string
  poolId: string
}

export default function MemberActions({
  membershipId,
  bookingId,
  sittingId,
  memberName,
  status,
  poolId,
}: MemberActionsProps) {
  const [loading, setLoading] = useState(false)
  const [removeDialog, setRemoveDialog] = useState<{ open: boolean; reason: string }>({
    open: false,
    reason: '',
  })
  const [removeReasonError, setRemoveReasonError] = useState(false)
  const router = useRouter()

  const openRemoveDialog = () => {
    setRemoveDialog({ open: true, reason: '' })
    setRemoveReasonError(false)
  }

  const confirmRemove = async () => {
    const trimmed = removeDialog.reason.trim()
    if (trimmed.length < 5) {
      setRemoveReasonError(true)
      return
    }
    setRemoveDialog({ open: false, reason: '' })
    setRemoveReasonError(false)
    setLoading(true)
    try {
      const res = await fetch(`/api/staff/exam-pools/${poolId}/members/${membershipId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: trimmed }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to remove member')
      } else {
        router.refresh()
      }
    } catch {
      toast.error('Network error')
    }
    setLoading(false)
  }

  async function handleNoShow() {
    if (!confirm(`Mark ${memberName} as NO_SHOW?`)) return
    setLoading(true)
    try {
      const res = await fetch('/api/staff/exam-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipId, bookingId, sittingId, status: 'ABSENT' }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to mark absent')
      } else {
        router.refresh()
      }
    } catch {
      toast.error('Network error')
    }
    setLoading(false)
  }

  async function handlePresent() {
    if (!confirm(`Mark ${memberName} as PRESENT?`)) return
    setLoading(true)
    try {
      const res = await fetch('/api/staff/exam-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipId, bookingId, sittingId, status: 'PRESENT' }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to mark present')
      } else {
        router.refresh()
      }
    } catch {
      toast.error('Network error')
    }
    setLoading(false)
  }

  async function handleExcused() {
    if (!confirm(`Mark ${memberName} as EXCUSED?`)) return
    setLoading(true)
    try {
      const res = await fetch('/api/staff/exam-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipId, bookingId, sittingId, status: 'EXCUSED' }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to mark excused')
      } else {
        router.refresh()
      }
    } catch {
      toast.error('Network error')
    }
    setLoading(false)
  }

  const canRemove = ['RESERVED', 'CONFIRMED'].includes(status)
  const canMarkAttendance = ['CONFIRMED', 'NO_SHOW'].includes(status)

  if (!canRemove && !canMarkAttendance) return null

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            disabled={loading}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 dark:hover:bg-slate-800"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="z-50 w-48 rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          {canRemove && (
            <DropdownMenuItem
              onClick={openRemoveDialog}
              disabled={loading}
              className="flex cursor-pointer items-center gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700 dark:hover:bg-red-900/20 dark:focus:bg-red-900/20"
            >
              <UserMinus className="h-4 w-4" />
              Remove from Pool
            </DropdownMenuItem>
          )}
          {canMarkAttendance && (
            <DropdownMenuItem
              onClick={handlePresent}
              disabled={loading}
              className="flex cursor-pointer items-center gap-2 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 focus:bg-emerald-50 focus:text-emerald-700 dark:hover:bg-emerald-900/20 dark:focus:bg-emerald-900/20"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark Present
            </DropdownMenuItem>
          )}
          {canMarkAttendance && (
            <DropdownMenuItem
              onClick={handleNoShow}
              disabled={loading}
              className="flex cursor-pointer items-center gap-2 text-amber-600 hover:bg-amber-50 hover:text-amber-700 focus:bg-amber-50 focus:text-amber-700 dark:hover:bg-amber-900/20 dark:focus:bg-amber-900/20"
            >
              <XCircle className="h-4 w-4" />
              Mark Absent
            </DropdownMenuItem>
          )}
          {canMarkAttendance && (
            <DropdownMenuItem
              onClick={handleExcused}
              disabled={loading}
              className="flex cursor-pointer items-center gap-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700 dark:hover:bg-blue-900/20 dark:focus:bg-blue-900/20"
            >
              <AlertCircle className="h-4 w-4" />
              Mark Excused
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={removeDialog.open}
        onOpenChange={(open) => setRemoveDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {memberName} from Pool</DialogTitle>
            <DialogDescription>
              Why are you removing {memberName} from this pool? A mandatory reason is required (min
              5 characters).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="remove-reason" className="text-sm font-medium">
              Reason
            </Label>
            <Textarea
              id="remove-reason"
              value={removeDialog.reason}
              onChange={(e) => {
                setRemoveDialog((prev) => ({ ...prev, reason: e.target.value }))
                setRemoveReasonError(false)
              }}
              placeholder="Enter removal reason..."
              rows={4}
              aria-invalid={removeReasonError}
              aria-describedby="remove-reason-error"
            />
            {removeReasonError && (
              <p id="remove-reason-error" className="text-sm text-red-600">
                A valid reason is required (minimum 5 characters).
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoveDialog({ open: false, reason: '' })}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRemove}
              disabled={loading || !removeDialog.reason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
