import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Wallet, PlusCircle, History, ArrowUpRight, CreditCard, Clock } from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'

export const metadata: Metadata = { title: 'Wallet | Student Portal' }

export default async function WalletPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const user = session.user

  const [wallet, studentProfile, pendingTopups] = await Promise.all([
    prisma.wallet.findUnique({
      where: { userId: user.id },
    }),
    prisma.studentProfile.findUnique({
      where: { userId: user.id },
    }),
    prisma.payment.findMany({
      where: {
        userId: user.id,
        referenceType: 'WALLET_TOPUP',
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
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

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl lg:text-3xl dark:text-slate-100">
          My Wallet
        </h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
          Manage your training funds and track your transactions.
        </p>
      </div>

      {/* Pending Approval Notice */}
      {hasPendingTopups && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
              Top-up Awaiting Approval
            </p>
            <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
              {pendingTopups.length} payment{pendingTopups.length > 1 ? 's' : ''} pending staff
              verification. Your balance will update once approved.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Main Balance Card */}
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
            <Link
              href="/student/wallet/top-up"
              className="text-aerojet-blue dark:text-aerojet-sky flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-white px-5 text-xs font-bold transition-transform hover:scale-105 active:scale-95 sm:h-12 sm:w-auto sm:text-sm dark:bg-slate-900"
            >
              <PlusCircle className="h-4 w-4" />
              Top Up
            </Link>
          </div>

          {/* Reserved Funds */}
          <div className="border-t border-white/10 pt-5 sm:pt-8">
            <div>
              <p className="text-[9px] font-bold tracking-widest text-blue-200/60 uppercase sm:text-[10px]">
                Reserved (In Pools)
              </p>
              <p className="text-lg font-black sm:text-xl">
                {currencySymbol}
                {walletBalance.held.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
              <p className="mt-1 text-[9px] text-blue-200/40 sm:text-[10px]">
                Held pending pool confirmation. Released if pool is cancelled.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:flex lg:flex-col">
          <Link
            href="/student/wallet/top-up"
            className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 text-center transition-all hover:border-[#4c9ded]/30 hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-6 sm:text-left dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600 transition-colors group-hover:bg-green-100 sm:h-12 sm:w-12">
                <ArrowUpRight className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Add Funds</p>
                <p className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">
                  Top up via bank transfer
                </p>
              </div>
            </div>
            <ArrowUpRight className="hidden h-5 w-5 text-slate-300 group-hover:text-[#4c9ded] sm:block" />
          </Link>

          <Link
            href="/student/wallet/transactions"
            className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 text-center transition-all hover:border-[#4c9ded]/30 hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-6 sm:text-left dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100 sm:h-12 sm:w-12">
                <History className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">History</p>
                <p className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">
                  View past transactions
                </p>
              </div>
            </div>
            <ArrowUpRight className="hidden h-5 w-5 text-slate-300 group-hover:text-[#4c9ded] sm:block" />
          </Link>
        </div>
      </div>

      {/* Info Section */}
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
              <strong>All credits are staff-verified</strong> — funds only appear after your bank
              transfer is reviewed and approved by the finance team. &ldquo;Reserved&rdquo; funds
              are held for pending pool seats and released automatically if a pool is cancelled.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
