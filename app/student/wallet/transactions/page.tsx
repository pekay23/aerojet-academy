import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Search, Filter } from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'

export const metadata: Metadata = { title: 'Transactions | Student Portal' }

export default async function TransactionsPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const user = session.user

  const [walletTransactions, pendingPayments] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: {
        wallet: { userId: user.id },
      },
      include: {
        wallet: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.payment.findMany({
      where: {
        userId: user.id,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // Normalize data for display
  const allTransactions = [
    ...pendingPayments.map((p) => ({
      id: p.id,
      createdAt: p.createdAt,
      type: 'PAYMENT', // Or TOP_UP depending on logic, but payment is generic
      amount: p.amount,
      description: `Pending Payment (${p.paymentMethod})`,
      status: p.status, // PENDING
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

  // Helper to determine if a transaction is a credit or debit
  const isCredit = (type: string) => ['TOP_UP', 'RELEASE', 'REFUND', 'ADJUSTMENT'].includes(type)

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/student/wallet"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:text-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Wallet
        </Link>
        <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Transaction History
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          A complete record of all your wallet activities.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-50 px-6 py-4">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              className="w-full rounded-xl border-none bg-slate-50 dark:bg-slate-800/50 py-2 pl-10 pr-4 text-sm transition-all focus:ring-2 focus:ring-[#4c9ded]/20"
            />
          </div>
          <button className="flex items-center gap-2 rounded-xl border border-slate-100 dark:border-slate-800 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800/50">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Date
                </th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Description
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {allTransactions.length > 0 ? (
                allTransactions.map((tx) => (
                  <tr key={tx.id} className="transition-colors hover:bg-slate-50 dark:bg-slate-800/50/30">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {tx.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{tx.description}</p>
                      <p className="text-[10px] font-medium uppercase tracking-tight text-slate-400">
                        {tx.type.replace('_', ' ')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {tx.isPending ? (
                        <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                          Completed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div
                        className={`flex items-center justify-end gap-1 font-black ${
                          tx.isPending
                            ? 'text-slate-400'
                            : isCredit(tx.type)
                              ? 'text-green-600'
                              : 'text-slate-900'
                        }`}
                      >
                        {!tx.isPending && (isCredit(tx.type) ? '+' : '-')}
                        {tx.currency}{' '}
                        {Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
    </div>
  )
}

