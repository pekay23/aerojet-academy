'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import TablePagination from './TablePagination'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SortableTh } from '@/components/ui/sortable-th'
import SearchInput from '@/components/SearchInput'
import { SerializedTransactionRow, SerializedTransactionRelated } from '@/lib/types/staff'

interface TransactionsTableProps {
  currencySymbol: string
  initialData: SerializedTransactionRow[]
  initialTotal: number
  initialRelated: SerializedTransactionRelated | undefined
  query?: string
}

export default function TransactionsTable({
  currencySymbol,
  initialData,
  initialTotal,
  initialRelated,
  query: initialQuery,
}: TransactionsTableProps) {
  const [data, setData] = useState<SerializedTransactionRow[]>(initialData)
  const [total, setTotal] = useState(initialTotal)
  const [related, setRelated] = useState(initialRelated)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const sortBy = searchParams.get('sort') ?? 'createdAt'
  const sortDir = (searchParams.get('order') ?? 'desc') as 'asc' | 'desc'

  const symbol = currencySymbol

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: perPage.toString(),
        sortBy,
        sortDir,
        ...(initialQuery ? { query: initialQuery } : {}),
      })
      const res = await fetch(`/api/staff/finance/transactions?${params}`)
      const json = await res.json()
      setData(json.data ?? [])
      setTotal(json.meta?.total ?? 0)
      setRelated(json.related ?? {})
    } finally {
      setLoading(false)
    }
  }, [page, perPage, sortBy, sortDir, initialQuery])

  useEffect(() => {
    const isInitial = page === 1 && perPage === 25 && sortBy === 'createdAt' && sortDir === 'desc'
    if (!isInitial) {
   
   
  // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchData()
    }
  }, [page, perPage, sortBy, sortDir, fetchData])

  // Build lookup maps from related data
  const paymentDataMap = new Map<string, SerializedTransactionRelated['payments'][number]>(
    (related?.payments || []).map((p) => [
      p.id,
      p,
    ])
  )
  const examBookingStatusByReference = new Map<string, SerializedTransactionRelated['examBookings'][number]>(
    (related?.examBookings || []).flatMap((b) => {
      const entries: [string, SerializedTransactionRelated['examBookings'][number]][] = [[b.id, b]]
      if (b.walletTxnId) entries.push([b.walletTxnId, b])
      return entries
    })
  )
  const enrollmentStatusMap = new Map<string, string>(
    (related?.fullTimeEnrollments || []).map((e) => [e.id, e.status])
  )
  const modularStatusByTxn = new Map<string, string>(
    (related?.modularEnrollments || [])
      .filter((e) => e.walletTxnId)
      .map((e) => [e.walletTxnId!, e.status])
  )
  const milestoneStatusByTxn = new Map<string, string>(
    (related?.milestones || [])
      .filter((m) => m.walletTxnId)
      .map((m) => [m.walletTxnId!, `${m.milestoneType.replace(/_/g, ' ')} ${m.status}`])
  )

  const CREDIT_TYPES = ['TOP_UP', 'REFUND', 'RELEASE', 'CREDIT']

  const getTypeColor = (type: string) => {
    if (CREDIT_TYPES.includes(type))
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
    if (['CAPTURE', 'PAYMENT'].includes(type))
      return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
    if (type === 'RESERVE')
      return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
  }

  const getReferenceDisplay = (tx: SerializedTransactionRow) => {
    const typeLabel = tx.referenceType
      ? tx.referenceType.replace(/_/g, ' ')
      : `${tx.type.replace(/_/g, ' ')} Transaction`
    let refId: string
    if (tx.referenceType === 'FULL_TIME_ENROLLMENT' && tx.referenceId) {
      refId = `ENR-${tx.referenceId.slice(-6).toUpperCase()}`
    } else if (tx.referenceType === 'EXAM_BOOKING' && tx.referenceId) {
      const booking =
        examBookingStatusByReference.get(tx.referenceId) || examBookingStatusByReference.get(tx.id)
      refId = booking?.moduleCode
        ? `${booking.moduleCode}`
        : `EXM-${(tx.referenceId || tx.id).slice(-6).toUpperCase()}`
    } else if (tx.referenceType === 'PAYMENT_ID' && tx.referenceId) {
      refId = `PAY-${tx.referenceId.slice(-6).toUpperCase()}`
    } else if (tx.referenceId) {
      refId = `REF-${tx.referenceId.slice(-6).toUpperCase()}`
    } else {
      refId = `TX-${tx.id.slice(-8).toUpperCase()}`
    }
    return { type: typeLabel, id: refId }
  }

  const getStatusStyle = (status: string) => {
    const n = status.toUpperCase()
    if (
      ['PAID', 'APPROVED', 'COMPLETED', 'CONFIRMED', 'RECONCILED', 'POSTED'].some((s) =>
        n.includes(s)
      )
    )
      return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
    if (['PENDING', 'RESERVED', 'DUE', 'POOLED', 'SCHEDULED'].some((s) => n.includes(s)))
      return 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
    if (['FAILED', 'REJECTED', 'CANCELLED', 'EXPIRED'].some((s) => n.includes(s)))
      return 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
    return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
  }

  const getTransactionStatus = (
    tx: SerializedTransactionRow,
    paymentData: SerializedTransactionRelated['payments'][0] | null | undefined
  ) => {
    if (tx.referenceType === 'PAYMENT_ID')
      return paymentData?.reconciled ? 'Reconciled' : paymentData?.status || 'Pending Settlement'
    if (tx.referenceType === 'EXAM_BOOKING') {
      const booking = tx.referenceId
        ? examBookingStatusByReference.get(tx.referenceId) ||
          examBookingStatusByReference.get(tx.id)
        : examBookingStatusByReference.get(tx.id)
      if (booking?.result) return booking.result
      if (booking?.demandStatus && booking.demandStatus !== 'DEMAND_CAPTURED')
        return booking.demandStatus.replace(/_/g, ' ')
      if (booking?.status) return booking.status
    }
    if (tx.referenceType === 'FULL_TIME_ENROLLMENT' && tx.referenceId)
      return enrollmentStatusMap.get(tx.referenceId) || 'Enrollment Posted'
    const ms = modularStatusByTxn.get(tx.id)
    if (ms) return ms
    const mls = milestoneStatusByTxn.get(tx.id)
    if (mls) return mls
    if (tx.referenceType?.includes('WALLET_TOP'))
      return tx.type === 'TOP_UP' ? 'Completed' : 'Pending'
    if (tx.type === 'RESERVE') return 'Reserved'
    if (CREDIT_TYPES.includes(tx.type) || ['CAPTURE', 'PAYMENT'].includes(tx.type))
      return 'Completed'
    if (tx.type === 'ADJUSTMENT') return 'Posted'
    return tx.type.replace(/_/g, ' ')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <div className="w-72">
          <SearchInput id="finance-transactions-search" placeholder="Search user or reference..." />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-900">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
            <TableRow>
              <TableHead className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                User
              </TableHead>
              <SortableTh sortKey="type" label="Type" />
              <SortableTh sortKey="amount" label="Amount" align="right" />
              <TableHead className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Reference &amp; Status
              </TableHead>
              <SortableTh sortKey="createdAt" label="Date" align="right" />
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <Loader2 className="text-aerojet-blue mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center font-bold text-slate-500 dark:text-slate-400"
                >
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((tx) => {
                const user = tx.wallet.user
                const userName = user.profile
                  ? `${user.profile.firstName} ${user.profile.lastName}`
                  : user.email
                const paymentData =
                  tx.referenceType === 'PAYMENT_ID'
                    ? (paymentDataMap.get(tx.referenceId!) ?? null)
                    : null
                const reference = getReferenceDisplay(tx)
                const statusLabel = getTransactionStatus(tx, paymentData)
                const isCredit = CREDIT_TYPES.includes(tx.type)

                return (
                  <TableRow
                    key={tx.id}
                    className="group transition-all duration-150 ease-out hover:bg-white/80 dark:hover:bg-slate-800/40"
                  >
                    <TableCell className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {userName}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {user.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <Badge
                        className={`${getTypeColor(tx.type)} rounded-lg border-none px-2 py-0.5 text-[10px] font-black tracking-widest uppercase transition-all`}
                        variant="secondary"
                      >
                        {tx.type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex flex-col">
                        <span
                          className={`text-sm font-black ${
                            isCredit
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {isCredit ? '+' : '-'}
                          {symbol}
                          {Number(tx.amount).toFixed(2)}
                        </span>
                        {paymentData?.paymentCurrency &&
                          paymentData.paymentCurrency !== symbol && (
                            <span className="text-[10px] font-medium text-slate-400">
                              ({paymentData.paymentCurrency}{' '}
                              {paymentData.originalAmount != null
                                ? paymentData.originalAmount.toFixed(2)
                                : '0.00'})
                            </span>
                          )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {reference.type}
                          </span>
                          <span
                            className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9px] font-bold ${getStatusStyle(statusLabel)}`}
                          >
                            {statusLabel}
                          </span>
                        </div>
                        <span className="text-[10px] font-medium text-slate-400">
                          {reference.id}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5 text-xs text-slate-500">
                      {format(new Date(tx.createdAt), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
      <TablePagination
        page={page}
        perPage={perPage}
        total={total}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
      />
    </div>
  )
}
