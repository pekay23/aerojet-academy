import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { serializePrisma } from '@/lib/utils/serialization'
import { getSystemSetting } from '@/lib/settings'
import { DashboardCharts } from '../_components/DashboardCharts'
import PaymentApprovalCard from '../_components/PaymentApprovalCard'
import GoNoGoMeter from '../_components/GoNoGoMeter'
import PipelineAnalytics from '../_components/PipelineAnalytics'
import PoolsSummaryCard from '../_components/PoolsSummaryCard'
import TargetRevenueEditor from '../_components/TargetRevenueEditor'
import ExaminerDashboard from '../_components/ExaminerDashboard'
import AlertsCenter from './_components/AlertsCenter'
import { getDashboardAlerts } from '@/lib/analytics/dashboard-alerts'
import { UserStatus, UserRole, PaymentStatus, PoolStatus } from '@/types/enums'
import type { SerializedPaymentCard } from '@/lib/staff/types'
import { COUNTABLE_MEMBERSHIP_STATUSES, TERMINAL_POOL_STATUSES, UPCOMING_EVENT_STATUSES, LIVE_POOL_STATUSES } from '@/lib/utils/constants'
import {
  Users,
  UserCheck,
  GraduationCap,
  CreditCard,
  TrendingUp,
  Clock,
  AlertTriangle,
} from 'lucide-react'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

async function fetchDashboardSettings(tx: Parameters<Parameters<typeof prismaUnfiltered.$transaction>[0]>[0]) {
  const settings = await tx.systemSetting.findMany({
    where: { key: { in: ['course_currency', 'target_monthly_revenue'] } },
  })
  const map = new Map(settings.map(s => [s.key, s.value]))
  const currency = map.get('course_currency') || 'EUR'
  const targetMonthlyRevenue = Number(map.get('target_monthly_revenue') || '50000')
  const { getCurrencySymbol } = await import('@/lib/currency')
  return { currency, targetMonthlyRevenue, currSymbol: getCurrencySymbol(currency) }
}

function buildRevenueTimeline(
  approvedPayments: { amount: any; approvedAt: Date | null }[],
  targetMonthlyRevenue: number,
) {
  const now = new Date()
  const revenueByMonth: Record<string, number> = {}

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    revenueByMonth[`${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`] = 0
  }

  for (const p of approvedPayments) {
    if (!p.approvedAt) continue
    const d = new Date(p.approvedAt)
    const key = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
    if (key in revenueByMonth) revenueByMonth[key] += Number(p.amount)
  }

  return Object.entries(revenueByMonth).map(([fullKey, total]) => ({
    month: fullKey.split(' ')[0],
    revenue: total,
    target: targetMonthlyRevenue,
  }))
}

function computeUserStats(userStatusCounts: { role: string; status: string; _count: { _all: number } }[]) {
  const sumBy = (filter: (u: typeof userStatusCounts[number]) => boolean) =>
    userStatusCounts.filter(filter).reduce((acc, u) => acc + (u._count._all ?? 0), 0)

  return {
    totalUsers: sumBy(u => u.status === UserStatus.ACTIVE),
    pendingApplicants: sumBy(u => u.role === UserRole.APPLICANT && u.status === UserStatus.PENDING),
    activeStudents: sumBy(u => u.role === UserRole.STUDENT && u.status === UserStatus.ACTIVE),
  }
}

function computeEventStats(activeEventRaw: any) {
  if (!activeEventRaw) return null
  return {
    name: activeEventRaw.name,
    totalSeatsFilled: activeEventRaw.pools.reduce((sum: number, p: any) => sum + p._count.memberships, 0),
    totalCapacity: activeEventRaw.pools.reduce((sum: number, p: any) => sum + p.maxCandidates, 0),
    totalConfirmedRevenue: activeEventRaw.examBookings.reduce((sum: number, b: any) => sum + Number(b.amountPaid || 0), 0),
    targetRevenue: Number(activeEventRaw.minRevenueTarget),
    paymentDeadline: activeEventRaw.paymentDeadline,
  }
}

// ── Per-entity loaders ───────────────────────────────────────────────────
// Each helper wraps a single Prisma query so `getDashboardData` becomes a
// tight Promise.all + stitch (P2.7 refactor — split the original 110-line
// orchestrator into named pieces).

type Tx = Parameters<Parameters<typeof prismaUnfiltered.$transaction>[0]>[0]

function loadUserStatusCounts(tx: Tx) {
  return tx.user.groupBy({ by: ['role', 'status'], _count: { _all: true } })
}

function loadPendingPaymentCount(tx: Tx) {
  return tx.payment.count({ where: { status: PaymentStatus.PENDING } })
}

function loadRecentPendingPayments(tx: Tx) {
  return tx.payment.findMany({
    where: { status: PaymentStatus.PENDING },
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
  })
}

function loadActiveExamEvent(tx: Tx, now: Date) {
  return tx.examEvent.findFirst({
    where: {
      status: { in: UPCOMING_EVENT_STATUSES },
      deletedAt: null,
      startDate: { gte: now },
    },
    include: {
      pools: {
        where: { status: { notIn: TERMINAL_POOL_STATUSES } },
        select: {
          maxCandidates: true,
          seatPrice: true,
          _count: {
            select: { memberships: { where: { status: { in: COUNTABLE_MEMBERSHIP_STATUSES } } } },
          },
        },
      },
      examBookings: {
        where: {
          status: { notIn: ['FAILED', 'REJECTED', 'CANCELLED'] },
          deletedAt: null,
        },
        select: { amountPaid: true },
      },
    },
    orderBy: { startDate: 'asc' },
  })
}

function loadOpenPools(tx: Tx, now: Date) {
  return tx.examPool.findMany({
    where: {
      status: { in: LIVE_POOL_STATUSES },
      examDate: { gte: now },
    },
    include: {
      event: { select: { name: true } },
      _count: {
        select: { memberships: { where: { status: { in: COUNTABLE_MEMBERSHIP_STATUSES } } } },
      },
    },
    orderBy: { examDate: 'asc' },
    take: 5,
  })
}

function loadApprovedTopupsSince(tx: Tx, since: Date) {
  return tx.payment.findMany({
    where: {
      status: PaymentStatus.APPROVED,
      approvedAt: { gte: since },
      referenceType: 'WALLET_TOP_UP',
    },
    select: { amount: true, approvedAt: true },
  })
}

// ── Orchestrator ─────────────────────────────────────────────────────────
async function getDashboardData() {
  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  return prismaUnfiltered.$transaction(
    async (tx) => {
      const { currency, targetMonthlyRevenue, currSymbol } = await fetchDashboardSettings(tx)

      const [
        userStatusCounts,
        pendingPayments,
        recentPendingPaymentsRaw,
        activeEventRaw,
        openPoolsRaw,
        approvedPayments,
      ] = await Promise.all([
        loadUserStatusCounts(tx),
        loadPendingPaymentCount(tx),
        loadRecentPendingPayments(tx),
        loadActiveExamEvent(tx, now),
        loadOpenPools(tx, now),
        loadApprovedTopupsSince(tx, sixMonthsAgo),
      ])

      const { totalUsers, pendingApplicants, activeStudents } = computeUserStats(
        userStatusCounts as any
      )

      return {
        totalUsers,
        pendingApplicants,
        activeStudents,
        pendingPayments,
        recentPendingPayments: serializePrisma(recentPendingPaymentsRaw),
        activeEvent: serializePrisma(computeEventStats(serializePrisma(activeEventRaw))),
        openPools: serializePrisma(
          openPoolsRaw.map((p) => ({ ...p, currentMemberCount: p._count.memberships }))
        ),
        revenueData: buildRevenueTimeline(serializePrisma(approvedPayments), targetMonthlyRevenue),
        targetMonthlyRevenue,
        currency,
        currSymbol,
      }
    },
    { maxWait: 15000, timeout: 20000 }
  )
}

export default async function StaffDashboardPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  if (session.user.role === 'EXAMINER') {
    redirect('/examiner')
  }

  // 2. Standard Staff/Admin logic
  const [data, alerts] = await Promise.all([getDashboardData(), getDashboardAlerts()])

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
      href: `/staff/payments?tab=${PaymentStatus.PENDING}`,
    },
  ]

  const hasRevenue = data.revenueData.some((d) => d.revenue > 0)

  return (
    <div className="space-y-8">
      {/* Alerts (A.1.b) — auto-refreshes every 60s */}
      {alerts.length > 0 && <AlertsCenter initialAlerts={alerts} />}

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
                <p className="truncate text-xs font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
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
            <div className="min-w-0">
              <h2 className="text-sm font-black tracking-tight text-slate-800 uppercase dark:text-white">
                Course Revenue Overview
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Approved training payments ({data.currency}) — last 6 months
                </p>
                <TargetRevenueEditor
                  initialAmount={data.targetMonthlyRevenue}
                  currency={data.currSymbol}
                />
              </div>
            </div>
            <TrendingUp className="text-aerojet-sky h-5 w-5 shrink-0" />
          </div>
          {hasRevenue ? (
            <DashboardCharts data={data.revenueData} currency={data.currSymbol} />
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
          {data.activeEvent ? (
            <GoNoGoMeter
              poolName={data.activeEvent.name}
              currentRevenue={data.activeEvent.totalConfirmedRevenue}
              targetRevenue={data.activeEvent.targetRevenue}
              confirmedSeats={data.activeEvent.totalSeatsFilled}
              totalSeats={data.activeEvent.totalCapacity}
              paymentDeadline={data.activeEvent.paymentDeadline}
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
              href={`/staff/payments?tab=${PaymentStatus.PENDING}`}
              className="text-aerojet-sky text-xs font-bold hover:underline"
            >
              View all ({data.pendingPayments})
            </a>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.recentPendingPayments.map((payment: SerializedPaymentCard) => (
              <PaymentApprovalCard
                key={payment.id}
                payment={payment}
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

      {/* Admissions Pipeline Analytics */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <PipelineAnalytics />
      </div>
    </div>
  )
}
