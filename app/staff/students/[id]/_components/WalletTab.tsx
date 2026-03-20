'use client'

import { useState } from 'react'
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  ChevronDown,
  FileText,
  Upload,
  User,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay'
import ManualWalletAdjustmentDialog from '@/app/staff/users/[id]/_components/ManualWalletAdjustmentDialog'
import { UploadButton } from '@/lib/uploads/uploadthing'

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

const TYPE_COLOR: Record<string, string> = {
  TOP_UP: 'bg-emerald-100 text-emerald-700',
  CREDIT: 'bg-emerald-100 text-emerald-700',
  REFUND: 'bg-emerald-100 text-emerald-700',
  RELEASE: 'bg-emerald-100 text-emerald-700',
  DEBIT: 'bg-red-100 text-red-700',
  CAPTURE: 'bg-red-100 text-red-700',
  PAYMENT: 'bg-red-100 text-red-700',
}

const POSITIVE_TYPES = ['TOP_UP', 'CREDIT', 'REFUND', 'RELEASE']

interface Props {
  student: any
  onRefresh: () => void
}

export default function WalletTab({ student, onRefresh }: Props) {
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')
  const [viewCurrency, setViewCurrency] = useState('EUR')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const wallet = student.wallet
  const transactions = student.walletTransactions || wallet?.transactions || []

  const filteredTransactions = transactions.filter((t: any) => {
    if (typeFilter && t.type !== typeFilter) return false
    if (search) {
      const q = search.toLowerCase()
      const matchesDescription = t.description?.toLowerCase().includes(q)
      const matchesRef = t.referenceType?.toLowerCase().includes(q)
      const matchesStaff = t.staffName?.toLowerCase().includes(q)
      if (!matchesDescription && !matchesRef && !matchesStaff) return false
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

  const currencySymbol = wallet?.currency === 'GHS' ? 'GH₵' : wallet?.currency === 'USD' ? '$' : '€'

  const formatAmount = (amount: number, type: string) => {
    const isNegative = ['DEBIT', 'CAPTURE', 'PAYMENT', 'REFUND'].includes(type)
    const display = Number(amount).toFixed(2)
    return isNegative ? `-${currencySymbol}${display}` : `+${currencySymbol}${display}`
  }

  const handleProofUploaded = async (txnId: string, proofUrl: string) => {
    try {
      const res = await fetch(`/api/staff/students/${student.id}/wallet/${txnId}/proof`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proofUrl }),
      })
      if (!res.ok) throw new Error('Failed to attach proof')
      toast.success('Proof attached to transaction')
      onRefresh()
    } catch {
      toast.error('Failed to attach proof')
    }
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
            {currencySymbol}
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
            {currencySymbol}
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
            {currencySymbol}
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
            {currencySymbol}
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
                <th className="px-4 py-3 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  By
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Amount
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Balance
                </th>
                <th className="w-8 px-2 py-3 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Proof
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredTransactions.map((txn: any) => {
                const isExpanded = expandedId === txn.id
                const isPositive = POSITIVE_TYPES.includes(txn.type)
                const typeColor = TYPE_COLOR[txn.type] || 'bg-slate-100 text-slate-500'
                const isStaffAction = !!txn.createdBy

                return (
                  <TransactionRow
                    key={txn.id}
                    txn={txn}
                    isExpanded={isExpanded}
                    isPositive={isPositive}
                    typeColor={typeColor}
                    isStaffAction={isStaffAction}
                    currencySymbol={currencySymbol}
                    formatDate={formatDate}
                    formatAmount={formatAmount}
                    onToggle={() => setExpandedId(isExpanded ? null : txn.id)}
                    onProofUploaded={handleProofUploaded}
                    studentId={student.id}
                  />
                )
              })}
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

function TransactionRow({
  txn,
  isExpanded,
  isPositive,
  typeColor,
  isStaffAction,
  currencySymbol,
  formatDate,
  formatAmount,
  onToggle,
  onProofUploaded,
  studentId,
}: {
  txn: any
  isExpanded: boolean
  isPositive: boolean
  typeColor: string
  isStaffAction: boolean
  currencySymbol: string
  formatDate: (d: string | Date) => string
  formatAmount: (a: number, t: string) => string
  onToggle: () => void
  onProofUploaded: (txnId: string, proofUrl: string) => void
  studentId: string
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className={`cursor-pointer transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${
          isExpanded ? 'bg-slate-50/80 dark:bg-slate-800/40' : ''
        }`}
      >
        <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-500">
          {formatDate(txn.createdAt)}
        </td>
        <td className="px-4 py-3">
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${typeColor}`}>
            {txn.type}
          </span>
        </td>
        <td className="max-w-[200px] truncate px-4 py-3 text-xs text-slate-500">
          <div>{txn.description || '—'}</div>
          {txn.referenceType && (
            <div className="text-[10px] text-slate-400">
              Ref: {txn.referenceType}
              {txn.referenceId && ` (${txn.referenceId.slice(0, 8)}...)`}
            </div>
          )}
        </td>
        <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-400">
          {txn.staffName ? (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {txn.staffName}
            </span>
          ) : (
            <span className="text-slate-300">System</span>
          )}
        </td>
        <td className="px-4 py-3 text-right whitespace-nowrap">
          <div
            className={`flex items-center justify-end gap-1 font-mono text-xs font-black ${
              isPositive ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {formatAmount(Number(txn.amount), txn.type)}
          </div>
        </td>
        <td className="px-4 py-3 text-right whitespace-nowrap">
          <span className="font-mono text-xs font-black text-slate-600">
            {currencySymbol}{Number(txn.balanceAfter ?? 0).toFixed(2)}
          </span>
        </td>
        <td className="px-2 py-3 text-center">
          {txn.proofUrl ? (
            <a
              href={txn.proofUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              title="View proof"
            >
              <FileText className="h-3.5 w-3.5" />
            </a>
          ) : isStaffAction ? (
            <span className="inline-flex h-6 w-6 items-center justify-center text-slate-300" title="No proof — click row to upload">
              <Upload className="h-3 w-3" />
            </span>
          ) : (
            <span className="text-slate-200">—</span>
          )}
        </td>
      </tr>

      {/* Expandable Detail Row */}
      {isExpanded && (
        <tr>
          <td colSpan={7} className="border-l-2 border-l-[#002a5c] bg-slate-50/60 px-6 py-4 dark:bg-slate-800/20">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Left: Transaction Chain */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Transaction Audit Chain
                </h4>

                {txn.staffName && (
                  <div className="flex items-center gap-2 text-xs">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-bold text-slate-600 dark:text-slate-300">{txn.staffName}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-400">{formatDate(txn.createdAt)}</span>
                  </div>
                )}

                {/* Balance Snapshot */}
                <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                  <p className="mb-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    Balance Snapshot
                  </p>
                  <div className="space-y-1.5 font-mono text-xs">
                    <SnapshotRow
                      label="Balance"
                      before={txn.balanceBefore}
                      after={txn.balanceAfter}
                      symbol={currencySymbol}
                    />
                    <SnapshotRow
                      label="Reserved"
                      before={txn.reservedBefore}
                      after={txn.reservedAfter}
                      symbol={currencySymbol}
                    />
                    <SnapshotRow
                      label="Available"
                      before={txn.availableBefore}
                      after={txn.availableAfter}
                      symbol={currencySymbol}
                    />
                  </div>
                </div>

                {/* Reference */}
                {txn.referenceType && (
                  <div className="text-xs">
                    <span className="font-bold text-slate-500">Reference:</span>{' '}
                    <span className="font-mono text-slate-400">
                      {txn.referenceType}
                      {txn.referenceId && ` · ${txn.referenceId}`}
                    </span>
                  </div>
                )}

                {/* Metadata */}
                {txn.metadata && Object.keys(txn.metadata).length > 0 && (
                  <div className="text-xs">
                    <span className="font-bold text-slate-500">Metadata:</span>{' '}
                    <span className="font-mono text-slate-400">
                      {JSON.stringify(txn.metadata)}
                    </span>
                  </div>
                )}
              </div>

              {/* Right: Proof & Actions */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Payment Proof
                </h4>

                {txn.proofUrl ? (
                  <div className="space-y-2">
                    {txn.proofUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <a href={txn.proofUrl} target="_blank" rel="noopener noreferrer">
                        <img
                          src={txn.proofUrl}
                          alt="Payment proof"
                          className="max-h-40 rounded-lg border border-slate-200 object-contain"
                        />
                      </a>
                    ) : (
                      <a
                        href={txn.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                      >
                        <FileText className="h-4 w-4" />
                        View Proof Document
                      </a>
                    )}
                  </div>
                ) : isStaffAction ? (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400">
                      No proof attached. Upload a receipt or bank statement.
                    </p>
                    <UploadButton
                      endpoint="paymentProof"
                      onClientUploadComplete={(res) => {
                        const url = res[0]?.ufsUrl || res[0]?.url
                        if (url) onProofUploaded(txn.id, url)
                      }}
                      onUploadError={(err) => { toast.error(err.message || 'Upload failed') }}
                      appearance={{
                        button: 'ut-ready:bg-slate-100 ut-ready:text-slate-600 ut-ready:border ut-ready:border-slate-200 ut-ready:rounded-lg ut-ready:text-xs ut-ready:font-bold ut-uploading:bg-slate-50 ut-uploading:text-slate-400',
                        allowedContent: 'text-[10px] text-slate-400',
                      }}
                    />
                  </div>
                ) : (
                  <p className="text-xs text-slate-300 italic">
                    System-generated transaction — no proof required.
                  </p>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function SnapshotRow({
  label,
  before,
  after,
  symbol,
}: {
  label: string
  before: number | null
  after: number | null
  symbol: string
}) {
  const b = Number(before ?? 0)
  const a = Number(after ?? 0)
  const changed = Math.abs(a - b) >= 0.01

  return (
    <div className={`flex items-center gap-2 ${changed ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}`}>
      <span className="w-16 text-[10px] font-bold text-slate-400 uppercase">{label}</span>
      <span>{symbol}{b.toFixed(2)}</span>
      <ArrowRight className="h-3 w-3 text-slate-300" />
      <span className={changed ? 'font-bold' : ''}>{symbol}{a.toFixed(2)}</span>
      {changed && (
        <span className={`text-[10px] ${a > b ? 'text-emerald-500' : 'text-red-500'}`}>
          ({a > b ? '+' : ''}{(a - b).toFixed(2)})
        </span>
      )}
    </div>
  )
}
