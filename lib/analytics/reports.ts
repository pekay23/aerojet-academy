import { unstable_cache } from 'next/cache'
import { prismaUnfiltered as prisma } from '@/lib/prisma/client'
import { subDays } from 'date-fns'
import { EnrollmentStatus } from '@prisma/client'

/** Build a Prisma { gte, lt } range from optional year + month */
function buildDateRange(year?: number, month?: number) {
  if (!year) return undefined
  if (month) {
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 1)
    return { gte: start, lt: end }
  }
  return { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) }
}

export const getEnrollmentTrends = unstable_cache(
  async () => {
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
  },
  ['reports-enrollment-trends'],
  { revalidate: 300, tags: ['reports', 'enrollment'] }
)

export const getRevenueReport = unstable_cache(
  async () => {
    const recentPayments = await prisma.payment.findMany({
      where: { status: 'APPROVED' },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      include: {
        user: { include: { profile: true } },
      },
    })

    // Group revenue by month for chart (last 6 months) via SQL GROUP BY
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthBuckets = await getMonthlyRevenueByUpdatedAt(sixMonthsAgo, new Date())

    const monthlyRevenue: Record<string, number> = {}
    monthBuckets.forEach((b) => {
      const month = new Date(b.month).toLocaleString('default', { month: 'short' })
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + Number(b.revenue)
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
  },
  ['reports-revenue'],
  { revalidate: 300, tags: ['reports', 'revenue'] }
)

export const getPoolAnalytics = unstable_cache(
  async () => {
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
  },
  ['reports-pool-analytics'],
  { revalidate: 300, tags: ['reports', 'pools'] }
)

export const getAttendanceReport = unstable_cache(
  async () => {
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
  },
  ['reports-attendance'],
  { revalidate: 300, tags: ['reports', 'attendance'] }
)

// ============================================================================
// FINANCE REPORTS
// ============================================================================

/** Aggregated monthly approved-payment revenue via a single SQL GROUP BY. */
interface MonthlyApprovedRevenue {
  month: Date
  revenue: number
  count: number
}

export async function getMonthlyApprovedRevenue(
  from: Date,
  to: Date
): Promise<MonthlyApprovedRevenue[]> {
  return prisma.$queryRaw<MonthlyApprovedRevenue[]>`
    SELECT
      DATE_TRUNC('month', "approvedAt") AS "month",
      COALESCE(SUM("amount")::float8, 0) AS "revenue",
      COUNT(*)::int AS "count"
    FROM "payments"
    WHERE "status" = 'APPROVED'
      AND "approvedAt" >= ${from}
      AND "approvedAt" < ${to}
    GROUP BY DATE_TRUNC('month', "approvedAt")
    ORDER BY "month" ASC
  `
}

/** Aggregated monthly approved-payment revenue keyed on updatedAt (used by the revenue report chart). */
interface MonthlyUpdatedRevenue {
  month: Date
  revenue: number
  count: number
}

async function getMonthlyRevenueByUpdatedAt(
  from: Date,
  to: Date
): Promise<MonthlyUpdatedRevenue[]> {
  return prisma.$queryRaw<MonthlyUpdatedRevenue[]>`
    SELECT
      DATE_TRUNC('month', "updatedAt") AS "month",
      COALESCE(SUM("amount")::float8, 0) AS "revenue",
      COUNT(*)::int AS "count"
    FROM "payments"
    WHERE "status" = 'APPROVED'
      AND "updatedAt" >= ${from}
      AND "updatedAt" < ${to}
    GROUP BY DATE_TRUNC('month', "updatedAt")
    ORDER BY "month" ASC
  `
}

export const getFinanceReportSummary = (filters?: { year?: number; month?: number }) =>
  unstable_cache(
    async () => {
      const now = new Date()
      const targetYear = filters?.year ?? now.getFullYear()
      const targetMonth = filters?.month ?? now.getMonth() + 1 // 1-indexed

      const startOfSelectedMonth = new Date(targetYear, targetMonth - 1, 1)
      const endOfSelectedMonth = new Date(targetYear, targetMonth, 1)
      const startOfSelectedYear = new Date(targetYear, 0, 1)
      const endOfSelectedYear = new Date(targetYear + 1, 0, 1)

      // Build a year-scoped date filter for aggregate queries
      const yearDateFilter = { gte: startOfSelectedYear, lt: endOfSelectedYear }

      // Total revenue for the selected year
      const totalRevenueResult = await prisma.payment.aggregate({
        where: { status: 'APPROVED', approvedAt: yearDateFilter },
        _sum: { amount: true },
        _count: { id: true },
      })

      // Revenue for the selected month
      const monthRevenueResult = await prisma.payment.aggregate({
        where: {
          status: 'APPROVED',
          approvedAt: { gte: startOfSelectedMonth, lt: endOfSelectedMonth },
        },
        _sum: { amount: true },
        _count: { id: true },
      })

      // Revenue for the selected year
      const yearRevenueResult = await prisma.payment.aggregate({
        where: {
          status: 'APPROVED',
          approvedAt: yearDateFilter,
        },
        _sum: { amount: true },
        _count: { id: true },
      })

      // Pending payments total (always current — not time-scoped)
      const pendingResult = await prisma.payment.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
        _count: { id: true },
      })

      // Rejected/Failed within the selected year
      const rejectedResult = await prisma.payment.aggregate({
        where: { status: { in: ['REJECTED', 'FAILED'] }, approvedAt: yearDateFilter },
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
        filterYear: targetYear,
        filterMonth: targetMonth,
      }
    },
    ['reports-finance-summary', String(filters?.year ?? 'default'), String(filters?.month ?? 'default')],
    { revalidate: 300, tags: ['reports', 'finance'] }
  )()

export const getRevenueByProgrammeType = (filters?: { year?: number; month?: number }) =>
  unstable_cache(
    async () => {
      const dateFilter = buildDateRange(filters?.year, filters?.month)

      // Full-time programme payments (via payment milestones)
      const fullTimePayments = await prisma.paymentMilestone.findMany({
        where: { status: 'PAID', ...(dateFilter && { paidAt: dateFilter }) },
        include: {
          enrollment: {
            include: { programme: true },
          },
        },
      })

      const fullTimeRevenue = fullTimePayments.reduce((sum, pm) => sum + Number(pm.amountDue || 0), 0)

      // Modular enrollments
      const modularEnrollments = await prisma.modularEnrollment.findMany({
        where: {
          status: { in: [EnrollmentStatus.APPROVED, EnrollmentStatus.ACTIVE, EnrollmentStatus.GRADUATED] },
          ...(dateFilter && { createdAt: dateFilter }),
        },
      })
      const modularRevenue = modularEnrollments.reduce((sum, e) => sum + Number(e.amountPaid || 0), 0)

      // Pool/Exam payments (captured from memberships)
      const poolPayments = await prisma.poolMembership.findMany({
        where: {
          status: { in: ['CONFIRMED', 'COMPLETED'] },
          ...(dateFilter && { joinedAt: dateFilter }),
        },
      })
      const poolRevenue = poolPayments.reduce((sum, pm) => sum + Number(pm.amountPaid || 0), 0)

      // Individual exam bookings
      const examBookings = await prisma.examBooking.findMany({
        where: {
          status: 'COMPLETED',
          ...(dateFilter && { bookedAt: dateFilter }),
        },
      })
      const examRevenue = examBookings.reduce((sum, eb) => sum + Number(eb.amountPaid || 0), 0)

      // Registration fees
      const registrationPayments = await prisma.payment.findMany({
        where: {
          status: 'APPROVED',
          referenceType: 'REGISTRATION',
          ...(dateFilter && { approvedAt: dateFilter }),
        },
      })
      const registrationRevenue = registrationPayments.reduce(
        (sum, p) => sum + Number(p.amount || 0),
        0
      )

      // Wallet top-ups (via wallet transactions)
      const walletTopups = await prisma.walletTransaction.findMany({
        where: {
          type: 'TOP_UP',
          ...(dateFilter && { createdAt: dateFilter }),
        },
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
    },
    ['reports-revenue-by-programme', String(filters?.year ?? 'default'), String(filters?.month ?? 'default')],
    { revalidate: 300, tags: ['reports', 'finance'] }
  )()

export const getPaymentMethodBreakdown = unstable_cache(
  async () => {
    const grouped = await prisma.payment.groupBy({
      by: ['paymentMethod'],
      where: { status: 'APPROVED' },
      _count: { id: true },
      _sum: { amount: true },
    })

    const total = grouped.reduce((sum, g) => sum + Number(g._sum.amount ?? 0), 0)

    return grouped
      .map((g) => {
        const amount = Number(g._sum.amount ?? 0)
        return {
          method: g.paymentMethod || 'UNKNOWN',
          count: g._count.id,
          amount,
          percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
        }
      })
      .sort((a, b) => b.amount - a.amount)
  },
  ['reports-payment-method'],
  { revalidate: 300, tags: ['reports', 'finance'] }
)

export const getMonthlyRevenueData = (filters?: { year?: number }) =>
  unstable_cache(
    async () => {
      const now = new Date()
      const targetYear = filters?.year ?? now.getFullYear()

      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ]

      const startOfYear = new Date(targetYear, 0, 1)
      const endOfYear = new Date(targetYear + 1, 0, 1)

      // Initialize all 12 months of the selected year
      const monthlyData: Record<string, { month: string; revenue: number; count: number }> = {}
      for (let m = 0; m < 12; m++) {
        const key = `${monthNames[m]} ${targetYear}`
        monthlyData[key] = { month: key, revenue: 0, count: 0 }
      }

      // Aggregate approved-payment revenue by month in SQL (no in-memory row loading)
      const buckets = await getMonthlyApprovedRevenue(startOfYear, endOfYear)
      for (const bucket of buckets) {
        const d = new Date(bucket.month)
        const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`
        if (monthlyData[key]) {
          monthlyData[key].revenue = Number(bucket.revenue)
          monthlyData[key].count = Number(bucket.count)
        }
      }

      return Object.values(monthlyData)
    },
    ['reports-monthly-revenue', String(filters?.year ?? 'default')],
    { revalidate: 300, tags: ['reports', 'finance'] }
  )()

export const getPaymentStatusBreakdown = (filters?: { year?: number; month?: number }) =>
  unstable_cache(
    async () => {
      const dateFilter = buildDateRange(filters?.year, filters?.month)

      const statusCounts = await prisma.payment.groupBy({
        by: ['status'],
        where: dateFilter ? { createdAt: dateFilter } : undefined,
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
    },
    ['reports-payment-status', String(filters?.year ?? 'default'), String(filters?.month ?? 'default')],
    { revalidate: 300, tags: ['reports', 'finance'] }
  )()

export const getCriticalAlerts = unstable_cache(
  async () => {
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
  },
  ['reports-critical-alerts'],
  { revalidate: 300, tags: ['reports', 'finance'] }
)

// ============================================================================
// EXAM ANALYTICS
// ============================================================================

export const getExamAnalytics = unstable_cache(
  async () => {
    // Fetch bookings for operational volume and ExamResult rows for graded outcomes.
    const [allBookings, allResults] = await Promise.all([
      prisma.examBooking.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          userId: true,
          result: true,
          attemptType: true,
          examCategory: true,
          status: true,
          demandStatus: true,
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
          userId: true,
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
    const resultKeys = new Set(
      allResults.map((result) => `${result.userId}:${(result.moduleCode || 'UNKNOWN').toUpperCase()}`)
    )

    const normalizeAttempt = (attempt?: string | null) => {
      const normalized = (attempt || 'FIRST').toUpperCase()
      if (['FIRST', 'FIRST_ATTEMPT', 'INITIAL'].includes(normalized)) return 'FIRST'
      if (['RESIT_1', 'FIRST_RESIT', 'RESIT'].includes(normalized)) return 'RESIT_1'
      if (['RESIT_2', 'SECOND_RESIT'].includes(normalized)) return 'RESIT_2'
      return 'RESIT_3'
    }

    const gradedRecords = [
      ...allResults.map((result) => ({
        id: `result-${result.id}`,
        passed: result.passed,
        failed: !result.passed,
        attemptType: normalizeAttempt(result.attemptType),
        examCategory: result.examCategory,
        moduleCode: (result.moduleCode || 'UNKNOWN').toUpperCase(),
        score:
          result.score != null
            ? Number(result.score)
            : result.percentage != null
              ? Number(result.percentage)
              : null,
        date: result.createdAt,
      })),
      ...allBookings
        .filter((booking) => {
          const key = `${booking.userId}:${(booking.moduleCode || 'UNKNOWN').toUpperCase()}`
          const result = booking.result?.toLowerCase()
          return !resultKeys.has(key) && (result === 'pass' || result === 'fail')
        })
        .map((booking) => {
          const result = booking.result?.toLowerCase()
          return {
            id: `booking-${booking.id}`,
            passed: result === 'pass',
            failed: result === 'fail',
            attemptType: normalizeAttempt(booking.attemptType),
            examCategory: booking.examCategory,
            moduleCode: (booking.moduleCode || 'UNKNOWN').toUpperCase(),
            score:
              booking.score != null
                ? Number(booking.score)
                : booking.percentage != null
                  ? Number(booking.percentage)
                  : null,
            date: booking.examDate || booking.createdAt,
          }
        }),
    ]

    // === Core Stats ===
    const stats = {
      total: gradedRecords.length,
      bookings: totalBookings,
      passed: 0,
      failed: 0,
      awaitingGrading: 0,
      pendingScheduling: 0,
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

    allBookings.forEach((booking) => {
      const hasBookingResult = ['pass', 'fail'].includes(booking.result?.toLowerCase() || '')
      if (!hasBookingResult && booking.status === 'COMPLETED') stats.awaitingGrading++
      if (
        !hasBookingResult &&
        booking.status !== 'COMPLETED' &&
        ['DEMAND_CAPTURED', 'POOLED', 'ROLLED_FORWARD'].includes(String(booking.demandStatus || ''))
      ) {
        stats.pendingScheduling++
      }

      const examMonth = booking.examDate ? new Date(booking.examDate) : new Date(booking.createdAt)
      const monthKey = `${monthNames[examMonth.getMonth()]} ${examMonth.getFullYear()}`
      if (monthlyVolume[monthKey]) {
        monthlyVolume[monthKey].exams++
      }
    })

    gradedRecords.forEach((exam) => {
      const isEasa = exam.examCategory === 'OFFICIAL_EASA'
      const moduleCode = exam.moduleCode
      const attempt = exam.attemptType as keyof typeof stats.attempts
      const isFirst = attempt === 'FIRST'
      const hasPassed = exam.passed
      const hasFailed = exam.failed

      // Global metrics
      if (hasPassed) stats.passed++
      if (hasFailed) stats.failed++

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
      if (exam.score !== null) {
        mod.scores.push(exam.score)
        if (exam.score <= 25) scoreDistribution['0-25']++
        else if (exam.score <= 50) scoreDistribution['26-50']++
        else if (exam.score <= 74) scoreDistribution['51-74']++
        else scoreDistribution['75-100']++
      }

      // Monthly graded outcomes
      const examMonth = new Date(exam.date)
      const monthKey = `${monthNames[examMonth.getMonth()]} ${examMonth.getFullYear()}`
      if (monthlyVolume[monthKey]) {
        if (hasPassed) monthlyVolume[monthKey].passes++
        if (hasFailed) monthlyVolume[monthKey].fails++
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
      passPercentage: stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0,
      failPercentage: stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0,
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
      resit1PassRate: stats.attempts.RESIT_1 > 0 ? Math.round((gradedRecords.filter(b => b.attemptType === 'RESIT_1' && b.passed).length / stats.attempts.RESIT_1) * 100) : 0,
      resit2PassRate: stats.attempts.RESIT_2 > 0 ? Math.round((gradedRecords.filter(b => b.attemptType === 'RESIT_2' && b.passed).length / stats.attempts.RESIT_2) * 100) : 0,
      resit3PassRate: stats.attempts.RESIT_3 > 0 ? Math.round((gradedRecords.filter(b => b.attemptType === 'RESIT_3' && b.passed).length / stats.attempts.RESIT_3) * 100) : 0,
      scoreDistribution,
      monthlyTrend: Object.values(monthlyVolume),
      hardestModules,
      easiestModules,
      totalResults,
    }
  },
  ['reports-exam-analytics'],
  { revalidate: 300, tags: ['reports', 'exam'] }
)

// ============================================================================
// YEAR-OVER-YEAR COMPARISON
// ============================================================================

export const getYoYComparison = (baseYear?: number) =>
  unstable_cache(
    async () => {
      const now = new Date()
      const currentYear = baseYear ?? now.getFullYear()
      const previousYear = currentYear - 1

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

      const startCurrent = new Date(currentYear, 0, 1)
      const endCurrent = new Date(currentYear + 1, 0, 1)
      const startPrevious = new Date(previousYear, 0, 1)
      const endPrevious = new Date(currentYear, 0, 1)

      // Fetch all data in parallel
      const [
        currentPayments,
        previousPayments,
        currentEnrollments,
        previousEnrollments,
        currentResults,
        previousResults,
        currentStudents,
        previousStudents,
      ] = await Promise.all([
        prisma.payment.findMany({
          where: { status: 'APPROVED', approvedAt: { gte: startCurrent, lt: endCurrent } },
          select: { amount: true, approvedAt: true },
        }),
        prisma.payment.findMany({
          where: { status: 'APPROVED', approvedAt: { gte: startPrevious, lt: endPrevious } },
          select: { amount: true, approvedAt: true },
        }),
        prisma.enrollment.findMany({
          where: { status: 'ENROLLED', enrolledAt: { gte: startCurrent, lt: endCurrent } },
          select: { enrolledAt: true },
        }),
        prisma.enrollment.findMany({
          where: { status: 'ENROLLED', enrolledAt: { gte: startPrevious, lt: endPrevious } },
          select: { enrolledAt: true },
        }),
        prisma.examResult.findMany({
          where: { createdAt: { gte: startCurrent, lt: endCurrent } },
          select: { passed: true, createdAt: true },
        }),
        prisma.examResult.findMany({
          where: { createdAt: { gte: startPrevious, lt: endPrevious } },
          select: { passed: true, createdAt: true },
        }),
        prisma.studentProfile.findMany({
          where: { createdAt: { gte: startCurrent, lt: endCurrent } },
          select: { createdAt: true },
        }),
        prisma.studentProfile.findMany({
          where: { createdAt: { gte: startPrevious, lt: endPrevious } },
          select: { createdAt: true },
        }),
      ])

      // Helper: build empty 12-month buckets
      function emptyMonths(): Record<number, { revenue: number; enrollments: number; examTotal: number; examPassed: number; newStudents: number }> {
        const m: Record<number, { revenue: number; enrollments: number; examTotal: number; examPassed: number; newStudents: number }> = {}
        for (let i = 0; i < 12; i++) m[i] = { revenue: 0, enrollments: 0, examTotal: 0, examPassed: 0, newStudents: 0 }
        return m
      }

      const cur = emptyMonths()
      const prev = emptyMonths()

      currentPayments.forEach((p) => { if (p.approvedAt) cur[new Date(p.approvedAt).getMonth()].revenue += Number(p.amount) })
      previousPayments.forEach((p) => { if (p.approvedAt) prev[new Date(p.approvedAt).getMonth()].revenue += Number(p.amount) })
      currentEnrollments.forEach((e) => { cur[new Date(e.enrolledAt).getMonth()].enrollments++ })
      previousEnrollments.forEach((e) => { prev[new Date(e.enrolledAt).getMonth()].enrollments++ })
      currentResults.forEach((r) => { const m = cur[new Date(r.createdAt).getMonth()]; m.examTotal++; if (r.passed) m.examPassed++ })
      previousResults.forEach((r) => { const m = prev[new Date(r.createdAt).getMonth()]; m.examTotal++; if (r.passed) m.examPassed++ })
      currentStudents.forEach((s) => { cur[new Date(s.createdAt).getMonth()].newStudents++ })
      previousStudents.forEach((s) => { prev[new Date(s.createdAt).getMonth()].newStudents++ })

      const monthlyData = monthNames.map((name, i) => ({
        month: name,
        [`${currentYear}_revenue`]: cur[i].revenue,
        [`${previousYear}_revenue`]: prev[i].revenue,
        [`${currentYear}_enrollments`]: cur[i].enrollments,
        [`${previousYear}_enrollments`]: prev[i].enrollments,
        [`${currentYear}_passRate`]: cur[i].examTotal > 0 ? Math.round((cur[i].examPassed / cur[i].examTotal) * 100) : 0,
        [`${previousYear}_passRate`]: prev[i].examTotal > 0 ? Math.round((prev[i].examPassed / prev[i].examTotal) * 100) : 0,
        [`${currentYear}_newStudents`]: cur[i].newStudents,
        [`${previousYear}_newStudents`]: prev[i].newStudents,
      }))

      // Annual totals
      const totals = {
        currentYear,
        previousYear,
        current: {
          revenue: currentPayments.reduce((s, p) => s + Number(p.amount), 0),
          enrollments: currentEnrollments.length,
          newStudents: currentStudents.length,
          passRate: currentResults.length > 0
            ? Math.round((currentResults.filter(r => r.passed).length / currentResults.length) * 100)
            : 0,
        },
        previous: {
          revenue: previousPayments.reduce((s, p) => s + Number(p.amount), 0),
          enrollments: previousEnrollments.length,
          newStudents: previousStudents.length,
          passRate: previousResults.length > 0
            ? Math.round((previousResults.filter(r => r.passed).length / previousResults.length) * 100)
            : 0,
        },
      }

      return { monthlyData, totals, currentYear, previousYear }
    },
    ['reports-yoy-comparison', String(baseYear ?? 'default')],
    { revalidate: 3600, tags: ['reports', 'yoy'] }
  )()
