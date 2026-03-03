import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import WalletTopUpForm from '../_components/WalletTopUpForm'
import TransactionHistory from '../_components/TransactionHistory'
import { ArrowLeft, Wallet, Info, PiggyBank, Clock, ArrowRight, Shield } from 'lucide-react'

export const metadata: Metadata = { title: 'Top Up Wallet | Exam Only Pathway' }
export const dynamic = 'force-dynamic'

export default async function ExamOnlyTopUpPage({
  searchParams,
}: {
  searchParams: Promise<{ required?: string }>
}) {
  const { required: requiredAmount } = await searchParams
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const userId = (session.user as any).id

  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      registrationPaid: true,
      programmeChoice: true,
      role: true,
    },
  })

  if (!user || user.role === 'STUDENT') {
    redirect('/login')
  }

  // Check pending payment
  const pendingPayment = await prisma.payment.findFirst({
    where: {
      userId,
      referenceType: 'WALLET_TOPUP',
      status: 'PENDING',
    },
  })

  // Get wallet
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
  })

  // Get minimum exam fee
  const examComponents = await prisma.examComponent.findMany({
    where: { course: { isActive: true } },
    select: { individualPrice: true, poolPrice: true },
    orderBy: { individualPrice: 'asc' },
  })

  const pools = await prisma.examPool.findMany({
    where: { status: { in: ['OPEN', 'NEAR_FULL', 'CONFIRMED', 'DRAFT'] } },
    select: { seatPrice: true },
    orderBy: { seatPrice: 'asc' },
  })

  const lowestIndividual =
    examComponents.length > 0
      ? Math.min(...examComponents.map((e) => Number(e.individualPrice || 520)))
      : 520
  const lowestPool =
    pools.length > 0 ? Math.min(...pools.map((p) => Number(p.seatPrice || 300))) : 300
  const minAmount = Math.min(lowestIndividual, lowestPool)

  // Get payment methods
  const paymentMethods = await prisma.paymentMethod.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })

  const formattedMethods = paymentMethods.map((pm) => {
    const details: Record<string, string> = {}
    if (pm.type === 'BANK_TRANSFER') {
      if (pm.bankName) details.bankName = pm.bankName
      if (pm.bankAccountName) details.accountName = pm.bankAccountName
      if (pm.bankAccountNumber) details.accountNumber = pm.bankAccountNumber
      if (pm.bankSwiftCode) details.swiftCode = pm.bankSwiftCode
      if (pm.bankBranch) details.branch = pm.bankBranch
    } else if (pm.type === 'MOBILE_MONEY') {
      if (pm.momoProvider) details.provider = pm.momoProvider
      if (pm.momoNumber) details.number = pm.momoNumber
      if (pm.momoAccountName) details.accountName = pm.momoAccountName
    }

    return {
      id: pm.id,
      name: pm.label,
      type: pm.type,
      instructions:
        pm.type === 'BANK_TRANSFER'
          ? 'Make payment to the account below and upload proof'
          : pm.type === 'MOBILE_MONEY'
            ? 'Send payment via mobile money and upload proof'
            : 'Complete payment and upload proof',
      details: Object.keys(details).length > 0 ? details : undefined,
    }
  })

  // Get transaction history
  const walletTransactions = await prisma.walletTransaction.findMany({
    where: { wallet: { userId } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  const paymentHistory = await prisma.payment.findMany({
    where: {
      userId,
      referenceType: 'WALLET_TOPUP',
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  const formattedTransactions = walletTransactions.map((t) => ({
    id: t.id,
    amount: Number(t.amount),
    type: t.type,
    status: t.type === 'TOP_UP' ? 'APPROVED' : 'COMPLETED',
    createdAt: t.createdAt.toISOString(),
    referenceType: t.referenceType || undefined,
    referenceId: t.referenceId || undefined,
    description: t.description || undefined,
  }))

  const formattedPayments = paymentHistory.map((p) => ({
    id: p.id,
    amount: Number(p.amount),
    status: p.status,
    paymentMethod: p.paymentMethod || undefined,
    createdAt: p.createdAt.toISOString(),
    rejectionReason: p.rejectionReason || undefined,
  }))

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/applicant/exam-only"
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-[#002a5c]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Top Up Wallet
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Add funds to book exam seats</p>
        </div>
      </div>

      {/* Wallet Balance Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-lg dark:border-slate-700">
        <div className="bg-linear-to-r from-[#002a5c] to-[#4c9ded] px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
              <Wallet className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white/80">Available Balance</p>
              <p className="text-3xl font-black text-white">
                €{Number(wallet?.balance || 0).toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-white/60">Reserved</p>
              <p className="text-lg font-bold text-white/80">
                €{Number(wallet?.reservedBalance || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between bg-white px-6 py-3 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <PiggyBank className="h-4 w-4" />
            <span>Wallet for exam bookings</span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
            Active
          </div>
        </div>
      </div>

      {/* Pending Payment Alert */}
      {pendingPayment && (
        <div className="overflow-hidden rounded-2xl border border-orange-200 bg-linear-to-r from-orange-50 to-amber-50 shadow-md dark:border-orange-900/30 dark:from-orange-900/20 dark:to-amber-900/20">
          <div className="flex items-start gap-4 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
              <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-orange-900 dark:text-orange-300">
                Pending Verification
              </h3>
              <p className="mt-1 text-sm text-orange-800 dark:text-orange-400">
                Your top-up of <strong>€{Number(pendingPayment.amount).toLocaleString()}</strong> is
                being reviewed.
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-orange-600 dark:text-orange-500">
                <Clock className="h-3 w-3" />
                <span>Typically verified within 24-48 hours</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Required Amount Alert */}
      {requiredAmount && (
        <div className="flex items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4 dark:border-orange-900/30 dark:bg-orange-900/20">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
            <Info className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="font-bold text-orange-900 dark:text-orange-300">
              Minimum €{requiredAmount} required
            </p>
            <p className="text-sm text-orange-700 dark:text-orange-400">
              Top up your wallet to complete your booking
            </p>
          </div>
        </div>
      )}

      {/* Top Up Form or Success Message */}
      {!pendingPayment && (
        <WalletTopUpForm
          minAmount={requiredAmount ? Math.max(Number(requiredAmount), minAmount) : minAmount}
          currency="EUR"
          paymentMethods={formattedMethods}
        />
      )}

      {/* Transaction History */}
      <div className="mt-8">
        <TransactionHistory transactions={formattedTransactions} payments={formattedPayments} />
      </div>

      {/* Info Footer */}
      <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-700">
          <Shield className="h-4 w-4 text-slate-500" />
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          <p className="font-medium text-slate-900 dark:text-slate-300">Secure Wallet System</p>
          <p className="mt-1">
            Wallet credits are non-refundable but can be used for future exam bookings. All
            transactions are encrypted and secure.
          </p>
        </div>
      </div>
    </div>
  )
}
