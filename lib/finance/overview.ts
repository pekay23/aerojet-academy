import { prismaUnfiltered } from '@/lib/prisma/client'
import { serializePrisma } from '@/lib/utils/serialization'
import { PaymentStatus, TransactionType } from '@/types/enums'

export interface FinanceOverviewTransaction {
  id: string
  amount: number
  currency: string
  status: string
  paymentMethod: string
  referenceType?: string | null
  createdAt: string
  approvedAt?: string | null
  user: {
    email: string
    profile?: { firstName: string; middleName?: string | null; lastName: string } | null
  }
}

export interface FinanceOverviewData {
  totalRevenue: number
  totalRevenueCount: number
  totalRegistration: number
  totalCourse: number
  monthRegistration: number
  monthCourse: number
  lastMonthRegistration: number
  lastMonthCourse: number
  pendingCount: number
  pendingTotal: number
  recentTransactions: FinanceOverviewTransaction[]
}

/**
 * Wallet-based exam bookings create CAPTURE/PAYMENT WalletTransactions
 * (not Payment records), so we must aggregate both tables to show
 * complete revenue.  Exam booking referenceTypes used in wallet ops:
 *   EXAM_BOOKING, POOL_CAPTURE
 */
const WALLET_EXAM_REF_TYPES = ['EXAM_BOOKING', 'POOL_CAPTURE']
export async function getFinanceOverviewData(): Promise<FinanceOverviewData> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const walletExamFilter = {
    type: { in: [TransactionType.CAPTURE, TransactionType.PAYMENT] },
    referenceType: { in: WALLET_EXAM_REF_TYPES },
  }

  const [
    totalRegistration,
    totalCourse,
    totalRevenue,
    monthRegistration,
    monthCourse,
    lastMonthRegistration,
    lastMonthCourse,
    pendingCount,
    pendingTotal,
    recentTransactions,
    // Wallet-based exam revenue (not tracked in Payment table)
    walletExamTotal,
    walletExamMonth,
    walletExamLastMonth,
  ] = await Promise.all([
    prismaUnfiltered.payment.aggregate({
      where: { status: PaymentStatus.APPROVED, referenceType: 'REGISTRATION' },
      _sum: { amount: true, originalAmount: true },
    }),
    prismaUnfiltered.payment.aggregate({
      where: { status: PaymentStatus.APPROVED, referenceType: { in: ['COURSE', 'EXAM'] } },
      _sum: { amount: true },
    }),
    prismaUnfiltered.payment.aggregate({
      where: { status: PaymentStatus.APPROVED },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prismaUnfiltered.payment.aggregate({
      where: {
        status: PaymentStatus.APPROVED,
        referenceType: 'REGISTRATION',
        approvedAt: { gte: startOfMonth },
      },
      _sum: { amount: true, originalAmount: true },
    }),
    prismaUnfiltered.payment.aggregate({
      where: {
        status: PaymentStatus.APPROVED,
        referenceType: { in: ['COURSE', 'EXAM'] },
        approvedAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    }),
    prismaUnfiltered.payment.aggregate({
      where: {
        status: PaymentStatus.APPROVED,
        referenceType: 'REGISTRATION',
        approvedAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      _sum: { amount: true, originalAmount: true },
    }),
    prismaUnfiltered.payment.aggregate({
      where: {
        status: PaymentStatus.APPROVED,
        referenceType: { in: ['COURSE', 'EXAM'] },
        approvedAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      _sum: { amount: true },
    }),
    prismaUnfiltered.payment.count({ where: { status: PaymentStatus.PENDING } }),
    prismaUnfiltered.payment.aggregate({
      where: { status: PaymentStatus.PENDING },
      _sum: { amount: true },
    }),
    prismaUnfiltered.payment.findMany({
      where: {
        status: {
          in: [PaymentStatus.APPROVED, PaymentStatus.REJECTED, PaymentStatus.PENDING],
        },
      },
      include: {
        user: {
          include: { profile: { select: { firstName: true, middleName: true, lastName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    // Wallet exam captures — all time
    prismaUnfiltered.walletTransaction.aggregate({
      where: walletExamFilter,
      _sum: { amount: true },
      _count: { id: true },
    }),
    // Wallet exam captures — this month
    prismaUnfiltered.walletTransaction.aggregate({
      where: { ...walletExamFilter, createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    // Wallet exam captures — last month
    prismaUnfiltered.walletTransaction.aggregate({
      where: {
        ...walletExamFilter,
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      _sum: { amount: true },
    }),
  ])

  const walletExamTotalAmt = Number(walletExamTotal._sum.amount ?? 0)
  const walletExamMonthAmt = Number(walletExamMonth._sum.amount ?? 0)
  const walletExamLastMonthAmt = Number(walletExamLastMonth._sum.amount ?? 0)
  const walletExamCount = walletExamTotal._count.id

  const paymentRevenue = Number(totalRevenue._sum.amount ?? 0)
  const paymentRevenueCount = totalRevenue._count.id
  const courseFromPayment = Number(totalCourse._sum.amount ?? 0)

  return {
    totalRegistration: Number(
      totalRegistration._sum.originalAmount ?? totalRegistration._sum.amount ?? 0
    ),
    totalCourse: courseFromPayment + walletExamTotalAmt,
    totalRevenue: paymentRevenue + walletExamTotalAmt,
    totalRevenueCount: paymentRevenueCount + walletExamCount,
    monthRegistration: Number(
      monthRegistration._sum.originalAmount ?? monthRegistration._sum.amount ?? 0
    ),
    monthCourse: Number(monthCourse._sum.amount ?? 0) + walletExamMonthAmt,
    lastMonthRegistration: Number(
      lastMonthRegistration._sum.originalAmount ?? lastMonthRegistration._sum.amount ?? 0
    ),
    lastMonthCourse: Number(lastMonthCourse._sum.amount ?? 0) + walletExamLastMonthAmt,
    pendingCount,
    pendingTotal: Number(pendingTotal._sum.amount ?? 0),
    recentTransactions: serializePrisma(recentTransactions),
  }
}
