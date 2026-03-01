import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import Link from 'next/link'
import { Metadata } from 'next'
import SearchInput from '@/components/SearchInput'
import { getCurrencySymbol } from '@/lib/currency'

export const metadata: Metadata = { title: 'Transaction History | Staff Portal' }

interface PageProps {
  searchParams: Promise<{ query?: string }>
}

export default async function TransactionsPage({ searchParams }: PageProps) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const { query } = await searchParams

  const settings = await prisma.systemSetting.findMany({
    where: { key: 'course_currency' },
  })
  const currency = settings[0]?.value || 'EUR'
  const symbol = getCurrencySymbol(currency)

  const transactions = await prisma.walletTransaction.findMany({
    where: query
      ? {
          OR: [
            {
              wallet: {
                user: {
                  OR: [
                    { email: { contains: query, mode: 'insensitive' } },
                    { profile: { firstName: { contains: query, mode: 'insensitive' } } },
                    { profile: { lastName: { contains: query, mode: 'insensitive' } } },
                  ],
                },
              },
            },
            { referenceId: { contains: query, mode: 'insensitive' } },
            { referenceType: { contains: query, mode: 'insensitive' } },
            // Optional: Search by amount? No, usually text search.
          ],
        }
      : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      wallet: {
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
      },
    },
    take: 100, // Limit for now
  })

  // Serialize Decimals
  const serializedTransactions = transactions.map((tx) => ({
    ...tx,
    amount: Number(tx.amount),
    balanceBefore: tx.balanceBefore ? Number(tx.balanceBefore) : null,
    balanceAfter: tx.balanceAfter ? Number(tx.balanceAfter) : null,
    reservedBefore: tx.reservedBefore ? Number(tx.reservedBefore) : null,
    reservedAfter: tx.reservedAfter ? Number(tx.reservedAfter) : null,
    availableBefore: tx.availableBefore ? Number(tx.availableBefore) : null,
    availableAfter: tx.availableAfter ? Number(tx.availableAfter) : null,
  }))

  // Fetch payments to cross-reference reconciliation status
  const paymentIds = serializedTransactions
    .filter((tx) => tx.referenceType === 'PAYMENT_ID' && tx.referenceId)
    .map((tx) => tx.referenceId!)

  const relatedPayments = await prisma.payment.findMany({
    where: { id: { in: paymentIds } },
    select: { id: true, reconciled: true },
  })

  const reconciliationMap = new Map(relatedPayments.map((p) => [p.id, p.reconciled]))

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'TOP_UP':
      case 'REFUND':
      case 'RELEASE':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
      case 'CAPTURE':
      case 'PAYMENT':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
      case 'RESERVE':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-aerojet-blue text-3xl font-black tracking-tight uppercase dark:text-white">
            Transactions
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            View recent wallet movements and settlement status
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/staff/finance/reconciliation"
            className="text-aerojet-blue rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-xs font-black tracking-widest uppercase transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          >
            Go to Reconciliation
          </Link>
          <div className="w-72">
            <SearchInput placeholder="Search user or reference..." />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
            <TableRow>
              <TableHead className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                User
              </TableHead>
              <TableHead className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Type
              </TableHead>
              <TableHead className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Amount
              </TableHead>
              <TableHead className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Reference & Status
              </TableHead>
              <TableHead className="px-6 py-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Date
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
            {serializedTransactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center font-bold text-slate-500 dark:text-slate-400"
                >
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              serializedTransactions.map((tx) => {
                const user = tx.wallet.user
                const userName = user.profile
                  ? `${user.profile.firstName} ${user.profile.lastName}`
                  : user.email

                const isReconciled =
                  tx.referenceType === 'PAYMENT_ID' && reconciliationMap.get(tx.referenceId!)

                return (
                  <TableRow
                    key={tx.id}
                    className="group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
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
                      <span
                        className={`text-sm font-black ${
                          ['TOP_UP', 'REFUND', 'RELEASE'].includes(tx.type)
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {['TOP_UP', 'REFUND', 'RELEASE'].includes(tx.type) ? '+' : '-'}
                        {symbol}
                        {tx.amount.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {tx.referenceType || '—'}
                          </span>
                          {isReconciled ? (
                            <span className="flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                              Reconciled
                            </span>
                          ) : tx.referenceType === 'PAYMENT_ID' ? (
                            <span className="flex items-center gap-0.5 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-400 dark:bg-slate-800">
                              Pending Settlement
                            </span>
                          ) : null}
                        </div>
                        {tx.referenceId && (
                          <span className="font-mono text-[10px] text-slate-400">
                            {tx.referenceId}
                          </span>
                        )}
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
    </div>
  )
}
