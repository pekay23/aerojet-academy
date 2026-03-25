'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Loader2,
  Wallet,
} from 'lucide-react'

interface Milestone {
  id: string
  milestoneType: string
  yearNumber: number
  percentOfYearFee: number
  amountDue: number
  status: string
  dueDate: string
  paidAt: string | null
}

interface Props {
  milestones: Milestone[]
  walletBalance: number
  currency: string
}

const MILESTONE_LABELS: Record<string, string> = {
  SEAT_CONFIRMATION: 'Seat Confirmation',
  SEM1_DUE: 'Before Semester 1',
  SEM2_DUE: 'Before Semester 2',
  FULL_YEAR: 'Full Year',
  FULL_COURSE: 'Full Programme',
}

function statusIcon(status: string) {
  switch (status) {
    case 'PAID':
      return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
    case 'OVERDUE':
      return <AlertTriangle className="h-5 w-5 text-red-500" />
    case 'DUE':
      return <Clock className="h-5 w-5 text-amber-500" />
    default:
      return <Circle className="h-5 w-5 text-slate-300" />
  }
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    PAID: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    DUE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    WAIVED: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  }
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${styles[status] ?? styles.DUE}`}
    >
      {status}
    </span>
  )
}

export default function MilestoneTracker({ milestones, walletBalance, currency }: Props) {
  const [paying, setPaying] = useState<string | null>(null)
  const router = useRouter()

  const totalDue = milestones.reduce((acc, m) => acc + m.amountDue, 0)
  const totalPaid = milestones
    .filter((m) => m.status === 'PAID')
    .reduce((acc, m) => acc + m.amountDue, 0)
  const progressPercent = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0

  const handlePayFromWallet = async (milestoneId: string) => {
    setPaying(milestoneId)
    try {
      const res = await fetch('/api/applicant/pay-milestone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestoneId }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to pay milestone')
        return
      }
      toast.success('Milestone paid successfully!')
      router.refresh()
    } catch {
      toast.error('Network error while paying milestone')
    } finally {
      setPaying(null)
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-900 dark:text-slate-100">Payment Milestones</h2>
        {statusBadge(`${progressPercent}% Complete`)}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400">
          <span>
            {currency} {totalPaid.toLocaleString()} paid
          </span>
          <span>
            {currency} {totalDue.toLocaleString()} total
          </span>
        </div>
      </div>

      {/* Milestone List */}
      <div className="space-y-3">
        {milestones.map((m, idx) => {
          const canPay = m.status === 'DUE' || m.status === 'OVERDUE'
          const hasEnoughBalance = walletBalance >= m.amountDue
          const isPaying = paying === m.id

          return (
            <div
              key={m.id}
              className={`rounded-xl border p-4 transition-colors ${
                m.status === 'PAID'
                  ? 'border-emerald-100 bg-emerald-50/50 dark:border-emerald-900/20 dark:bg-emerald-900/5'
                  : m.status === 'OVERDUE'
                    ? 'border-red-100 bg-red-50/50 dark:border-red-900/20 dark:bg-red-900/5'
                    : 'border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{statusIcon(m.status)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {MILESTONE_LABELS[m.milestoneType] || m.milestoneType}
                    </span>
                    {statusBadge(m.status)}
                    <span className="text-xs text-slate-400">
                      Year {m.yearNumber} — {m.percentOfYearFee}%
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {m.status === 'PAID' && m.paidAt ? (
                        <span>
                          Paid on{' '}
                          {new Date(m.paidAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      ) : (
                        <span>
                          Due:{' '}
                          {new Date(m.dueDate).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                    <span className="text-lg font-black text-slate-900 dark:text-slate-100">
                      {currency} {m.amountDue.toLocaleString()}
                    </span>
                  </div>

                  {/* Pay from Wallet button */}
                  {canPay && (
                    <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                      {hasEnoughBalance ? (
                        <button
                          onClick={() => handlePayFromWallet(m.id)}
                          disabled={isPaying}
                          className="flex items-center gap-2 rounded-xl bg-aerojet-blue px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#003875] disabled:opacity-50"
                        >
                          {isPaying ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Wallet className="h-3.5 w-3.5" />
                              Pay from Wallet
                            </>
                          )}
                        </button>
                      ) : (
                        <p className="text-xs text-slate-400">
                          Insufficient wallet balance ({currency}{' '}
                          {walletBalance.toLocaleString()} available). Top up your wallet first.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
