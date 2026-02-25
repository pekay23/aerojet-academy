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
import { ExternalLink, Clock, CheckCircle2 } from 'lucide-react'
import { TopupActions } from './_components/TopupActions'

export const metadata: Metadata = { title: 'Wallet Top-ups | Staff Portal' }
export const dynamic = 'force-dynamic'

export default async function WalletTopupsPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  // Pending Uploads (Payments marked as WALLET_TOPUP and PENDING)
  const pendingRequests = await prisma.payment.findMany({
    where: { referenceType: 'WALLET_TOPUP', status: 'PENDING' },
    include: {
      user: {
        include: { profile: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Top-ups History (WalletTransactions marked as TOP_UP)
  const topupHistory = await prisma.walletTransaction.findMany({
    where: { type: 'TOP_UP' },
    orderBy: { createdAt: 'desc' },
    include: {
      wallet: {
        include: { user: { include: { profile: true } } },
      },
    },
    take: 50,
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-[#002a5c] dark:text-white">
          Wallet Top-ups
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Review pending funding requests and history.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
          <Clock className="h-5 w-5 text-amber-500" />
          Awaiting Verification ({pendingRequests.length})
        </h2>

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Proof</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                    No pending top-up requests.
                  </TableCell>
                </TableRow>
              ) : (
                pendingRequests.map((req) => {
                  const userName = req.user.profile
                    ? `${req.user.profile.firstName} ${req.user.profile.lastName}`
                    : req.user.email

                  return (
                    <TableRow key={req.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {userName}
                          </span>
                          <span className="text-xs text-slate-500">{req.user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {req.currency} {Number(req.amount).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {req.proofUrl ? (
                          <Link
                            href={req.proofUrl}
                            target="_blank"
                            className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400"
                          >
                            View Receipt <ExternalLink className="h-3 w-3" />
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400">No proof</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {format(new Date(req.createdAt), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <TopupActions
                          paymentId={req.id}
                          amount={`${req.currency} ${Number(req.amount).toFixed(2)}`}
                          userName={userName}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="mt-8 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          Recent Top-ups History
        </h2>

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Amount Credited</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date Approved</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topupHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                    No top-ups found.
                  </TableCell>
                </TableRow>
              ) : (
                topupHistory.map((tx) => {
                  const user = tx.wallet.user
                  const userName = user.profile
                    ? `${user.profile.firstName} ${user.profile.lastName}`
                    : user.email

                  return (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {userName}
                          </span>
                          <span className="text-xs text-slate-500">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          +{tx.wallet.currency} {Number(tx.amount).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-slate-50 text-slate-600 dark:bg-slate-800"
                        >
                          {tx.referenceType || 'Manual'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
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
    </div>
  )
}
