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

export const metadata: Metadata = { title: 'Wallet Top-ups | Staff Portal' }

interface PageProps {
  searchParams: Promise<{ query?: string }>
}

export default async function WalletTopupsPage({ searchParams }: PageProps) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const { query } = await searchParams

  const topups = await prisma.walletTransaction.findMany({
    where: {
      type: 'TOP_UP',
      ...(query && {
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
        ],
      }),
    },
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
    take: 100,
  })

  // Manual serialization
  const serializedTopups = topups.map((tx) => ({
    ...tx,
    amount: Number(tx.amount),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#002a5c] dark:text-white">Wallet Top-ups</h1>
          <p className="text-slate-500 dark:text-slate-400">History of wallet funding</p>
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
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {serializedTopups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-slate-500 dark:text-slate-400">
                  No top-ups found.
                </TableCell>
              </TableRow>
            ) : (
              serializedTopups.map((tx) => {
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
                      <span className="font-medium text-emerald-600">+€{tx.amount.toFixed(2)}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{tx.referenceType || 'Manual'}</Badge>
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
