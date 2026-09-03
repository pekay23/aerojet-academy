'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  History,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
} from 'lucide-react'

interface Transaction {
  id: string
  amount: number
  type: string
  status: string
  createdAt: string
  referenceType?: string
  referenceId?: string
  description?: string
}

interface Payment {
  id: string
  amount: number
  status: string
  paymentMethod?: string
  createdAt: string
  rejectionReason?: string
}

interface TransactionHistoryProps {
  transactions: Transaction[]
  payments: Payment[]
}

interface StatusConfig {
  APPROVED: {
    color: 'text-green-600'
    bg: 'bg-green-50'
    icon: typeof CheckCircle2
    label: 'Approved'
  }
  PENDING: { color: 'text-orange-600'; bg: 'bg-orange-50'; icon: typeof Clock; label: 'Pending' }
  REJECTED: { color: 'text-red-600'; bg: 'bg-red-50'; icon: typeof XCircle; label: 'Rejected' }
  COMPLETED: {
    color: 'text-green-600'
    bg: 'bg-green-50'
    icon: typeof CheckCircle2
    label: 'Completed'
  }
  FAILED: { color: 'text-red-600'; bg: 'bg-red-50'; icon: typeof XCircle; label: 'Failed' }
  TOP_UP: { color: 'text-green-600'; bg: 'bg-green-50'; icon: typeof ArrowUpRight; label: 'Credit' }
  DEBIT: { color: 'text-red-600'; bg: 'bg-red-50'; icon: typeof ArrowDownRight; label: 'Debit' }
  RESERVE: { color: 'text-orange-600'; bg: 'bg-orange-50'; icon: typeof Clock; label: 'Reserved' }
}

export default function TransactionHistory({ transactions, payments }: TransactionHistoryProps) {
  const router = useRouter()
  const [showCancelModal, setShowCancelModal] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  const statusConfig: StatusConfig = {
    APPROVED: { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle2, label: 'Approved' },
    PENDING: { color: 'text-orange-600', bg: 'bg-orange-50', icon: Clock, label: 'Pending' },
    REJECTED: { color: 'text-red-600', bg: 'bg-red-50', icon: XCircle, label: 'Rejected' },
    COMPLETED: {
      color: 'text-green-600',
      bg: 'bg-green-50',
      icon: CheckCircle2,
      label: 'Completed',
    },
    FAILED: { color: 'text-red-600', bg: 'bg-red-50', icon: XCircle, label: 'Failed' },
    TOP_UP: { color: 'text-green-600', bg: 'bg-green-50', icon: ArrowUpRight, label: 'Credit' },
    DEBIT: { color: 'text-red-600', bg: 'bg-red-50', icon: ArrowDownRight, label: 'Debit' },
    RESERVE: { color: 'text-orange-600', bg: 'bg-orange-50', icon: Clock, label: 'Reserved' },
  }

  const handleCancelPayment = async (paymentId: string) => {
    if (!cancelReason || cancelReason.trim().length < 10) {
      toast.error('Please provide a reason (min 10 characters)')
      return
    }

    setCancelling(true)
    try {
      const res = await fetch(`/api/applicant/exam-only/payments/${paymentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to cancel payment')
        return
      }

      toast.success('Payment cancelled successfully')
      setShowCancelModal(null)
      setCancelReason('')
      router.refresh()
    } catch (error) {
      toast.error('Network error. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  const allItems = [
    ...transactions.map((t) => ({ ...t, itemType: 'transaction' as const })),
    ...payments.map((p) => ({ ...p, itemType: 'payment' as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  if (allItems.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-700">
              <History className="h-5 w-5 text-slate-500" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Transaction History</h3>
              <p className="text-xs text-slate-500">Your wallet activity</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <Wallet className="h-8 w-8 text-slate-300" />
          </div>
          <p className="font-medium text-slate-500">No transactions yet</p>
          <p className="text-sm text-slate-400">Your wallet transactions will appear here</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-700">
                <History className="h-5 w-5 text-slate-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">
                  Transaction History
                </h3>
                <p className="text-xs text-slate-500">{allItems.length} transactions</p>
              </div>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {allItems.map((item) => {
            const isPayment = item.itemType === 'payment'
            const transactionType = isPayment ? '' : (item as Transaction).type
            const status = isPayment ? item.status : transactionType
            const config =
              (statusConfig as StatusConfig)[status] || (statusConfig as StatusConfig).PENDING
            const StatusIcon = config.icon
            const isCredit =
              isPayment || transactionType === 'TOP_UP' || transactionType === 'REFUND'
            const isDebit = transactionType === 'DEBIT' || transactionType === 'RESERVE'

            return (
              <div
                key={item.id}
                className="group px-6 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.bg} dark:bg-slate-800`}
                    >
                      <StatusIcon className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {isPayment ? 'Wallet Top-Up' : item.description || item.type}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{new Date(item.createdAt).toLocaleTimeString()}</span>
                        {isPayment && item.paymentMethod && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{item.paymentMethod}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`flex items-center gap-1 font-bold ${
                        isCredit
                          ? 'text-green-600'
                          : isDebit
                            ? 'text-orange-600'
                            : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {isCredit && <ArrowUpRight className="h-4 w-4" />}
                      {isDebit && <ArrowDownRight className="h-4 w-4" />}
                      <span>€{Number(item.amount).toFixed(2)}</span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.bg} ${config.color}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {config.label}
                    </span>
                  </div>
                </div>

                {/* Actions for pending payments */}
                {isPayment && item.status === 'PENDING' && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => setShowCancelModal(item.id)}
                      className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400"
                    >
                      <X className="h-3 w-3" />
                      Cancel
                    </button>
                  </div>
                )}

                {/* Rejection reason */}
                {isPayment && item.status === 'REJECTED' && item.rejectionReason && (
                  <div className="mt-3 rounded-lg border border-red-100 bg-red-50/50 p-3 dark:border-red-900/20 dark:bg-red-900/10">
                    <p className="text-xs font-medium text-red-600 dark:text-red-400">
                      <AlertCircle className="mr-1 inline h-3 w-3" />
                      Reason: {item.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="border-b border-slate-100 bg-red-50 px-6 py-4 dark:border-slate-800 dark:bg-red-900/20">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-red-900 dark:text-red-300">Cancel Payment</h3>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    This action cannot be undone
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Reason for cancellation
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please provide a reason (min 10 characters)..."
                  className="w-full rounded-xl border-2 border-slate-200 p-3 text-sm transition-colors focus:border-red-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  rows={3}
                />
                <p className="mt-1 text-xs text-slate-400">
                  {cancelReason.length}/10 characters minimum
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCancelModal(null)
                    setCancelReason('')
                  }}
                  className="flex-1 rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Keep Payment
                </button>
                <button
                  onClick={() => handleCancelPayment(showCancelModal)}
                  disabled={cancelling || cancelReason.length < 10}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {cancelling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <X className="h-4 w-4" />
                      Cancel Payment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
