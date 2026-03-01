import { Metadata } from 'next'
import { redirect } from 'next/navigation'
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
} from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import WalletTabs from '../_components/WalletTabs'
import { UploadProofForm } from './top-up/_components/UploadProofForm'

export const metadata: Metadata = { title: 'Wallet | Student Portal' }

export default async function WalletPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab: tabParam } = await searchParams
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const user = session.user
  const tab = tabParam || 'overview'

  const [wallet, studentProfile, pendingTopups, ftEnrollment] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: user.id } }),
    prisma.studentProfile.findUnique({ where: { userId: user.id } }),
    prisma.payment.findMany({
      where: { userId: user.id, referenceType: 'WALLET_TOPUP', status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.fullTimeEnrollment.findFirst({
      where: { studentId: user.id },
      include: {
        programme: true,
        milestones: { orderBy: [{ yearNumber: 'asc' }, { createdAt: 'asc' }] },
      },
    }),
  ])

  const studentId = studentProfile?.studentId || 'N/A'
  const walletBalance = {
    available: Number(wallet?.availableBalance || 0),
    held: Number(wallet?.reservedBalance || 0),
    currency: wallet?.currency || 'EUR',
  }

  const { getCurrencySymbol } = await import('@/lib/currency')
  const currencySymbol = getCurrencySymbol(walletBalance.currency)
  const hasPendingTopups = pendingTopups.length > 0

  // Fetch bank details for top-up tab
  let bankDetails: Record<string, string> = {}
  if (tab === 'top-up') {
    const bankSettings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            'bank_name',
            'bank_account_name',
            'bank_account_number',
            'bank_swift',
            'bank_branch',
            'bank_currency',
          ],
        },
      },
    })
    for (const s of bankSettings || []) {
      bankDetails[s.key] = s.value
    }
  }

  // Fetch transactions for transactions tab
  let allTransactions: any[] = []
  if (tab === 'transactions') {
    const [walletTransactions, pendingPayments] = await Promise.all([
      prisma.walletTransaction.findMany({
        where: { wallet: { userId: user.id } },
        include: { wallet: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.findMany({
        where: { userId: user.id, status: { in: ['PENDING', 'PROCESSING'] } },
        orderBy: { createdAt: 'desc' },
      }),
    ])
    allTransactions = [
      ...pendingPayments.map((p) => ({
        id: p.id,
        createdAt: p.createdAt,
        type: 'PAYMENT',
        amount: p.amount,
        description: `Pending Payment (${p.paymentMethod})`,
        status: p.status,
        currency: p.currency,
        isPending: true,
      })),
      ...walletTransactions.map((tx) => ({
        id: tx.id,
        createdAt: tx.createdAt,
        type: tx.type,
        amount: tx.amount,
        description: tx.description || tx.type.replace('_', ' '),
        status: 'COMPLETED',
        currency: tx.wallet.currency,
        isPending: false,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  const isCredit = (type: string) => ['TOP_UP', 'RELEASE', 'REFUND', 'ADJUSTMENT'].includes(type)

  return (
    <WalletTabs>
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
            <div className="from-aerojet-blue to-aerojet-blue/90 rounded-2xl bg-linear-to-br p-5 text-white shadow-xl sm:p-8 lg:col-span-2">
              <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 sm:h-12 sm:w-12 sm:rounded-2xl">
                    <Wallet className="h-5 w-5 text-blue-200 sm:h-6 sm:w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-widest text-blue-200 uppercase sm:text-xs">
                      Available Balance
                    </p>
                    <div className="flex items-baseline gap-1.5 sm:gap-2">
                      <span className="text-2xl font-black sm:text-4xl">
                        {currencySymbol}
                        {walletBalance.available.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                      <span className="text-xs font-bold text-blue-200/60 sm:text-sm">
                        {walletBalance.currency}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[9px] font-bold tracking-widest text-blue-200/60 uppercase sm:text-[10px]">
                      Ref: {studentId}
                    </p>
                  </div>
                </div>
              </div>
              <div className="border-t border-white/10 pt-5 sm:pt-8">
                <p className="text-[9px] font-bold tracking-widest text-blue-200/60 uppercase sm:text-[10px]">
                  Reserved (In Pools)
                </p>
                <p className="text-lg font-black sm:text-xl">
                  {currencySymbol}
                  {walletBalance.held.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <p className="mt-1 text-[9px] text-blue-200/40 sm:text-[10px]">
                  Held pending pool confirmation. Released if pool is cancelled.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:gap-4">
              <a
                href="/student/wallet?tab=top-up"
                className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 transition-all hover:border-[#4c9ded]/30 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
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
                className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 transition-all hover:border-[#4c9ded]/30 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
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
                  Your wallet holds verified credits for exam pool bookings and course enrollments.{' '}
                  <strong>All credits are staff-verified</strong> — funds only appear after your
                  bank transfer is reviewed and approved by the finance team.
                </p>
              </div>
            </div>
          </div>

          {/* Payment Milestones for Full-Time Students */}
          {ftEnrollment && ftEnrollment.milestones.length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 sm:h-10 sm:w-10 dark:bg-indigo-900/30 dark:text-indigo-400">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 sm:text-base dark:text-slate-100">
                    Payment Milestones
                  </h3>
                  <p className="text-xs text-slate-400">
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
                    <div className="flex justify-between text-xs text-slate-400">
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
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            m.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : m.status === 'OVERDUE'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}
                        >
                          {m.status}
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {currencySymbol} {Number(m.amountDue).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Top Up Tab ── */}
      {tab === 'top-up' && (
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#002a5c] text-white">
                <span className="font-bold">1</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Transfer Funds
              </h2>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-blue-50 bg-blue-50/30 p-6">
                <div className="flex gap-4">
                  <Building2 className="h-6 w-6 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-xs font-bold tracking-widest text-blue-600 uppercase">
                      Bank Transfer Details
                    </p>
                    <div className="mt-4 grid gap-y-3">
                      {[
                        ['Bank Name', bankDetails.bank_name],
                        ['Account Name', bankDetails.bank_account_name],
                        ['Account Number', bankDetails.bank_account_number],
                        ['Branch / Code', bankDetails.bank_branch],
                        ['SWIFT Code', bankDetails.bank_swift],
                        ['Currency', bankDetails.bank_currency || 'GHS'],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="flex justify-between border-b border-blue-100 pb-2"
                        >
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            {label}
                          </span>
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {value || '—'}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-1">
                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                          Reference (Student ID)
                        </span>
                        <span className="text-sm font-black text-[#002a5c]">{studentId}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4c9ded] text-white">
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
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {allTransactions.length > 0 ? (
                  allTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-slate-600 dark:text-slate-400">
                        {tx.createdAt.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {tx.description}
                        </p>
                        <p className="text-[10px] font-medium tracking-tight text-slate-400 uppercase">
                          {tx.type.replace('_', ' ')}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {tx.isPending ? (
                          <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold tracking-wide text-amber-700 uppercase">
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold tracking-wide text-emerald-700 uppercase">
                            Completed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div
                          className={`flex items-center justify-end gap-1 font-black ${tx.isPending ? 'text-slate-400' : isCredit(tx.type) ? 'text-green-600' : 'text-slate-900 dark:text-slate-100'}`}
                        >
                          {!tx.isPending && (isCredit(tx.type) ? '+' : '-')}
                          {tx.currency}{' '}
                          {Number(tx.amount).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-sm font-medium text-slate-400"
                    >
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </WalletTabs>
  )
}
