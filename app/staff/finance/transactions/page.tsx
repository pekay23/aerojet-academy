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

export const metadata: Metadata = { title: 'Transaction History | Staff Portal' }

interface PageProps {
  searchParams: Promise<{ query?: string }>
}

export default async function TransactionsPage({ searchParams }: PageProps) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const { query } = await searchParams

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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'TOP_UP':
      case 'REFUND':
      case 'RELEASE':
        return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
      case 'CAPTURE':
      case 'PAYMENT':
        return 'bg-blue-100 text-blue-700 hover:bg-blue-100'
      case 'RESERVE':
        return 'bg-amber-100 text-amber-700 hover:bg-amber-100'
      default:
        return 'bg-slate-100 text-slate-700 hover:bg-slate-100'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#002a5c] dark:text-white">Transactions</h1>
          <p className="text-slate-500 dark:text-slate-400">View recent wallet movements</p>
        </div>
        <div className="w-72">
          <SearchInput placeholder="Search user or reference..." />
        </div>
      </div>

      <div className="rounded-md border bg-white dark:bg-slate-900 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {serializedTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-slate-500 dark:text-slate-400">
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              serializedTransactions.map((tx) => {
                const user = tx.wallet.user
                const userName = user.profile
                  ? `${user.profile.firstName} ${user.profile.lastName}`
                  : user.email

                return (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{userName}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(tx.type)} variant="secondary">
                        {tx.type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          ['TOP_UP', 'REFUND', 'RELEASE'].includes(tx.type)
                            ? 'font-medium text-emerald-600'
                            : 'font-medium text-slate-900'
                        }
                      >
                        {['TOP_UP', 'REFUND', 'RELEASE'].includes(tx.type) ? '+' : ''}€
                        {tx.amount.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{tx.referenceType || '—'}</span>
                        {tx.referenceId && (
                          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{tx.referenceId}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{format(new Date(tx.createdAt), 'MMM d, yyyy HH:mm')}</TableCell>
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
