import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Wallet, PlusCircle, History, ArrowUpRight, ArrowDownRight, CreditCard } from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'

export const metadata: Metadata = { title: 'Wallet | Student Portal' }

export default async function WalletPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const user = session.user

  const [wallet, studentProfile] = await Promise.all([
    prisma.wallet.findUnique({
      where: { userId: user.id },
    }),
    prisma.studentProfile.findUnique({
      where: { userId: user.id },
    }),
  ])

  const studentId = studentProfile?.studentId || 'N/A'

  const walletBalance = {
    available: Number(wallet?.availableBalance || 0),
    held: Number(wallet?.reservedBalance || 0),
    total: Number(wallet?.balance || 0),
    currency: wallet?.currency || 'EUR',
  }

  const currencySymbol = walletBalance.currency === 'GHS' ? 'GH₵' : '€'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">My Wallet</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage your training funds and track your transactions.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Balance Card */}
        <div className="rounded-2xl bg-gradient-to-br from-[#002a5c] to-[#003a7c] p-8 text-white shadow-xl lg:col-span-2">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white dark:bg-slate-900/10">
                <Wallet className="h-6 w-6 text-blue-200" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-200">
                  Total Balance
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black">
                    {currencySymbol}
                    {walletBalance.available.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                  <span className="text-sm font-bold text-blue-200/60">
                    {walletBalance.currency}
                  </span>
                </div>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-blue-200/60">
                  Ref: {studentId}
                </p>
              </div>
            </div>
            <Link
              href="/student/wallet/top-up"
              className="flex h-12 items-center gap-2 rounded-xl bg-white dark:bg-slate-900 px-6 text-sm font-bold text-[#002a5c] transition-transform hover:scale-105 active:scale-95"
            >
              <PlusCircle className="h-4 w-4" />
              Top Up
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200/60">
                On Hold
              </p>
              <p className="text-xl font-black">
                {currencySymbol}
                {walletBalance.held.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200/60">
                Total Credits
              </p>
              <p className="text-xl font-black">
                {currencySymbol}
                {walletBalance.total.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="flex flex-col gap-4">
          <Link
            href="/student/wallet/top-up"
            className="group flex flex-1 items-center justify-between rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 transition-all hover:border-[#4c9ded]/30 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600 transition-colors group-hover:bg-green-100">
                <ArrowUpRight className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">Add Funds</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Top up via bank or MOMO</p>
              </div>
            </div>
            <ArrowUpRight className="h-5 w-5 text-slate-300 group-hover:text-[#4c9ded]" />
          </Link>

          <Link
            href="/student/wallet/transactions"
            className="group flex flex-1 items-center justify-between rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 transition-all hover:border-[#4c9ded]/30 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                <History className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">History</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">View past transactions</p>
              </div>
            </div>
            <ArrowUpRight className="h-5 w-5 text-slate-300 group-hover:text-[#4c9ded]" />
          </Link>
        </div>
      </div>

      {/* Info Section */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6">
        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-blue-900">About Training Funds</h3>
            <p className="mt-1 text-sm leading-relaxed text-blue-700/80">
              Your wallet holds credits used for course enrollments and exam bookings. "On Hold"
              funds represent pending payments or reserved amounts for upcoming events. For any
              payment issues, please contact the academy finance office.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
