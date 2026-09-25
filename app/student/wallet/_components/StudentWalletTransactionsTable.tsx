'use client'

import { format } from 'date-fns'
import { ArrowUpRight, ArrowDownRight, Clock, Inbox } from 'lucide-react'
import { useSort, SortHeader } from '@/lib/hooks/useSort'
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay'
import { EmptyState } from '@/components/shared/EmptyState'

interface Transaction {
  id: string
  createdAt: Date
  type: string
  amount: number
  description: string
  status: string
  currency: string
  paymentCurrency?: string
  originalAmount?: number
  isPending: boolean
}

interface StudentWalletTransactionsTableProps {
  transactions: Transaction[]
}

const isCredit = (type: string) => ['TOP_UP', 'RELEASE', 'REFUND', 'ADJUSTMENT'].includes(type)

export default function StudentWalletTransactionsTable({
  transactions,
}: StudentWalletTransactionsTableProps) {
  const { items, requestSort, sortConfig } = useSort(transactions, {
    key: 'createdAt',
    order: 'desc',
  })

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full min-w-140 text-left" aria-label="Wallet transactions">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/50">
            <SortHeader
              label="Date"
              sortKey="createdAt"
              currentSort={sortConfig}
              onSort={requestSort}
              align="right"
              className="text-xs font-bold tracking-widest text-slate-400 uppercase"
            />
            <SortHeader
              label="Description"
              sortKey="description"
              currentSort={sortConfig}
              onSort={requestSort}
              className="text-xs font-bold tracking-widest text-slate-400 uppercase"
            />
            <SortHeader
              label="Status"
              sortKey="status"
              currentSort={sortConfig}
              onSort={requestSort}
              align="center"
              className="text-xs font-bold tracking-widest text-slate-400 uppercase"
            />
            <SortHeader
              label="Amount"
              sortKey="amount"
              currentSort={sortConfig}
              onSort={requestSort}
              align="right"
              className="text-xs font-bold tracking-widest text-slate-400 uppercase"
            />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
          {items.length === 0 ? (
            <tr>
              <td colSpan={4} className="p-0">
                <EmptyState
                  icon={Inbox}
                  title="No transactions yet"
                  description="Your wallet transactions will appear here once you make a payment or receive a credit."
                />
              </td>
            </tr>
          ) : (
            items.map((tx) => {
              const credit = isCredit(tx.type)
              const Icon = tx.isPending ? Clock : credit ? ArrowUpRight : ArrowDownRight
              const amountClassName = tx.isPending
                ? 'text-slate-400!'
                : credit
                  ? 'text-emerald-600!'
                  : 'text-slate-900! dark:text-slate-100!'
              return (
                <tr
                  key={tx.id}
                  className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {format(new Date(tx.createdAt), 'MMM d, yyyy')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          tx.isPending
                            ? 'bg-amber-50 text-amber-600'
                            : credit
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-slate-50 text-slate-600'
                        } dark:bg-slate-800`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {tx.description}
                        </p>
                        <p className="text-xs text-slate-400 uppercase">
                          {tx.type.replaceAll('_', ' ')}
                          {tx.paymentCurrency && tx.paymentCurrency !== 'EUR' && (
                            <span className="ml-1">
                              ({tx.paymentCurrency}{' '}
                              {Number(tx.originalAmount || tx.amount).toFixed(2)})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold tracking-wide uppercase ${
                        tx.isPending
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {tx.isPending ? 'Pending' : 'Completed'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <CurrencyDisplay
                      amount={Number(tx.amount)}
                      baseCurrency={tx.currency}
                      clickToToggle={true}
                      size="sm"
                      amountClassName={amountClassName}
                    />
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
