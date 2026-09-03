import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import {
  calculateFillRate,
  calculateGrowth,
  getDashboardMetrics,
  getTopCourses,
  getBehavioralMetrics,
  getAttendanceRate,
} from '@/lib/analytics/metrics'

describe('Analytics Metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── Pure calculation helpers ─────────────────────────────────────
  describe('calculateFillRate', () => {
    it('calculates perfect fill rate', () => {
      expect(calculateFillRate(10, 10)).toBe(100)
    })

    it('calculates partial fill rate', () => {
      expect(calculateFillRate(5, 10)).toBe(50)
    })

    it('returns 0 when max is 0', () => {
      expect(calculateFillRate(10, 0)).toBe(0)
    })

    it('rounds to nearest integer', () => {
      expect(calculateFillRate(1, 3)).toBe(33)
    })
  })

  describe('calculateGrowth', () => {
    it('calculates positive growth', () => {
      expect(calculateGrowth(150, 100)).toBe(50)
    })

    it('calculates negative growth', () => {
      expect(calculateGrowth(50, 100)).toBe(-50)
    })

    it('returns 100 when previous is 0 and current is positive', () => {
      expect(calculateGrowth(10, 0)).toBe(100)
    })

    it('returns 0 when both are 0', () => {
      expect(calculateGrowth(0, 0)).toBe(0)
    })
  })

  // ─── getDashboardMetrics ─────────────────────────────────────────
  describe('getDashboardMetrics', () => {
    it('returns operational counts for mom period', async () => {
      prismaMock.user.count
        .mockResolvedValueOnce(100) // totalUsers
        .mockResolvedValueOnce(80)  // totalStudents
      prismaMock.studentProfile.count.mockResolvedValue(80)
      prismaMock.instructorProfile.count.mockResolvedValue(10)
      prismaMock.enrollment.count.mockResolvedValue(60)
      prismaMock.payment.count.mockResolvedValue(5)
      prismaMock.examPool.count.mockResolvedValue(3)
      prismaMock.payment.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 50000 } }) // totalRevenue
        .mockResolvedValueOnce({ _sum: { amount: 20000 } }) // currentRevenue
        .mockResolvedValueOnce({ _sum: { amount: 15000 } }) // previousRevenue

      const result = await getDashboardMetrics()

      expect(result.totalUsers).toBe(100)
      expect(result.totalStudents.value).toBe(80)
      expect(result.totalStudents.growth).toBe(0) // no previous student data mocked
      expect(result.activeEnrollments.value).toBe(60)
      expect(result.totalRevenue.value).toBe(50000)
      expect(result.totalRevenue.growth).toBe(33) // (20000-15000)/15000
    })

    it('returns 0 growth when previous metric is 0', async () => {
      prismaMock.user.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(25)
      prismaMock.studentProfile.count.mockResolvedValue(25)
      prismaMock.instructorProfile.count.mockResolvedValue(5)
      prismaMock.enrollment.count.mockResolvedValue(30)
      prismaMock.payment.count.mockResolvedValue(2)
      prismaMock.examPool.count.mockResolvedValue(1)
      prismaMock.payment.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 10000 } })
        .mockResolvedValueOnce({ _sum: { amount: 5000 } })
        .mockResolvedValueOnce({ _sum: { amount: 0 } })

      const result = await getDashboardMetrics()

      expect(result.totalRevenue.growth).toBe(100) // 5000 > 0, previous is 0 => 100%
    })
  })

  // ─── getTopCourses ───────────────────────────────────────────────
  describe('getTopCourses', () => {
    it('returns top courses by enrollment count', async () => {
      prismaMock.enrollment.groupBy.mockResolvedValue([
        { courseId: 'course-1', _count: { id: 50 } },
        { courseId: 'course-2', _count: { id: 30 } },
      ])
      prismaMock.course.findMany.mockResolvedValue([
        { id: 'course-1', name: 'ATPL', code: 'ATPL' },
        { id: 'course-2', name: 'CPL', code: 'CPL' },
      ])

      const result = await getTopCourses()

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('course-1')
      expect(result[0].name).toBe('ATPL')
      expect(result[0].enrollments).toBe(50)
      expect(result[1].name).toBe('CPL')
    })

    it('falls back to Unknown when course is missing', async () => {
      prismaMock.enrollment.groupBy.mockResolvedValue([
        { courseId: 'missing', _count: { id: 5 } },
      ])
      prismaMock.course.findMany.mockResolvedValue([])

      const result = await getTopCourses()

      expect(result[0].name).toBe('Unknown')
      expect(result[0].code).toBe('N/A')
    })

    it('respects the limit parameter', async () => {
      prismaMock.enrollment.groupBy.mockResolvedValue([])

      await getTopCourses(10)

      expect(prismaMock.enrollment.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 })
      )
    })
  })

  // ─── getBehavioralMetrics ────────────────────────────────────────
  describe('getBehavioralMetrics', () => {
    it('returns behavioral metrics from audit logs', async () => {
      prismaMock.auditLog.count
        .mockResolvedValueOnce(200) // totalEvents
        .mockResolvedValueOnce(80)  // currentPageViews
        .mockResolvedValueOnce(50)  // previousPageViews

      prismaMock.auditLog.findMany
        .mockResolvedValueOnce([
          { userId: 'u1' },
          { userId: 'u2' },
          { userId: null },
        ]) // activeUsersRaw (with null)
        .mockResolvedValueOnce([
          { userId: 'u1' },
          { userId: 'u3' },
        ]) // featureAdoptersRaw

      const result = await getBehavioralMetrics()

      expect(result.totalEvents).toBe(200)
      expect(result.activeUsers).toBe(2) // filters out null userId
      expect(result.avgSessionEvents).toBe(100) // 200 / 2
      expect(result.pageViews).toBe(80)
      expect(result.pageViewGrowth).toBe(60) // (80-50)/50
      expect(result.featureAdoptionRate).toBe(100) // 2/2 * 100
    })

    it('returns 0 when no active users', async () => {
      prismaMock.auditLog.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)

      prismaMock.auditLog.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])

      const result = await getBehavioralMetrics()

      expect(result.activeUsers).toBe(0)
      expect(result.avgSessionEvents).toBe(0)
      expect(result.featureAdoptionRate).toBe(0)
    })
  })

  // ─── getAttendanceRate ───────────────────────────────────────────
  describe('getAttendanceRate', () => {
    it('calculates attendance rate for all users', async () => {
      prismaMock.attendanceRecord.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(85)  // present

      const result = await getAttendanceRate()

      expect(result.total).toBe(100)
      expect(result.present).toBe(85)
      expect(result.absent).toBe(15)
      expect(result.rate).toBe(85)
    })

    it('calculates attendance rate for a specific user', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1' })
      prismaMock.attendanceRecord.count
        .mockResolvedValueOnce(20) // total
        .mockResolvedValueOnce(18) // present

      const result = await getAttendanceRate('user-1')

      expect(result.total).toBe(20)
      expect(result.present).toBe(18)
      expect(result.absent).toBe(2)
      expect(result.rate).toBe(90)
    })

    it('returns 0 rate when user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null)

      const result = await getAttendanceRate('nonexistent')

      expect(result).toEqual({ total: 0, present: 0, absent: 0, rate: 0 })
      expect(prismaMock.attendanceRecord.count).not.toHaveBeenCalled()
    })

    it('returns 0 rate when no attendance records exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1' })
      prismaMock.attendanceRecord.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)

      const result = await getAttendanceRate('user-1')

      expect(result.rate).toBe(0)
    })
  })
})
