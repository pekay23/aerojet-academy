import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import { getSystemSetting } from '@/lib/settings'
import RevenueChart from '../_components/RevenueChart'
import PaymentApprovalCard from '../_components/PaymentApprovalCard'
import GoNoGoMeter from '../_components/GoNoGoMeter'
import PoolsSummaryCard from '../_components/PoolsSummaryCard'
import {
  Users,
  UserCheck,
  GraduationCap,
  CreditCard,
  TrendingUp,
  Clock,
  AlertTriangle,
} from 'lucide-react'

async function getDashboardData() {
  // Build last 6 months date range
  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const currency = await getSystemSetting('course_currency', 'EUR')
  const { getCurrencySymbol } = await import('@/lib/currency')
  const currSymbol = getCurrencySymbol(currency)

  const [
    userStatusCounts,
    pendingPayments,
    recentPendingPayments,
    activePool,
    openPools,
    approvedPayments,
  ] = await Promise.all([
    prisma.user.groupBy({
      by: ['role', 'status'],
      _count: { _all: true },
    }),
    prisma.payment.count({ where: { status: 'PENDING' } }),
    prisma.payment.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            academyEmail: true,
            role: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
    prisma.examPool.findFirst({
      where: { status: { in: ['OPEN', 'NEAR_FULL'] } },
      include: { event: true },
      orderBy: { examDate: 'asc' },
    }),
    prisma.examPool.findMany({
      where: { status: { in: ['OPEN', 'NEAR_FULL'] } },
      include: { event: { select: { name: true } } },
      orderBy: { examDate: 'asc' },
      take: 5,
    }),
    prisma.payment.findMany({
      where: {
        status: 'APPROVED',
        approvedAt: { gte: sixMonthsAgo },
      },
      select: { amount: true, approvedAt: true, referenceType: true },
    }),
  ])

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  const revenueByMonth: Record<string, { reg: number; course: number }> = {}

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`
    revenueByMonth[key] = { reg: 0, course: 0 }
  }

  for (const payment of approvedPayments) {
    if (!payment.approvedAt) continue
    const d = new Date(payment.approvedAt)
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`
    if (key in revenueByMonth) {
      if (payment.referenceType === 'REGISTRATION') {
        revenueByMonth[key].reg += Number(payment.amount)
      } else {
        revenueByMonth[key].course += Number(payment.amount)
      }
    }
  }

  const revenueData = Object.entries(revenueByMonth).map(([fullKey, val]) => ({
    month: fullKey.split(' ')[0],
    revenue: val.course, // Main revenue line showing Course (EUR)
    regRevenue: val.reg, // Secondary data
  }))

  const totalActiveUsers = userStatusCounts
    .filter((u) => u.status === 'ACTIVE')
    .reduce((acc, curr) => acc + curr._count._all, 0)
  const pendingApplicants = userStatusCounts
    .filter((u) => u.role === 'APPLICANT' && u.status === 'PENDING')
    .reduce((acc, curr) => acc + curr._count._all, 0)
  const activeStudents = userStatusCounts
    .filter((u) => u.role === 'STUDENT' && u.status === 'ACTIVE')
    .reduce((acc, curr) => acc + curr._count._all, 0)

  return {
    totalUsers: totalActiveUsers,
    pendingApplicants,
    activeStudents,
    pendingPayments,
    recentPendingPayments,
    activePool: activePool
      ? {
          ...activePool,
          seatPrice: Number(activePool.seatPrice),
        }
      : null,
    openPools: openPools.map((p) => ({
      ...p,
      seatPrice: Number(p.seatPrice),
    })),
    revenueData,
    currency,
    currSymbol,
  }
}

export default async function StaffDashboardPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const data = await getDashboardData()

  const stats = [
    {
      label: 'Active Users',
      value: data.totalUsers,
      icon: Users,
      color: 'text-aerojet-sky',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Pending Applicants',
      value: data.pendingApplicants,
      icon: UserCheck,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      alert: data.pendingApplicants > 0,
      href: '/staff/users?tab=applicants',
    },
    {
      label: 'Active Students',
      value: data.activeStudents,
      icon: GraduationCap,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      label: 'Pending Payments',
      value: data.pendingPayments,
      icon: CreditCard,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
      alert: data.pendingPayments > 0,
      href: '/staff/payments?tab=PENDING',
    },
  ]

  const hasRevenue = data.revenueData.some((d) => d.revenue > 0)

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          const card = (
            <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-150 ease-out hover:border-slate-200 hover:shadow-md sm:p-5 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700">
              <div
                className={`h-11 w-11 rounded-xl ${stat.bg} flex shrink-0 items-center justify-center`}
              >
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-2xl font-black text-slate-800 dark:text-white">
                  {stat.value}
                  {stat.alert && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                </p>
                <p className="truncate text-[11px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                  {stat.label}
                </p>
              </div>
            </div>
          )
          return stat.href ? (
            <a key={stat.label} href={stat.href}>
              {card}
            </a>
          ) : (
            <div key={stat.label}>{card}</div>
          )
        })}
      </div>

      {/* Revenue + Go/No-Go */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <div className="min-w-0 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black tracking-tight text-slate-800 uppercase dark:text-white">
                Course Revenue Overview
              </h2>
              <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                Approved training payments ({data.currency}) — last 6 months
              </p>
            </div>
            <TrendingUp className="text-aerojet-sky h-5 w-5" />
          </div>
          {hasRevenue ? (
            <RevenueChart data={data.revenueData} currency={data.currSymbol} />
          ) : (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <TrendingUp className="mb-3 h-10 w-10 text-slate-200" />
              <p className="text-sm font-bold text-slate-400">No approved payments yet</p>
              <p className="mt-1 text-xs text-slate-300">
                Revenue will appear here once payments are approved
              </p>
            </div>
          )}
        </div>

        {/* Go/No-Go Meter + Pools Summary */}
        <div className="flex flex-col gap-4">
          {data.activePool ? (
            <GoNoGoMeter
              poolName={`${data.activePool.event?.name} — ${data.activePool.name}`}
              currentRevenue={
                data.activePool.currentMemberCount * Number(data.activePool.seatPrice)
              }
              targetRevenue={Number(data.activePool.event?.minRevenueTarget ?? 25000)}
              confirmedSeats={data.activePool.currentMemberCount}
              totalSeats={data.activePool.maxCandidates}
              paymentDeadline={data.activePool.event?.paymentDeadline ?? new Date()}
            />
          ) : (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-800/50">
              <Clock className="mb-2 h-8 w-8 text-slate-300" />
              <p className="text-sm font-bold text-slate-400">No active exam bookings</p>
              <p className="mt-1 text-xs text-slate-300">Create an exam event to get started</p>
            </div>
          )}

          <PoolsSummaryCard pools={data.openPools} />
        </div>
      </div>

      {/* Pending Payments */}
      {data.recentPendingPayments.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-black tracking-tight text-slate-800 uppercase dark:text-white">
              Pending Payment Approvals
            </h2>
            <a
              href="/staff/payments?tab=PENDING"
              className="text-aerojet-sky text-xs font-bold hover:underline"
            >
              View all ({data.pendingPayments})
            </a>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.recentPendingPayments.map((payment) => (
              <PaymentApprovalCard
                key={payment.id}
                payment={{
                  ...payment,
                  amount: Number(payment.amount),
                  user: {
                    id: payment.user.id,
                    email: payment.user.email,
                    profile: payment.user.profile ?? null,
                  },
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state when no pending payments */}
      {data.recentPendingPayments.length === 0 && (
        <div className="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-6 dark:border-emerald-900/30 dark:bg-emerald-900/10">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
            <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
              No pending payments
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400/60">
              All payment submissions are up to date.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
