import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Wallet,
  PlusCircle,
  CreditCard,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Info,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Target,
  RefreshCw,
  History,
} from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import WalletTabs from '../_components/WalletTabs'
import PayMilestoneButton from '../_components/PayMilestoneButton'
import StudentWalletTransactionsTable from './_components/StudentWalletTransactionsTable'
import { UploadProofForm } from './top-up/_components/UploadProofForm'
import { getActivePaymentMethods } from '@/lib/payment-methods'
import PaymentMethodsDisplay from '@/components/shared/PaymentMethodsDisplay'
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay'
import { getCurrencySymbol } from '@/lib/currency'
import { resolveEffectiveEnrollmentType } from '@/lib/enrollment/pathway'

export const metadata: Metadata = {
  title: 'Wallet | Student Portal',
  description: 'Manage your training wallet and transactions.',
}

export default async function WalletPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; action?: string }>
}) {
  const { tab: tabParam, action: actionParam } = await searchParams
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const user = session.user
  const tab = tabParam || 'overview'

  const [wallet, studentProfile, pendingTopups, ftEnrollment, activeBundles, pendingTuition] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: user.id } }),
    prisma.studentProfile.findUnique({
      where: { userId: user.id },
      select: {
        studentId: true,
        enrollmentType: true,
        programmeChoice: true,
        pathwayRel: true,
      },
    }),
    prisma.payment.findMany({
      where: { userId: user.id, referenceType: 'WALLET_TOPUP', status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.fullTimeEnrollment.findFirst({
      where: { studentId: user.id },
      include: {
        programme: true,
        milestones: { orderBy: [{ yearNumber: 'asc' }, { createdAt: 'asc' }] },
      },
    }),
    prisma.examBundle.findMany({
      where: { userId: user.id, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.payment.findMany({
      where: {
        userId: user.id,
        referenceType: { in: ['SEAT_CONFIRMATION', 'YEAR_1_FULL', 'FULL_PROGRAMME', 'CUSTOM_PART_PAYMENT'] },
        status: 'PENDING'
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ])

  const studentId = studentProfile?.studentId || 'N/A'
  const walletBalance = {
    available: Number(wallet?.availableBalance || 0),
    held: Number(wallet?.reservedBalance || 0),
    currency: wallet?.currency || 'EUR',
  }

  const currencySymbol = getCurrencySymbol(walletBalance.currency)
  const hasPendingTopups = pendingTopups.length > 0
  const effectiveEnrollmentType = resolveEffectiveEnrollmentType({
    pathwayCode: studentProfile?.pathwayRel?.code,
    enrollmentType: studentProfile?.enrollmentType,
    programmeChoice: studentProfile?.programmeChoice,
  })
  const isExamOnly = effectiveEnrollmentType === 'EXAM_ONLY'
  const isFullTime = effectiveEnrollmentType === 'FULL_TIME'

  // Fetch payment methods for top-up tab
  const activePaymentMethods = (tab === 'top-up' || tab === 'payments') ? await getActivePaymentMethods() : []

  // Logic for action-based top-up requirements
  let requiredAmount = 0
  let actionLabel = ''
  
  if (actionParam && ftEnrollment) {
    const milestoneTypeMap: Record<string, string> = {
      seat: 'SEAT_CONFIRMATION',
      sem1: 'SEM1_DUE',
      sem2: 'SEM2_DUE',
      full: 'FULL_YEAR'
    }
    
    const targetType = milestoneTypeMap[actionParam]
    if (targetType) {
      if (targetType === 'FULL_YEAR') {
        requiredAmount = ftEnrollment.milestones
          .filter(m => m.status !== 'PAID')
          .reduce((sum, m) => sum + Number(m.amountDue), 0)
        actionLabel = 'Full Year Payment'
      } else {
        const milestone = ftEnrollment.milestones.find(m => m.milestoneType === targetType)
        if (milestone) {
          requiredAmount = Number(milestone.amountDue)
          actionLabel = targetType === 'SEAT_CONFIRMATION' ? 'Seat Confirmation' : 
                        targetType === 'SEM1_DUE' ? 'Semester 1' : 'Semester 2'
        }
      }
    }
  }

  // Fetch transactions for transactions tab
  let allTransactions: any[] = []
  if (tab === 'transactions') {
    // Audit 4g: the transactions tab shows only approved purchases/deposits and
    // wallet deductions. Pending payments and invoices are intentionally excluded
    // (invoices remain hidden; payment gateway stays hidden).
    const [walletTransactions, historyPayments] = await Promise.all([
      prisma.walletTransaction.findMany({
        where: { wallet: { userId: user.id } },
        include: { wallet: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.payment.findMany({
        where: {
          userId: user.id,
          status: 'APPROVED',
          referenceType: { not: 'WALLET_TOPUP' }, // Wallet top-ups are already in WalletTransaction
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ])

    allTransactions = [
      ...walletTransactions.map((tx) => ({
        id: tx.id,
        createdAt: tx.createdAt,
        type: tx.type,
        amount: Number(tx.amount),
        description: tx.description || tx.type.replace('_', ' '),
        status: 'COMPLETED',
        currency: tx.wallet.currency,
        isPending: false,
      })),
      ...historyPayments.map((p) => ({
        id: p.id,
        createdAt: p.createdAt,
        type: p.referenceType || 'PAYMENT',
        amount: Number(p.amount),
        description: `${p.referenceType || 'Payment'} (${p.paymentMethod || 'Transfer'})`,
        status: 'COMPLETED',
        currency: p.currency,
        paymentCurrency: p.paymentCurrency,
        originalAmount: p.originalAmount ? Number(p.originalAmount) : undefined,
        isPending: false,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  const isCredit = (type: string) => ['TOP_UP', 'RELEASE', 'REFUND', 'ADJUSTMENT'].includes(type)

  return (
    <WalletTabs studyMode={effectiveEnrollmentType}>
      {/* ── Overview Tab ── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {hasPendingTopups && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                  Top-up Awaiting Approval
                </p>
                <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                  {pendingTopups.length} payment{pendingTopups.length > 1 ? 's' : ''} pending staff
                  verification.
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
            <div className="from-blue-800 to-blue-800/90 rounded-2xl bg-linear-to-br p-5 text-white shadow-xl sm:p-8 lg:col-span-2">
              <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 sm:h-12 sm:w-12 sm:rounded-2xl">
                    <Wallet className="h-5 w-5 text-blue-200 sm:h-6 sm:w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold tracking-widest text-blue-200 uppercase sm:text-xs">
                      Available Balance
                    </p>
                    <div className="flex items-baseline gap-1.5 sm:gap-2">
                      <CurrencyDisplay
                        amount={walletBalance.available}
                        baseCurrency={walletBalance.currency}
                        clickToToggle={true}
                        size="lg"
                        amountClassName="text-white!"
                      />
                    </div>
                    <p className="mt-0.5 text-xs font-bold tracking-widest text-blue-200/60 uppercase sm:text-xs">
                      Ref: {studentId}
                    </p>
                  </div>
                </div>
              </div>
              <div className="border-t border-white/10 pt-5 sm:pt-8">
                <p className="text-xs font-bold tracking-widest text-blue-200/60 uppercase sm:text-xs">
                  Reserved (In Bookings)
                </p>
                <CurrencyDisplay
                  amount={walletBalance.held}
                  baseCurrency={walletBalance.currency}
                  clickToToggle={true}
                  size="md"
                  amountClassName="text-blue-100/90!"
                />
                <p className="mt-1 text-xs text-blue-200/40 sm:text-xs">
                  Held pending booking confirmation. Released if booking is cancelled.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:gap-4">
              <a
                href="/student/wallet?tab=top-up"
                className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 transition-all hover:border-sky-400/30 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600 transition-colors group-hover:bg-green-100 sm:h-12 sm:w-12">
                  <ArrowUpRight className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Add Funds</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Top up via bank transfer
                  </p>
                </div>
              </a>
              <a
                href="/student/wallet?tab=transactions"
                className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 transition-all hover:border-sky-400/30 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100 sm:h-12 sm:w-12">
                  <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">History</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    View past transactions
                  </p>
                </div>
              </a>
            </div>
          </div>

          {/* Active Exam Packages */}
          {activeBundles.length > 0 && (
            <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm sm:p-6 dark:border-indigo-900/40 dark:bg-slate-900">
              <h3 className="mb-4 text-sm font-bold text-slate-900 sm:text-base dark:text-slate-100">
                Active Exam Packages
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activeBundles.map((bundle) => (
                  <div
                    key={bundle.id}
                    className="flex flex-col justify-between rounded-xl border border-indigo-50 bg-indigo-50/30 p-4 transition-colors hover:border-indigo-100 dark:border-slate-800 dark:bg-slate-800/50"
                  >
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-bold tracking-tight text-indigo-900 dark:text-indigo-300">
                          {bundle.bundleType === 'TWO_SEAT' ? 'Twin Pack' : '4-Pack'}
                        </span>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 uppercase">
                          Active
                        </span>
                      </div>
                      <div className="mb-1 text-sm text-slate-600 dark:text-slate-400">
                        Remaining Seats:{' '}
                        <strong className="text-slate-900 dark:text-slate-100">
                          {bundle.totalSeats - bundle.usedSeats}
                        </strong>{' '}
                        / {bundle.totalSeats}
                      </div>
                      <div className="text-xs text-slate-500">
                        Purchased:{' '}
                        {new Date(bundle.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 sm:p-6 dark:border-slate-700 dark:bg-slate-800/50">
            <div className="flex gap-3 sm:gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 sm:h-10 sm:w-10 dark:bg-blue-900/30 dark:text-blue-400">
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-blue-900 sm:text-base dark:text-blue-300">
                  About Training Funds
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-blue-700/80 sm:text-sm dark:text-slate-400">
                  Your wallet holds verified credits for exam bookings and course enrollments.{' '}
                  <strong>All credits are staff-verified</strong> — funds only appear after your
                  bank transfer is reviewed and approved by the finance team.
                </p>
              </div>
            </div>
          </div>

          {/* Payment Milestones for Full-Time Students */}
          {ftEnrollment && ftEnrollment.milestones.length > 0 && isFullTime && (
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 sm:h-10 sm:w-10 dark:bg-indigo-900/30 dark:text-indigo-400">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 sm:text-base dark:text-slate-100">
                    Payment Milestones
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {ftEnrollment.programme.name} — Year {ftEnrollment.currentYearNumber}
                  </p>
                </div>
              </div>

              {/* Progress */}
              {(() => {
                const total = ftEnrollment.milestones.reduce((a, m) => a + Number(m.amountDue), 0)
                const paid = ftEnrollment.milestones
                  .filter((m) => m.status === 'PAID')
                  .reduce((a, m) => a + Number(m.amountDue), 0)
                const pct = total > 0 ? Math.round((paid / total) * 100) : 0
                return (
                  <div className="mb-4 space-y-1">
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{pct}% paid</span>
                      <span>
                        {currencySymbol} {total.toLocaleString()} total
                      </span>
                    </div>
                  </div>
                )
              })()}

              <div className="space-y-2">
                {ftEnrollment.milestones.map((m) => {
                  const LABELS: Record<string, string> = {
                    SEAT_CONFIRMATION: 'Seat Confirmation',
                    SEM1_DUE: 'Before Semester 1',
                    SEM2_DUE: 'Before Semester 2',
                    FULL_YEAR: 'Full Year',
                    FULL_COURSE: 'Full Programme',
                  }
                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-lg border border-slate-50 p-3 dark:border-slate-800"
                    >
                      <div className="flex items-center gap-2.5">
                        {m.status === 'PAID' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : m.status === 'OVERDUE' ? (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-amber-500" />
                        )}
                        <div>
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            {LABELS[m.milestoneType] || m.milestoneType}
                          </span>
                          <span className="ml-2 text-xs text-slate-400">
                            Year {m.yearNumber} — {Number(m.percentOfYearFee)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                            m.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : m.status === 'OVERDUE'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}
                        >
                          {m.status}
                        </span>

                        {(m.status === 'DUE' || m.status === 'OVERDUE') &&
                          walletBalance.available >= Number(m.amountDue) && (
                            <PayMilestoneButton
                              milestoneId={m.id}
                              amount={Number(m.amountDue)}
                              currency={walletBalance.currency}
                              label={LABELS[m.milestoneType] || m.milestoneType}
                            />
                          )}

                        <CurrencyDisplay
                          amount={Number(m.amountDue)}
                          baseCurrency={walletBalance.currency}
                          clickToToggle={true}
                          size="sm"
                          amountClassName="text-emerald-600 dark:text-emerald-400"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Payments Tab ── */}
      {tab === 'payments' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Payment Milestones</h2>
                <p className="text-sm text-slate-500">Track and pay your programme fees.</p>
              </div>
            </div>

            {!ftEnrollment || !isFullTime ? (
              <div className="space-y-6 rounded-2xl border border-slate-100 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
                {isExamOnly ? (
                  <div className="mx-auto max-w-md">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
                      <Target className="h-8 w-8 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Exam-Only Pathway</h3>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      You are enrolled in the Exam-Only pathway. You do not have scheduled tuition milestones.
                      Payments are made per exam booking or bundle. Use the "Top Up" tab to add funds to your wallet.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                      <Link
                        href="/student/exams?tab=records"
                        className="rounded-xl bg-blue-800 px-6 py-2.5 text-xs font-bold tracking-widest text-white uppercase transition-all hover:bg-[#003875]"
                      >
                        Browse Exams
                      </Link>
                    </div>
                  </div>
                ) : pendingTuition.length > 0 ? (
                  <div className="mx-auto max-w-md">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
                      <Clock className="h-8 w-8 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Enrollment Under Review</h3>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      We have received your tuition payment proof. Our admissions team is currently verifying it.
                      Once approved, your enrollment milestones will appear here.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                      <Link
                        href="/student/messages?subject=Question regarding enrollment approval"
                        className="rounded-xl bg-blue-800 px-6 py-2.5 text-xs font-bold tracking-widest text-white uppercase transition-all hover:bg-[#003875]"
                      >
                        Message Admin
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto max-w-md">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/20">
                      <AlertTriangle className="h-8 w-8 text-amber-500" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Enrollment Not Found</h3>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      Your full-time enrollment record has not been created yet. This usually means
                      your programme activation is still being configured by the academy team.
                    </p>
                    <div className="mt-8 grid gap-3 sm:grid-cols-2">
                      <Link
                        href="/student"
                        className="flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-all hover:border-blue-200 hover:bg-blue-50/50 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-blue-900/30"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                          <PlusCircle className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="text-center">
                          <span className="block text-xs font-black tracking-widest text-slate-900 uppercase dark:text-white">Return to Portal</span>
                          <span className="text-[10px] text-slate-500">Check your student dashboard</span>
                        </div>
                      </Link>
                      
                      <Link
                        href="/student/messages?subject=Report Enrollment Issue"
                        className="flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-all hover:border-amber-200 hover:bg-amber-50/50 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-amber-900/30"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                          <Info className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="text-center">
                          <span className="block text-xs font-black tracking-widest text-slate-900 uppercase dark:text-white">Report to Admin</span>
                          <span className="text-[10px] text-slate-500">Get technical help</span>
                        </div>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {ftEnrollment.milestones.map((m) => {
                  const LABELS: Record<string, string> = {
                    SEAT_CONFIRMATION: 'Seat Confirmation (40%)',
                    SEM1_DUE: 'Semester 1 Payment (30%)',
                    SEM2_DUE: 'Semester 2 Payment (30%)',
                    FULL_YEAR: 'Full Year Payment',
                  }
                  const isPaid = m.status === 'PAID'
                  const isOverdue = m.status === 'OVERDUE'
                  const canPay = (m.status === 'DUE' || m.status === 'OVERDUE') && walletBalance.available >= Number(m.amountDue)

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col gap-4 rounded-2xl border p-5 transition-all md:flex-row md:items-center md:justify-between ${
                        isPaid
                          ? 'border-emerald-100 bg-emerald-50/30 dark:border-emerald-900/20 dark:bg-emerald-900/10'
                          : isOverdue
                          ? 'border-red-100 bg-red-50/30 dark:border-red-900/20 dark:bg-red-900/10'
                          : 'border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          isPaid ? 'bg-emerald-100 text-emerald-600' : 
                          isOverdue ? 'bg-red-100 text-red-600' : 
                          'bg-slate-100 text-slate-400'
                        }`}>
                          {isPaid ? <CheckCircle2 className="h-5 w-5" /> : 
                           isOverdue ? <AlertTriangle className="h-5 w-5" /> : 
                           <Clock className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">
                            {LABELS[m.milestoneType] || m.milestoneType}
                          </p>
                          <p className="text-xs text-slate-500">
                            Year {m.yearNumber} • Due {new Date(m.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-6 md:justify-end">
                        <div className="text-right">
                          <p className="text-lg font-black text-slate-900 dark:text-slate-100">
                            {currencySymbol}{Number(m.amountDue).toLocaleString()}
                          </p>
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${
                            isPaid ? 'text-emerald-600' : isOverdue ? 'text-red-600' : 'text-amber-600'
                          }`}>
                            {m.status}
                          </p>
                        </div>

                        {canPay ? (
                          <PayMilestoneButton
                            milestoneId={m.id}
                            amount={Number(m.amountDue)}
                            currency={walletBalance.currency}
                            label={LABELS[m.milestoneType] || m.milestoneType}
                          />
                        ) : !isPaid && (
                          <Link
                            href={`/student/wallet?tab=top-up&action=${
                              m.milestoneType === 'SEAT_CONFIRMATION' ? 'seat' : 
                              m.milestoneType === 'SEM1_DUE' ? 'sem1' : 'sem2'
                            }`}
                            className="rounded-xl bg-blue-800 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-800"
                          >
                            Top Up to Pay
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Top Up Tab ── */}
      {tab === 'top-up' && (
        <div className="mx-auto max-w-7xl space-y-6">
          {actionParam && requiredAmount > 0 && walletBalance.available < requiredAmount && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800/50 dark:bg-blue-900/20">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <Info className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-900 dark:text-blue-200">Payment Requirement</h3>
                  <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                    To complete your <strong>{actionLabel}</strong>, you need a total of{' '}
                    <strong className="text-lg font-black">{currencySymbol}{requiredAmount.toLocaleString()}</strong> in your available balance.
                  </p>
                  <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                    You currently have {currencySymbol}{walletBalance.available.toLocaleString()} available. 
                    Please transfer at least <strong>{currencySymbol}{(requiredAmount - walletBalance.available).toLocaleString()}</strong> more.
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-800 text-white">
                <span className="font-bold">1</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Transfer Funds
              </h2>
            </div>
            <div className="space-y-4">
              <PaymentMethodsDisplay
                methods={activePaymentMethods}
                reference={studentId}
                referenceLabel="Student ID"
              />
              <div className="rounded-xl border border-slate-100 p-4 transition-colors hover:border-slate-200 dark:border-slate-800">
                <div className="flex gap-3 text-slate-500 dark:text-slate-400">
                  <Info className="h-5 w-5 shrink-0" />
                  <p className="text-xs leading-relaxed font-medium">
                    Please use your <strong>Student ID</strong> as the payment reference to ensure
                    your funds are credited correctly.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400 text-white">
                <span className="font-bold">2</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Upload Receipt
              </h2>
            </div>
            <UploadProofForm studentId={studentId} />
          </div>
        </div>
      )}

      {/* ── Transactions Tab ── */}
      {tab === 'transactions' && (
        <div className="space-y-6">
          {allTransactions.length > 0 ? (
            <StudentWalletTransactionsTable transactions={allTransactions} />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-16 text-center dark:border-slate-800 dark:bg-slate-900">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-300 dark:bg-slate-800">
                <History className="h-10 w-10" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                No Transactions Yet
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500 dark:text-slate-400">
                Your payment history will appear here once you start using your wallet.
              </p>
            </div>
          )}
        </div>
      )}
    </WalletTabs>
  )
}
