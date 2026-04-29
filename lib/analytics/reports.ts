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

// ============================================================================
// EXAM ANALYTICS
// ============================================================================

export async function getExamAnalytics() {
  // Fetch both bookings and results for comprehensive data
  const [allBookings, allResults] = await Promise.all([
    prisma.examBooking.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        result: true,
        attemptType: true,
        examCategory: true,
        status: true,
        moduleCode: true,
        score: true,
        percentage: true,
        examDate: true,
        createdAt: true,
      },
    }),
    prisma.examResult.findMany({
      select: {
        id: true,
        passed: true,
        attemptType: true,
        examCategory: true,
        moduleCode: true,
        score: true,
        percentage: true,
        createdAt: true,
      },
    }),
  ])

  const totalBookings = allBookings.length
  const totalResults = allResults.length

  // === Core Stats from bookings ===
  const stats = {
    total: totalBookings,
    passed: 0,
    failed: 0,
    awaitingGrading: 0,
    easa: { total: 0, passed: 0, failed: 0 },
    internal: { total: 0, passed: 0, failed: 0 },
    attempts: {
      FIRST: 0,
      RESIT_1: 0,
      RESIT_2: 0,
      RESIT_3: 0,
    },
  }

  // === First-attempt vs Resit pass rates ===
  let firstAttemptPass = 0
  let firstAttemptTotal = 0
  let resitPass = 0
  let resitTotal = 0

  // === Per-module breakdown ===
  const moduleMap = new Map<
    string,
    { total: number; passed: number; failed: number; scores: number[] }
  >()

  // === Score distribution buckets ===
  const scoreDistribution = {
    '0-25': 0,
    '26-50': 0,
    '51-74': 0,
    '75-100': 0,
  }

  // === Monthly exam volume (last 12 months) ===
  const now = new Date()
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthlyVolume: Record<string, { month: string; exams: number; passes: number; fails: number }> = {}
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`
    monthlyVolume[key] = { month: key, exams: 0, passes: 0, fails: 0 }
  }

  allBookings.forEach((exam) => {
    const res = exam.result?.toLowerCase()
    const isEasa = exam.examCategory === 'OFFICIAL_EASA'
    const moduleCode = (exam.moduleCode || 'UNKNOWN').toUpperCase()
    const attempt = (exam.attemptType || 'FIRST') as keyof typeof stats.attempts
    const isFirst = attempt === 'FIRST'
    const hasPassed = res === 'pass'
    const hasFailed = res === 'fail'

    // Global metrics
    if (hasPassed) stats.passed++
    else if (hasFailed) stats.failed++
    else if (exam.status === 'COMPLETED') stats.awaitingGrading++

    // Category metrics
    const cat = isEasa ? stats.easa : stats.internal
    cat.total++
    if (hasPassed) cat.passed++
    else if (hasFailed) cat.failed++

    // Attempts
    if (stats.attempts[attempt] !== undefined) {
      stats.attempts[attempt]++
    } else {
      stats.attempts.RESIT_3++ // Fallback for unknown attempt types
    }

    // First-attempt vs resit pass rates
    if (hasPassed || hasFailed) {
      if (isFirst) {
        firstAttemptTotal++
        if (hasPassed) firstAttemptPass++
      } else {
        resitTotal++
        if (hasPassed) resitPass++
      }
    }

    // Per-module breakdown
    if (!moduleMap.has(moduleCode)) {
      moduleMap.set(moduleCode, { total: 0, passed: 0, failed: 0, scores: [] })
    }
    const mod = moduleMap.get(moduleCode)!
    mod.total++
    if (hasPassed) mod.passed++
    if (hasFailed) mod.failed++

    // Score distribution
    const scoreVal = exam.score != null ? Number(exam.score) : (exam.percentage != null ? Number(exam.percentage) : null)
    if (scoreVal !== null) {
      mod.scores.push(scoreVal)
      if (scoreVal <= 25) scoreDistribution['0-25']++
      else if (scoreVal <= 50) scoreDistribution['26-50']++
      else if (scoreVal <= 74) scoreDistribution['51-74']++
      else scoreDistribution['75-100']++
    }

    // Monthly volume
    const examMonth = exam.examDate ? new Date(exam.examDate) : new Date(exam.createdAt)
    const monthKey = `${monthNames[examMonth.getMonth()]} ${examMonth.getFullYear()}`
    if (monthlyVolume[monthKey]) {
      monthlyVolume[monthKey].exams++
      if (hasPassed) monthlyVolume[monthKey].passes++
      if (hasFailed) monthlyVolume[monthKey].fails++
    }
  })

  // Also fold in ExamResult data for score distributions where bookings have no scores
  allResults.forEach((r) => {
    const scoreVal = r.score != null ? Number(r.score) : (r.percentage != null ? Number(r.percentage) : null)
    const moduleCode = (r.moduleCode || 'UNKNOWN').toUpperCase()
    if (scoreVal !== null && !moduleMap.get(moduleCode)?.scores.includes(scoreVal)) {
      if (scoreVal <= 25) scoreDistribution['0-25']++
      else if (scoreVal <= 50) scoreDistribution['26-50']++
      else if (scoreVal <= 74) scoreDistribution['51-74']++
      else scoreDistribution['75-100']++
    }
  })

  // Build per-module stats sorted by pass rate (ascending = hardest first)
  const moduleStats = Array.from(moduleMap.entries())
    .filter(([_, m]) => m.total >= 1)
    .map(([code, m]) => {
      const avgScore =
        m.scores.length > 0
          ? Math.round(m.scores.reduce((a, b) => a + b, 0) / m.scores.length)
          : null
      return {
        moduleCode: code,
        total: m.total,
        passed: m.passed,
        failed: m.failed,
        passRate: m.total > 0 ? Math.round((m.passed / m.total) * 100) : 0,
        avgScore,
      }
    })
    .sort((a, b) => a.passRate - b.passRate)

  const hardestModules = moduleStats.slice(0, 8)
  const easiestModules = [...moduleStats].sort((a, b) => b.passRate - a.passRate).slice(0, 8)

  return {
    ...stats,
    passPercentage: totalBookings > 0 ? Math.round((stats.passed / totalBookings) * 100) : 0,
    failPercentage: totalBookings > 0 ? Math.round((stats.failed / totalBookings) * 100) : 0,
    easaPassRate: stats.easa.total > 0 ? Math.round((stats.easa.passed / stats.easa.total) * 100) : 0,
    internalPassRate: stats.internal.total > 0 ? Math.round((stats.internal.passed / stats.internal.total) * 100) : 0,
    // New enhanced data
    firstAttemptPassRate: firstAttemptTotal > 0 ? Math.round((firstAttemptPass / firstAttemptTotal) * 100) : 0,
    firstAttemptTotal,
    firstAttemptPass,
    resitPassRate: resitTotal > 0 ? Math.round((resitPass / resitTotal) * 100) : 0,
    resitTotal,
    resitPass,
    // Resit specific pass rates
    resit1PassRate: stats.attempts.RESIT_1 > 0 ? Math.round((allBookings.filter(b => b.attemptType === 'RESIT_1' && b.result?.toLowerCase() === 'pass').length / stats.attempts.RESIT_1) * 100) : 0,
    resit2PassRate: stats.attempts.RESIT_2 > 0 ? Math.round((allBookings.filter(b => b.attemptType === 'RESIT_2' && b.result?.toLowerCase() === 'pass').length / stats.attempts.RESIT_2) * 100) : 0,
    resit3PassRate: stats.attempts.RESIT_3 > 0 ? Math.round((allBookings.filter(b => b.attemptType === 'RESIT_3' && b.result?.toLowerCase() === 'pass').length / stats.attempts.RESIT_3) * 100) : 0,
    scoreDistribution,
    monthlyTrend: Object.values(monthlyVolume),
    hardestModules,
    easiestModules,
    totalResults,
  }
}

