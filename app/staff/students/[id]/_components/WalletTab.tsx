'use client'

import { useState } from 'react'
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownRight, Search, Filter } from 'lucide-react'
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay'
import ManualWalletAdjustmentDialog from '@/app/staff/users/[id]/_components/ManualWalletAdjustmentDialog'

const TRANSACTION_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'TOP_UP', label: 'Top Up' },
  { value: 'RESERVE', label: 'Reserve' },
  { value: 'CAPTURE', label: 'Capture' },
  { value: 'RELEASE', label: 'Release' },
  { value: 'CREDIT', label: 'Credit' },
  { value: 'DEBIT', label: 'Debit' },
  { value: 'REFUND', label: 'Refund' },
  { value: 'PAYMENT', label: 'Payment' },
  { value: 'ADJUSTMENT', label: 'Adjustment' },
]

interface Props {
  student: any
  onRefresh: () => void
}

export default function WalletTab({ student, onRefresh }: Props) {
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')
  const [viewCurrency, setViewCurrency] = useState('EUR')

  const wallet = student.wallet
  // Use walletTransactions from the student object (passed from server)
  const transactions = student.walletTransactions || wallet?.transactions || []

  const filteredTransactions = transactions.filter((t: any) => {
    if (typeFilter && t.type !== typeFilter) return false
    if (search) {
      const q = search.toLowerCase()
      const matchesDescription = t.description?.toLowerCase().includes(q)
      const matchesRef = t.referenceType?.toLowerCase().includes(q)
      if (!matchesDescription && !matchesRef) return false
    }
    return true
  })

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatAmount = (amount: number, type: string) => {
    const isNegative = ['DEBIT', 'CAPTURE', 'PAYMENT', 'REFUND'].includes(type)
    const display = Number(amount).toFixed(2)
    return isNegative ? `-€${display}` : `+€${display}`
  }

  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Available Balance */}
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900/30 dark:bg-emerald-900/10">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-black tracking-widest text-emerald-600 uppercase">
              Available Balance
            </p>
            <ManualWalletAdjustmentDialog
              userId={student.id}
              userName={
                student.profile
                  ? `${student.profile.firstName} ${student.profile.lastName}`
                  : student.email
              }
              currentBalance={Number(wallet?.availableBalance ?? 0)}
              currency={wallet?.currency || 'EUR'}
              onSuccess={() => {
                onRefresh()
              }}
            />
          </div>
          <CurrencyDisplay
            amount={Number(wallet?.availableBalance ?? 0)}
            baseCurrency={wallet?.currency || 'EUR'}
            currency={viewCurrency}
            clickToToggle={true}
            onCurrencyChange={setViewCurrency}
            size="lg"
            amountClassName="text-emerald-700!"
          />
        </div>

        {/* Reserved Balance */}
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-900/10">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-black tracking-widest text-amber-600 uppercase">
              Reserved / Held
            </p>
          </div>
          <CurrencyDisplay
            amount={Number(wallet?.reservedBalance ?? 0)}
            baseCurrency={wallet?.currency || 'EUR'}
            currency={viewCurrency}
            showToggle={false}
            size="lg"
            amountClassName="text-amber-700!"
          />
        </div>

        {/* Total Balance */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Total Balance
            </p>
          </div>
          <CurrencyDisplay
            amount={Number(wallet?.balance ?? 0)}
            baseCurrency={wallet?.currency || 'EUR'}
            currency={viewCurrency}
            showToggle={false}
            size="lg"
            amountClassName="text-slate-700!"
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Total Top-ups
          </p>
          <p className="text-lg font-black text-emerald-600">
            €
            {transactions
              .filter((t: any) => t.type === 'TOP_UP')
              .reduce((sum: number, t: any) => sum + Number(t.amount), 0)
              .toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Total Debits
          </p>
          <p className="text-lg font-black text-red-600">
            €
            {transactions
              .filter((t: any) => t.type === 'DEBIT')
              .reduce((sum: number, t: any) => sum + Number(t.amount), 0)
              .toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Captures
          </p>
          <p className="text-lg font-black text-orange-600">
            €
            {transactions
              .filter((t: any) => t.type === 'CAPTURE')
              .reduce((sum: number, t: any) => sum + Number(t.amount), 0)
              .toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Adjustments
          </p>
          <p className="text-lg font-black text-blue-600">
            €
            {transactions
              .filter((t: any) => t.type === 'ADJUSTMENT')
              .reduce((sum: number, t: any) => sum + Number(t.amount), 0)
              .toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs min-w-[200px] flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-4 pl-9 text-sm outline-none focus:ring-2 focus:ring-[#4c9ded] dark:border-slate-700 dark:bg-slate-800/50"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        >
          {TRANSACTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Transactions Table */}
      {filteredTransactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <WalletIcon className="mb-2 h-10 w-10 text-slate-200" />
          <p className="text-sm font-bold text-slate-400">
            {transactions.length === 0 ? 'No wallet transactions yet' : 'No matching transactions'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/50">
                <th className="px-4 py-3 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Description
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Amount
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Balance After
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredTransactions.map((txn: any) => (
                <tr
                  key={txn.id}
                  className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                >
                  <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-500">
                    {formatDate(txn.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                        txn.type === 'TOP_UP' ||
                        txn.type === 'CREDIT' ||
                        txn.type === 'REFUND' ||
                        txn.type === 'RELEASE'
                          ? 'bg-emerald-100 text-emerald-700'
                          : txn.type === 'DEBIT' || txn.type === 'CAPTURE' || txn.type === 'PAYMENT'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {txn.type}
                    </span>
                  </td>
                  <td className="max-w-[250px] truncate px-4 py-3 text-xs text-slate-500">
                    <div>{txn.description || '—'}</div>
                    {txn.referenceType && (
                      <div className="text-[10px] text-slate-400">
                        Ref: {txn.referenceType}
                        {txn.referenceId && ` (${txn.referenceId.slice(0, 8)}...)`}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div
                      className={`flex items-center justify-end gap-1 font-mono text-xs font-black ${
                        ['TOP_UP', 'CREDIT', 'REFUND', 'RELEASE'].includes(txn.type)
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }`}
                    >
                      {['TOP_UP', 'CREDIT', 'REFUND', 'RELEASE'].includes(txn.type) ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {formatAmount(Number(txn.amount), txn.type)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <span className="font-mono text-xs font-black text-slate-600">
                      €{Number(txn.balanceAfter ?? 0).toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Transaction count */}
      {filteredTransactions.length > 0 && (
        <p className="text-xs text-slate-400">
          Showing {filteredTransactions.length} of {transactions.length} transactions
        </p>
      )}
    </div>
  )
}
