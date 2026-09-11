'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useFormDirty } from '@/hooks/useFormDirty'

export function TopupActions({
  paymentId,
  amount,
  userName,
}: {
  paymentId: string
  amount: string
  userName: string
}) {
  const router = useRouter()
  const [loadingApprove, setLoadingApprove] = useState(false)
  const [loadingReject, setLoadingReject] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [isRejectModalOpen, setRejectModalOpen] = useState(false)

  const { markDirty, markClean } = useFormDirty()

  const handleApprove = async () => {
    if (!confirm(`Are you sure you want to approve ${amount} for ${userName}?`)) return
    setLoadingApprove(true)
    try {
      const res = await fetch(`/api/staff/finance/wallet-topups/${paymentId}/approve`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Wallet top-up approved successfully!')
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to approve top-up'
      toast.error(message)
    } finally {
      setLoadingApprove(false)
    }
  }

  const handleReject = async () => {
    if (!rejectReason) {
      toast.error('Rejection reason is required.')
      return
    }
    setLoadingReject(true)
    try {
      const res = await fetch(`/api/staff/finance/wallet-topups/${paymentId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Wallet top-up rejected.')
      markClean()
      setRejectModalOpen(false)
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reject top-up'
      toast.error(message)
    } finally {
      setLoadingReject(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        disabled={loadingApprove || loadingReject}
        onClick={handleApprove}
        className="h-8 rounded-xl bg-emerald-600 px-3 text-xs text-white hover:bg-emerald-700"
      >
        {loadingApprove ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
          </>
        )}
      </Button>

      <Dialog open={isRejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            disabled={loadingApprove || loadingReject}
            className="h-8 rounded-xl border-red-200 px-3 text-xs text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <XCircle className="mr-1 h-4 w-4" /> Reject
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Reject Top-up Request</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <p className="text-sm text-slate-500">
              Please provide a reason for rejecting the top-up request from {userName}. They will
              see this reason in their dashboard.
            </p>
            <Textarea
              placeholder="e.g. The payment proof uploaded is blurry."
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value)
                markDirty()
              }}
              className="rounded-xl text-sm"
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setRejectModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="rounded-xl"
                disabled={loadingReject || !rejectReason}
                onClick={handleReject}
              >
                {loadingReject ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
