import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import {
  getEnrollmentTrends,
  getRevenueReport,
  getPoolAnalytics,
  getAttendanceReport,
  getFinanceReportSummary,
  getRevenueByProgrammeType,
  getPaymentMethodBreakdown,
  getMonthlyRevenueData,
  getPaymentStatusBreakdown,
  getCriticalAlerts,
  getExamAnalytics,
  getYoYComparison,
} from '@/lib/analytics/reports'

describe('Analytics Reports', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── getEnrollmentTrends ─────────────────────────────────────────
  describe('getEnrollmentTrends', () => {
    it('returns enrollment counts per course', async () => {
      prismaMock.enrollment.groupBy.mockResolvedValue([
        { courseId: 'c1', _count: { userId: 40 } },
        { courseId: 'c2', _count: { userId: 25 } },
      ])
      prismaMock.course.findMany.mockResolvedValue([
        { id: 'c1', name: 'ATPL', code: 'ATPL' },
        { id: 'c2', name: 'CPL', code: 'CPL' },
      ])

      const result = await getEnrollmentTrends()

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        courseName: 'ATPL',
        courseCode: 'ATPL',
        count: 40,
      })
      expect(result[1].courseName).toBe('CPL')
    })

    it('falls back to Unknown Course when course is missing', async () => {
      prismaMock.enrollment.groupBy.mockResolvedValue([
        { courseId: 'missing', _count: { userId: 5 } },
      ])
      prismaMock.course.findMany.mockResolvedValue([])

      const result = await getEnrollmentTrends()

      expect(result[0].courseName).toBe('Unknown Course')
      expect(result[0].courseCode).toBe('N/A')
    })
  })

  // ─── getRevenueReport ────────────────────────────────────────────
  describe('getRevenueReport', () => {
    it('returns recent payments, chart data, and total revenue', async () => {
      const now = new Date()
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)

      prismaMock.payment.findMany
        .mockResolvedValueOnce([
          { id: 'p1', amount: 1000, updatedAt: now, user: { profile: { firstName: 'John' } } },
        ])

      prismaMock.$queryRaw.mockResolvedValue([
        { month: new Date(now.getFullYear(), now.getMonth(), 1), revenue: 500, count: 1 },
        { month: new Date(now.getFullYear(), now.getMonth() - 1, 1), revenue: 1500, count: 1 },
      ])

      prismaMock.payment.aggregate.mockResolvedValue({ _sum: { amount: 100000 } })

      const result = await getRevenueReport()

      expect(result.recentPayments).toHaveLength(1)
      expect(result.recentPayments[0].id).toBe('p1')
      expect(result.totalRevenue).toBe(100000)
      expect(result.chartData.length).toBeGreaterThanOrEqual(0)
    })
  })

  // ─── getPoolAnalytics ────────────────────────────────────────────
  describe('getPoolAnalytics', () => {
    it('returns pools with fill percentages', async () => {
      prismaMock.examPool.findMany.mockResolvedValue([
        { id: 'pool-1', name: 'P1', currentMemberCount: 20, maxCandidates: 25, event: { name: 'E1' } },
        { id: 'pool-2', name: 'P2', currentMemberCount: 10, maxCandidates: 25, event: { name: 'E2' } },
      ])

      const result = await getPoolAnalytics()

      expect(result.pools).toHaveLength(2)
      expect(result.chartData[0].fill).toBe(80) // 20/25
      expect(result.chartData[1].fill).toBe(40) // 10/25
    })
  })

  // ─── getAttendanceReport ─────────────────────────────────────────
  describe('getAttendanceReport', () => {
    it('returns recent records and status breakdown', async () => {
      prismaMock.attendanceRecord.findMany.mockResolvedValue([
        { id: 'a1', status: 'PRESENT', date: new Date(), user: { profile: { firstName: 'John' } }, class: { name: 'C1' } },
      ])
      prismaMock.attendanceRecord.groupBy.mockResolvedValue([
        { status: 'PRESENT', _count: { id: 80 } },
        { status: 'ABSENT', _count: { id: 20 } },
      ])

      const result = await getAttendanceReport()

      expect(result.records).toHaveLength(1)
      expect(result.chartData).toHaveLength(2)
      expect(result.chartData[0]).toEqual({ name: 'PRESENT', value: 80 })
    })
  })

  // ─── getFinanceReportSummary ─────────────────────────────────────
  describe('getFinanceReportSummary', () => {
    it('returns monthly and yearly revenue breakdown', async () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1

      const startOfMonth = new Date(year, month - 1, 1)
      const endOfMonth = new Date(year, month, 1)
      const startOfYear = new Date(year, 0, 1)
      const endOfYear = new Date(year + 1, 0, 1)

      prismaMock.payment.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 120000 }, _count: { id: 100 } }) // totalRevenue year
        .mockResolvedValueOnce({ _sum: { amount: 10000 }, _count: { id: 8 } }) // monthRevenue
        .mockResolvedValueOnce({ _sum: { amount: 120000 }, _count: { id: 100 } }) // yearRevenue
        .mockResolvedValueOnce({ _sum: { amount: 5000 }, _count: { id: 12 } }) // pending
        .mockResolvedValueOnce({ _sum: { amount: 2000 }, _count: { id: 3 } }) // rejected

      const result = await getFinanceReportSummary()

      expect(result.totalRevenue).toBe(120000)
      expect(result.totalCount).toBe(100)
      expect(result.avgTransactionValue).toBe(1200)
      expect(result.revenueThisMonth).toBe(10000)
      expect(result.monthCount).toBe(8)
      expect(result.pendingAmount).toBe(5000)
      expect(result.filterYear).toBe(year)
      expect(result.filterMonth).toBe(month)
    })
  })

  // ─── getRevenueByProgrammeType ───────────────────────────────────
  describe('getRevenueByProgrammeType', () => {
    it('returns revenue breakdown by programme', async () => {
      prismaMock.paymentMilestone.findMany.mockResolvedValue([
        { amountDue: 5000, enrollment: { programme: { name: 'FT' } } },
      ])
      prismaMock.modularEnrollment.findMany.mockResolvedValue([
        { amountPaid: 2000 },
      ])
      prismaMock.poolMembership.findMany.mockResolvedValue([
        { amountPaid: 1500 },
      ])
      prismaMock.examBooking.findMany.mockResolvedValue([
        { amountPaid: 300 },
      ])
      prismaMock.payment.findMany.mockResolvedValue([
        { amount: 1000, referenceType: 'REGISTRATION' },
      ])
      prismaMock.walletTransaction.findMany.mockResolvedValue([
        { amount: 500, type: 'TOP_UP' },
      ])

      const result = await getRevenueByProgrammeType()

      expect(result).toHaveLength(6)
      expect(result[0].name).toBe('Full-Time Programmes')
      expect(result[0].value).toBe(5000)
      expect(result[4].name).toBe('Registration Fees')
      expect(result[4].value).toBe(1000)
    })

    it('returns 0 percentage when total revenue is 0', async () => {
      prismaMock.paymentMilestone.findMany.mockResolvedValue([])
      prismaMock.modularEnrollment.findMany.mockResolvedValue([])
      prismaMock.poolMembership.findMany.mockResolvedValue([])
      prismaMock.examBooking.findMany.mockResolvedValue([])
      prismaMock.payment.findMany.mockResolvedValue([])
      prismaMock.walletTransaction.findMany.mockResolvedValue([])

      const result = await getRevenueByProgrammeType()

      expect(result.every((item) => item.value === 0 && item.percentage === 0)).toBe(true)
    })
  })

  // ─── getPaymentMethodBreakdown ───────────────────────────────────
  describe('getPaymentMethodBreakdown', () => {
    it('returns breakdown by payment method', async () => {
      prismaMock.payment.groupBy.mockResolvedValue([
        { paymentMethod: 'BANK_TRANSFER', _count: { id: 2 }, _sum: { amount: 1500 } },
        { paymentMethod: 'CASH', _count: { id: 1 }, _sum: { amount: 300 } },
      ])

      const result = await getPaymentMethodBreakdown()

      expect(result).toHaveLength(2)
      expect(result[0].method).toBe('BANK_TRANSFER')
      expect(result[0].count).toBe(2)
      expect(result[0].amount).toBe(1500)
      expect(result[1].method).toBe('CASH')
      expect(result[1].amount).toBe(300)
    })

    it('groups unknown methods under UNKNOWN', async () => {
      prismaMock.payment.groupBy.mockResolvedValue([
        { paymentMethod: null, _count: { id: 1 }, _sum: { amount: 100 } },
      ])

      const result = await getPaymentMethodBreakdown()

      expect(result[0].method).toBe('UNKNOWN')
      expect(result[0].amount).toBe(100)
    })
  })

  // ─── getMonthlyRevenueData ───────────────────────────────────────
  describe('getMonthlyRevenueData', () => {
    it('returns 12 months of data with revenue and counts', async () => {
      const now = new Date()
      const startOfYear = new Date(now.getFullYear(), 0, 1)
      const endOfYear = new Date(now.getFullYear() + 1, 0, 1)

      prismaMock.$queryRaw.mockResolvedValue([
        { month: new Date(now.getFullYear(), 0, 15), revenue: 1000, count: 1 },
        { month: new Date(now.getFullYear(), 5, 20), revenue: 2000, count: 1 },
      ])

      const result = await getMonthlyRevenueData()

      expect(result).toHaveLength(12)
      expect(result[0].month).toBe(`Jan ${now.getFullYear()}`)
      expect(result[0].revenue).toBe(1000)
      expect(result[0].count).toBe(1)
      expect(result[5].month).toBe(`Jun ${now.getFullYear()}`)
      expect(result[5].revenue).toBe(2000)
    })
  })

  // ─── getPaymentStatusBreakdown ───────────────────────────────────
  describe('getPaymentStatusBreakdown', () => {
    it('returns counts and amounts by status', async () => {
      prismaMock.payment.groupBy.mockResolvedValue([
        { status: 'APPROVED', _count: { id: 50 }, _sum: { amount: 25000 } },
        { status: 'PENDING', _count: { id: 10 }, _sum: { amount: 5000 } },
      ])

      const result = await getPaymentStatusBreakdown()

      expect(result).toHaveLength(2)
      expect(result[0].status).toBe('APPROVED')
      expect(result[0].count).toBe(50)
      expect(result[0].amount).toBe(25000)
      expect(result[0].percentage).toBeGreaterThan(0)
    })
  })

  // ─── getCriticalAlerts ───────────────────────────────────────────
  describe('getCriticalAlerts', () => {
    it('returns alerts for low-fill pools and stale payments', async () => {
      const now = new Date()
      const threeDaysFromNow = new Date(now)
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
      const twoDaysAgo = new Date(now)
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

      prismaMock.examPool.findMany.mockResolvedValue([
        {
          id: 'pool-1',
          name: 'Low Fill Pool',
          currentMemberCount: 10,
          maxCandidates: 25,
          event: { joinDeadline: threeDaysFromNow, name: 'Event 1' },
        },
      ])
      prismaMock.payment.findMany.mockResolvedValue([
        {
          id: 'pay-1',
          createdAt: twoDaysAgo,
          user: { profile: { firstName: 'Jane' } },
        },
      ])

      const result = await getCriticalAlerts()

      expect(result).toHaveLength(2)
      // Sorted by date ascending — stale payment is older than pool deadline
      expect(result[0].type).toBe('WARNING')
      expect(result[0].category).toBe('Finance')
      expect(result[0].message).toContain('Jane')
      expect(result[1].type).toBe('CRITICAL')
      expect(result[1].category).toBe('Exam Pool')
      expect(result[1].message).toContain('40% full')
    })

    it('excludes pools with >= 50% fill rate', async () => {
      const now = new Date()
      const threeDaysFromNow = new Date(now)
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

      prismaMock.examPool.findMany.mockResolvedValue([
        {
          id: 'pool-ok',
          name: 'Good Pool',
          currentMemberCount: 20,
          maxCandidates: 25,
          event: { joinDeadline: threeDaysFromNow },
        },
      ])
      prismaMock.payment.findMany.mockResolvedValue([])

      const result = await getCriticalAlerts()

      expect(result).toHaveLength(0)
    })
  })

  // ─── getExamAnalytics ────────────────────────────────────────────
  describe('getExamAnalytics', () => {
    it('returns exam analytics from bookings and results', async () => {
      prismaMock.examBooking.findMany.mockResolvedValue([
        { id: 'b1', userId: 'u1', result: null, attemptType: null, examCategory: 'OFFICIAL_EASA', moduleCode: '010', score: null, percentage: 85, status: 'COMPLETED', demandStatus: null, examDate: new Date(), createdAt: new Date() },
      ])
      prismaMock.examResult.findMany.mockResolvedValue([
        { id: 'r1', userId: 'u1', passed: true, attemptType: 'FIRST', examCategory: 'OFFICIAL_EASA', moduleCode: '010', score: 90, percentage: null, createdAt: new Date() },
      ])

      const result = await getExamAnalytics()

      expect(result.total).toBeGreaterThanOrEqual(1)
      expect(result.passed).toBeGreaterThanOrEqual(1)
      expect(result.hardestModules).toBeDefined()
      expect(result.easiestModules).toBeDefined()
      expect(result.scoreDistribution).toBeDefined()
      expect(result.monthlyTrend).toHaveLength(12)
    })

    it('handles bookings with pass/fail results without examResult rows', async () => {
      prismaMock.examBooking.findMany.mockResolvedValue([
        { id: 'b2', userId: 'u2', result: 'pass', attemptType: 'RESIT_1', examCategory: 'INTERNAL', moduleCode: '020', score: 75, percentage: null, status: 'COMPLETED', demandStatus: null, examDate: new Date(), createdAt: new Date() },
      ])
      prismaMock.examResult.findMany.mockResolvedValue([])

      const result = await getExamAnalytics()

      expect(result.total).toBe(1)
      expect(result.passed).toBe(1)
      expect(result.resitPassRate).toBe(100)
    })
  })

  // ─── getYoYComparison ────────────────────────────────────────────
  describe('getYoYComparison', () => {
    it('compares current year vs previous year metrics', async () => {
      const currentYear = new Date().getFullYear()

      prismaMock.payment.findMany
        .mockResolvedValueOnce([{ amount: 50000, approvedAt: new Date(currentYear, 0, 1) }])
        .mockResolvedValueOnce([{ amount: 40000, approvedAt: new Date(currentYear - 1, 0, 1) }])
      prismaMock.enrollment.findMany
        .mockResolvedValueOnce([{ enrolledAt: new Date(currentYear, 0, 1) }])
        .mockResolvedValueOnce([{ enrolledAt: new Date(currentYear - 1, 0, 1) }])
      prismaMock.examResult.findMany
        .mockResolvedValueOnce([{ passed: true, createdAt: new Date(currentYear, 0, 1) }])
        .mockResolvedValueOnce([{ passed: false, createdAt: new Date(currentYear - 1, 0, 1) }])
      prismaMock.studentProfile.findMany
        .mockResolvedValueOnce([{ createdAt: new Date(currentYear, 0, 1) }])
        .mockResolvedValueOnce([{ createdAt: new Date(currentYear - 1, 0, 1) }])

      const result = await getYoYComparison()

      expect(result.currentYear).toBe(currentYear)
      expect(result.previousYear).toBe(currentYear - 1)
      expect(result.totals.current.revenue).toBe(50000)
      expect(result.totals.previous.revenue).toBe(40000)
      expect(result.monthlyData).toHaveLength(12)
    })

    it('defaults to current year when no baseYear provided', async () => {
      prismaMock.payment.findMany.mockResolvedValue([])
      prismaMock.enrollment.findMany.mockResolvedValue([])
      prismaMock.examResult.findMany.mockResolvedValue([])
      prismaMock.studentProfile.findMany.mockResolvedValue([])

      const result = await getYoYComparison()

      expect(result.currentYear).toBe(new Date().getFullYear())
    })
  })
})
