import Link from 'next/link'
import { AlertTriangle, Wallet, CreditCard, ArrowRight, CheckCircle2, Clock } from 'lucide-react'

interface MilestoneInfo {
  id: string
  type: string
  yearNumber: number
  amountDue: number
  status: string
  dueDate: Date | string
  paidAt: Date | string | null
}

interface PaymentRequiredBannerProps {
  accessLevel: 'FULL_ACCESS' | 'SEAT_ONLY' | 'RESTRICTED'
  milestoneStatus: {
    hasEnrollment: boolean
    seatPaid: boolean
    sem1Paid: boolean
    sem2Paid: boolean
    currentYear: number | null
    programmeName: string | null
    milestones: MilestoneInfo[]
  }
  walletBalance: {
    available: number
    held: number
    currency: string
  }
}

export function PaymentRequiredBanner({
  accessLevel,
  milestoneStatus,
  walletBalance,
}: PaymentRequiredBannerProps) {
  if (accessLevel === 'FULL_ACCESS') {
    return null
  }

  const nextUnpaidMilestone = milestoneStatus.milestones.find(
    (m) => m.status === 'DUE' || m.status === 'OVERDUE'
  )

  const formatCurrency = (amount: number) => {
    return `${milestoneStatus.programmeName?.includes('EUR') || milestoneStatus.programmeName?.includes('Full-Time') ? '€' : milestoneStatus.currentYear ? '€' : '€'}${amount.toLocaleString()}`
  }

  const getDaysUntilDue = (dueDate: Date | string) => {
    const now = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getMilestoneLabel = (type: string) => {
    switch (type) {
      case 'SEAT_CONFIRMATION':
        return 'Seat Confirmation'
      case 'SEM1_DUE':
        return 'Semester 1 Payment'
      case 'SEM2_DUE':
        return 'Semester 2 Payment'
      default:
        return type
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800/50 dark:bg-amber-900/10">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-amber-800 dark:text-amber-200">
              Payment Required for Full Access
            </h2>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              {accessLevel === 'RESTRICTED' && (
                <>
                  Please complete your <strong>seat confirmation payment</strong> to access the
                  student portal features. You must pay at least 40% of Year 1 fees to secure your
                  seat.
                </>
              )}
              {accessLevel === 'SEAT_ONLY' && (
                <>
                  Please complete your <strong>Semester 1 payment</strong> to access course content
                  and classes. Your seat is confirmed, but you need to pay 30% more to continue.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <Wallet className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                Wallet Balance
              </p>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100">
                €{walletBalance.available.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Link
              href="/student/wallet?tab=top-up"
              className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-center text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Top Up
            </Link>
            <Link
              href="/student/wallet?tab=payments"
              className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Pay Milestone
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-slate-100">Payment Progress</h3>
            <span className="text-xs font-bold text-slate-400">
              Year {milestoneStatus.currentYear || 1}
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {milestoneStatus.seatPaid ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Clock className="h-5 w-5 text-slate-300" />
              )}
              <span
                className={`text-sm ${
                  milestoneStatus.seatPaid
                    ? 'font-semibold text-green-700 dark:text-green-400'
                    : 'text-slate-500'
                }`}
              >
                Seat Confirmation (40%)
              </span>
            </div>
            <div className="flex items-center gap-3">
              {milestoneStatus.sem1Paid ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Clock className="h-5 w-5 text-slate-300" />
              )}
              <span
                className={`text-sm ${
                  milestoneStatus.sem1Paid
                    ? 'font-semibold text-green-700 dark:text-green-400'
                    : 'text-slate-500'
                }`}
              >
                Semester 1 (30%)
              </span>
            </div>
            <div className="flex items-center gap-3">
              {milestoneStatus.sem2Paid ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Clock className="h-5 w-5 text-slate-300" />
              )}
              <span
                className={`text-sm ${
                  milestoneStatus.sem2Paid
                    ? 'font-semibold text-green-700 dark:text-green-400'
                    : 'text-slate-500'
                }`}
              >
                Semester 2 (30%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {nextUnpaidMilestone && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800/50 dark:bg-blue-900/10">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-blue-900 dark:text-blue-200">Next Payment Due</h3>
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                {getMilestoneLabel(nextUnpaidMilestone.type)} -{' '}
                <strong>€{nextUnpaidMilestone.amountDue.toLocaleString()}</strong>
              </p>
              {nextUnpaidMilestone.status === 'OVERDUE' ? (
                <p className="mt-1 text-sm font-bold text-red-600">Payment overdue!</p>
              ) : (
                <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
                  Due in {getDaysUntilDue(nextUnpaidMilestone.dueDate)} days
                </p>
              )}
            </div>
            <Link
              href="/student/wallet?tab=payments"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Pay Now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 font-bold text-slate-900 dark:text-slate-100">Payment Options</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href="/student/wallet?tab=payments&action=seat"
            className="flex flex-col items-center rounded-xl border border-slate-200 bg-slate-50 p-4 text-center transition hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
          >
            <CreditCard className="mb-2 h-5 w-5 text-slate-500 dark:text-slate-400" />
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Pay Seat</span>
            <span className="text-xs text-slate-500">40% to secure</span>
          </Link>
          <Link
            href="/student/wallet?tab=payments&action=sem1"
            className="flex flex-col items-center rounded-xl border border-slate-200 bg-slate-50 p-4 text-center transition hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
          >
            <CreditCard className="mb-2 h-5 w-5 text-slate-500 dark:text-slate-400" />
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Pay Semester
            </span>
            <span className="text-xs text-slate-500">30% per semester</span>
          </Link>
          <Link
            href="/student/wallet?tab=payments&action=full"
            className="flex flex-col items-center rounded-xl border border-slate-200 bg-slate-50 p-4 text-center transition hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
          >
            <CreditCard className="mb-2 h-5 w-5 text-slate-500 dark:text-slate-400" />
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Pay Full Year
            </span>
            <span className="text-xs text-slate-500">100% upfront</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
