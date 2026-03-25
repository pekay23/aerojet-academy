'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  User,
  Calendar,
  DollarSign,
} from 'lucide-react'

interface PaymentApprovalCardProps {
  payment: {
    id: string
    amount: number
    currency?: string
    paymentMethod: string
    referenceCode?: string | null
    referenceType?: string | null
    proofUrl?: string | null
    createdAt: Date | string
    user: {
      id: string
      email: string
      profile?: { firstName: string; lastName: string } | null
    }
  }
  onApproved?: (id: string) => void
  onRejected?: (id: string) => void
}

export default function PaymentApprovalCard({
  payment,
  onApproved,
  onRejected,
}: PaymentApprovalCardProps) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  const fullName = payment.user.profile
    ? `${payment.user.profile.firstName} ${payment.user.profile.lastName}`
    : payment.user.email

  const dateStr = new Date(payment.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const router = useRouter()

  const handleApprove = async () => {
    setLoading('approve')
    try {
      const res = await fetch(`/api/staff/payments/${payment.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      if (!res.ok) throw new Error('Failed to approve')
      toast.success('Payment approved')
      onApproved?.(payment.id)
      router.refresh()
    } catch {
      toast.error('Failed to approve payment')
    } finally {
      setLoading(null)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    setLoading('reject')
    try {
      const res = await fetch(`/api/staff/payments/${payment.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason: rejectionReason }),
      })
      if (!res.ok) throw new Error('Failed to reject')
      toast.success('Payment rejected')
      onRejected?.(payment.id)
      router.refresh()
    } catch {
      toast.error('Failed to reject payment')
    } finally {
      setLoading(null)
      setShowRejectForm(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-aerojet-blue/10 dark:bg-blue-500/10">
            <User className="h-4 w-4 text-aerojet-blue dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-white">{fullName}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{payment.user.email}</p>
          </div>
        </div>
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-500">
          Pending
        </span>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-3 px-5 py-4">
        <div>
          <p className="mb-0.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
            Amount
          </p>
          <p className="text-base font-black text-aerojet-blue dark:text-blue-400">
            {payment.currency ?? 'GHS'} {Number(payment.amount).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="mb-0.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
            Method
          </p>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {payment.paymentMethod.replace(/_/g, ' ')}
          </p>
        </div>
        <div>
          <p className="mb-0.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
            Type
          </p>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {payment.referenceType?.replace(/_/g, ' ') ?? '—'}
          </p>
        </div>
        <div>
          <p className="mb-0.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
            Submitted
          </p>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{dateStr}</p>
        </div>
      </div>

      {/* Proof Link */}
      {payment.proofUrl && (
        <div className="px-5 pb-4">
          <a
            href={payment.proofUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-aerojet-sky hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View Payment Proof
          </a>
        </div>
      )}

      {/* Rejection Form */}
      {showRejectForm && (
        <div className="px-5 pb-4">
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Reason for rejection..."
            rows={2}
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-red-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-red-900/50"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 px-5 pb-5">
        {showRejectForm ? (
          <>
            <button
              onClick={handleReject}
              disabled={loading === 'reject'}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500 py-2.5 text-xs font-black text-white transition-all hover:bg-red-600 disabled:opacity-50"
            >
              {loading === 'reject' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              Confirm Reject
            </button>
            <button
              onClick={() => setShowRejectForm(false)}
              className="px-4 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleApprove}
              disabled={!!loading}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2.5 text-xs font-black text-white transition-all hover:bg-emerald-600 disabled:opacity-50"
            >
              {loading === 'approve' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Approve
            </button>
            <button
              onClick={() => setShowRejectForm(true)}
              disabled={!!loading}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-50 py-2.5 text-xs font-black text-red-600 transition-all hover:bg-red-100 disabled:opacity-50"
            >
              <XCircle className="h-3.5 w-3.5" />
              Reject
            </button>
          </>
        )}
      </div>
    </div>
  )
}
