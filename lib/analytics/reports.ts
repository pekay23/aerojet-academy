import prisma from '@/lib/prisma/client'
import { subDays, startOfMonth, startOfYear } from 'date-fns'
import { EnrollmentStatus } from '@prisma/client'

export async function getEnrollmentTrends() {
  const enrollmentsByCourse = await prisma.enrollment.groupBy({
    by: ['courseId'],
    _count: { userId: true },
    orderBy: { _count: { userId: 'desc' } },
  })

  const courses = await prisma.course.findMany({
    where: { id: { in: enrollmentsByCourse.map((e) => e.courseId) } },
    select: { id: true, name: true, code: true },
  })

  return enrollmentsByCourse.map((item) => {
    const course = courses.find((c) => c.id === item.courseId)
    return {
      courseName: course?.name || 'Unknown Course',
      courseCode: course?.code || 'N/A',
      count: item._count.userId,
    }
  })
}

export async function getRevenueReport() {
  const recentPayments = await prisma.payment.findMany({
    where: { status: 'APPROVED' },
    orderBy: { updatedAt: 'desc' },
    take: 20,
    include: {
      user: { include: { profile: true } },
    },
  })

  // Group revenue by month for chart (last 6 months)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const paymentsForChart = await prisma.payment.findMany({
    where: {
      status: 'APPROVED',
      updatedAt: { gte: sixMonthsAgo },
    },
    select: { amount: true, updatedAt: true },
  })

  const monthlyRevenue: Record<string, number> = {}
  paymentsForChart.forEach((p) => {
    const month = p.updatedAt.toLocaleString('default', { month: 'short' })
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + Number(p.amount)
  })

  const chartData = Object.entries(monthlyRevenue).map(([name, total]) => ({ name, total }))

  const totalRevenue = await prisma.payment.aggregate({
    where: { status: 'APPROVED' },
    _sum: { amount: true },
  })

  return {
    recentPayments,
    chartData,
    totalRevenue: Number(totalRevenue._sum.amount || 0),
  }
}

export async function getPoolAnalytics() {
  const pools = await prisma.examPool.findMany({
    orderBy: { examDate: 'desc' },
    include: {
      event: { select: { name: true } },
    },
    take: 50,
  })

  // Format for chart
  const chartData = pools.map((pool) => ({
    name: pool.name,
    fill: Math.round((pool.currentMemberCount / pool.maxCandidates) * 100),
    count: pool.currentMemberCount,
    capacity: pool.maxCandidates,
  }))

  return { pools, chartData }
}

export async function getAttendanceReport() {
  const records = await prisma.attendanceRecord.findMany({
    take: 50,
    orderBy: { date: 'desc' },
    include: {
      user: { include: { profile: true } },
      class: { select: { name: true } },
    },
  })

  // Status breakdown for chart
  const stats = await prisma.attendanceRecord.groupBy({
    by: ['status'],
    _count: { id: true },
  })

  const chartData = stats.map((s) => ({
    name: s.status,
    value: s._count.id,
  }))

  return { records, chartData }
}

// ============================================================================
// FINANCE REPORTS
// ============================================================================

export async function getFinanceReportSummary() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  // Total revenue (all approved payments)
  const totalRevenueResult = await prisma.payment.aggregate({
    where: { status: 'APPROVED' },
    _sum: { amount: true },
    _count: { id: true },
  })

  // Revenue this month
  const monthRevenueResult = await prisma.payment.aggregate({
    where: {
      status: 'APPROVED',
      approvedAt: { gte: startOfMonth },
    },
    _sum: { amount: true },
    _count: { id: true },
  })

  // Revenue this year
  const yearRevenueResult = await prisma.payment.aggregate({
    where: {
      status: 'APPROVED',
      approvedAt: { gte: startOfYear },
    },
    _sum: { amount: true },
    _count: { id: true },
  })

  // Pending payments total
  const pendingResult = await prisma.payment.aggregate({
    where: { status: 'PENDING' },
    _sum: { amount: true },
    _count: { id: true },
  })

  // Rejected/Failed payments
  const rejectedResult = await prisma.payment.aggregate({
    where: { status: { in: ['REJECTED', 'FAILED'] } },
    _sum: { amount: true },
    _count: { id: true },
  })

  const totalRevenue = Number(totalRevenueResult._sum.amount || 0)
  const totalCount = totalRevenueResult._count.id || 0
  const avgTransactionValue = totalCount > 0 ? totalRevenue / totalCount : 0

  return {
    totalRevenue,
    totalCount,
    avgTransactionValue,
    revenueThisMonth: Number(monthRevenueResult._sum.amount || 0),
    monthCount: monthRevenueResult._count.id || 0,
    revenueThisYear: Number(yearRevenueResult._sum.amount || 0),
    yearCount: yearRevenueResult._count.id || 0,
    pendingAmount: Number(pendingResult._sum.amount || 0),
    pendingCount: pendingResult._count.id || 0,
    rejectedAmount: Number(rejectedResult._sum.amount || 0),
    rejectedCount: rejectedResult._count.id || 0,
  }
}

export async function getRevenueByProgrammeType() {
  // Full-time programme payments (via payment milestones)
  const fullTimePayments = await prisma.paymentMilestone.findMany({
    where: { status: 'PAID' },
    include: {
      enrollment: {
        include: { programme: true },
      },
    },
  })

  const fullTimeRevenue = fullTimePayments.reduce((sum, pm) => sum + Number(pm.amountDue || 0), 0)

  // Modular enrollments
  const modularEnrollments = await prisma.modularEnrollment.findMany({
    where: { status: { in: [EnrollmentStatus.APPROVED, EnrollmentStatus.ACTIVE, EnrollmentStatus.GRADUATED] } },
  })
  const modularRevenue = modularEnrollments.reduce((sum, e) => sum + Number(e.amountPaid || 0), 0)

  // Pool/Exam payments (captured from memberships)
  const poolPayments = await prisma.poolMembership.findMany({
    where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
  })
  const poolRevenue = poolPayments.reduce((sum, pm) => sum + Number(pm.amountPaid || 0), 0)

  // Individual exam bookings
  const examBookings = await prisma.examBooking.findMany({
    where: { status: 'COMPLETED' },
  })
  const examRevenue = examBookings.reduce((sum, eb) => sum + Number(eb.amountPaid || 0), 0)

  // Registration fees
  const registrationPayments = await prisma.payment.findMany({
    where: {
      status: 'APPROVED',
      referenceType: 'REGISTRATION',
    },
  })
  const registrationRevenue = registrationPayments.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  )

  // Wallet top-ups (via wallet transactions)
  const walletTopups = await prisma.walletTransaction.findMany({
    where: { type: 'TOP_UP' },
  })
  const topupRevenue = walletTopups.reduce((sum, t) => sum + Number(t.amount || 0), 0)

  const total =
    fullTimeRevenue +
    modularRevenue +
    poolRevenue +
    examRevenue +
    registrationRevenue +
    topupRevenue

  return [
    {
      name: 'Full-Time Programmes',
      value: fullTimeRevenue,
      percentage: total > 0 ? Math.round((fullTimeRevenue / total) * 100) : 0,
    },
    {
      name: 'Modular Courses',
      value: modularRevenue,
      percentage: total > 0 ? Math.round((modularRevenue / total) * 100) : 0,
    },
    {
      name: 'Exam Bookings',
      value: poolRevenue,
      percentage: total > 0 ? Math.round((poolRevenue / total) * 100) : 0,
    },
    {
      name: 'Individual Exams',
      value: examRevenue,
      percentage: total > 0 ? Math.round((examRevenue / total) * 100) : 0,
    },
    {
      name: 'Registration Fees',
      value: registrationRevenue,
      percentage: total > 0 ? Math.round((registrationRevenue / total) * 100) : 0,
    },
    {
      name: 'Wallet Top-ups',
      value: topupRevenue,
      percentage: total > 0 ? Math.round((topupRevenue / total) * 100) : 0,
    },
  ]
}

export async function getPaymentMethodBreakdown() {
  const payments = await prisma.payment.findMany({
    where: { status: 'APPROVED' },
    select: { paymentMethod: true, amount: true },
  })

  const breakdown: Record<string, { count: number; amount: number }> = {}

  for (const payment of payments) {
    const method = payment.paymentMethod || 'UNKNOWN'
    if (!breakdown[method]) {
      breakdown[method] = { count: 0, amount: 0 }
    }
    breakdown[method].count++
    breakdown[method].amount += Number(payment.amount)
  }

  const total = Object.values(breakdown).reduce((sum, b) => sum + b.amount, 0)

  return Object.entries(breakdown).map(([method, data]) => ({
    method,
    count: data.count,
    amount: data.amount,
    percentage: total > 0 ? Math.round((data.amount / total) * 100) : 0,
  }))
}

export async function getMonthlyRevenueData() {
  const now = new Date()
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)
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

  // Initialize all 12 months with zero
  const monthlyData: Record<string, { month: string; revenue: number; count: number }> = {}
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`
    monthlyData[key] = { month: key, revenue: 0, count: 0 }
  }

  // Get payments from last 12 months
  const payments = await prisma.payment.findMany({
    where: {
      status: 'APPROVED',
      approvedAt: { gte: twelveMonthsAgo },
    },
    select: { amount: true, approvedAt: true },
  })

  // Aggregate by month
  for (const payment of payments) {
    if (!payment.approvedAt) continue
    const d = new Date(payment.approvedAt)
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`
    if (monthlyData[key]) {
      monthlyData[key].revenue += Number(payment.amount)
      monthlyData[key].count++
    }
  }

  return Object.values(monthlyData)
}

export async function getPaymentStatusBreakdown() {
  const statusCounts = await prisma.payment.groupBy({
    by: ['status'],
    _count: { id: true },
    _sum: { amount: true },
  })

  const total = statusCounts.reduce((sum: number, s) => sum + Number(s._sum.amount || 0), 0)

  return statusCounts.map((s) => ({
    status: s.status,
    count: s._count.id,
    amount: Number(s._sum.amount || 0),
    percentage: total > 0 ? Math.round((Number(s._sum.amount || 0) / total) * 100) : 0,
  }))
}

export async function getCriticalAlerts() {
  const now = new Date()
  const threeDaysFromNow = subDays(now, -3) // Actually 3 days in future
  const twoDaysAgo = subDays(now, 2)

  const [lowFillPools, stalePayments] = await Promise.all([
    prisma.examPool.findMany({
      where: {
        status: 'OPEN',
        event: {
          joinDeadline: { lte: threeDaysFromNow, gte: now },
        },
      },
      include: { event: true },
    }),
    prisma.payment.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: twoDaysAgo },
      },
      include: { user: { include: { profile: true } } },
    }),
  ])

  const alerts = []

  // Filter pools with < 50% fill rate
  for (const pool of lowFillPools) {
    const fillRate = (pool.currentMemberCount / pool.maxCandidates) * 100
    if (fillRate < 50) {
      alerts.push({
        id: `pool-${pool.id}`,
        type: 'CRITICAL',
        category: 'Exam Pool',
        message: `Pool "${pool.name}" is only ${Math.round(fillRate)}% full with deadline approaching.`,
        date: pool.event?.joinDeadline,
      })
    }
  }

  // Stale payments
  for (const payment of stalePayments) {
    alerts.push({
      id: `payment-${payment.id}`,
      type: 'WARNING',
      category: 'Finance',
      message: `Payment from ${payment.user.profile?.firstName || 'User'} is stale (> 48h).`,
      date: payment.createdAt,
    })
  }

  return alerts.sort((a, b) => (a.date && b.date ? a.date.getTime() - b.date.getTime() : 0))
}
