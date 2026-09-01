// Staff-only analytics — use the raw client so we don't pay the RLS
// transaction overhead on every count/aggregate. Staff pages are already
// auth-gated at the layout + proxy layers.
import { unstable_cache } from 'next/cache'
import { prismaUnfiltered as prisma } from '@/lib/prisma/client'
import { Prisma } from '@prisma/client'
import { getCurrencySymbol, formatCurrency } from '@/lib/currency'
import { subDays, subHours, subYears, startOfDay, endOfDay, differenceInMilliseconds } from 'date-fns'

export const calculateFillRate = (current: number, max: number): number => {
  if (max === 0) return 0
  return Math.round((current / max) * 100)
}

// Re-export common formatting with the same signature if needed,
// or just use the imported one.
export { formatCurrency }

export const calculateGrowth = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

export const getDashboardMetrics = (period: string = 'mom', customFrom?: Date, customTo?: Date) =>
  unstable_cache(
    async () => {
      const now = new Date()
      let currentStart: Date
      let previousStart: Date

      if (period === 'custom' && customFrom && customTo) {
        currentStart = customFrom
        const duration = differenceInMilliseconds(customTo, customFrom)
        previousStart = new Date(currentStart.getTime() - duration)
      } else {
        switch (period) {
          case 'yoy':
            currentStart = subYears(now, 1)
            previousStart = subYears(currentStart, 1)
            break
          case 'mom':
            currentStart = subDays(now, 30)
            previousStart = subDays(currentStart, 30)
            break
          case 'wow':
            currentStart = subDays(now, 7)
            previousStart = subDays(currentStart, 7)
            break
          case 'day':
          case '24h':
            currentStart = subDays(now, 1)
            previousStart = subDays(currentStart, 1)
            break
          case '4h':
            currentStart = subHours(now, 4)
            previousStart = subHours(currentStart, 4)
            break
          case '1h':
            currentStart = subHours(now, 1)
            previousStart = subHours(currentStart, 1)
            break
          default:
            currentStart = subDays(now, 30)
            previousStart = subDays(currentStart, 30)
        }
      }

      const [
        totalUsers,
        totalStudents,
        totalApplicants,
        totalInstructors,
        activeEnrollments,
        pendingPayments,
        openPools,
        totalRevenueResult,
        // Growth metrics
        currentRevenue,
        previousRevenue,
        currentEnrollments,
        previousEnrollments,
        currentStudents,
        previousStudents,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.studentProfile.count(),
        prisma.user.count({ where: { role: 'APPLICANT' } }),
        prisma.instructorProfile.count(),
        prisma.enrollment.count({ where: { status: 'ENROLLED' } }),
        prisma.payment.count({ where: { status: 'PENDING' } }),
        prisma.examPool.count({ where: { status: { in: ['OPEN', 'NEAR_FULL'] } } }),
        prisma.payment.aggregate({ where: { status: 'APPROVED' }, _sum: { amount: true } }),

        // Revenue Growth
        prisma.payment.aggregate({
          where: { status: 'APPROVED', approvedAt: { gte: currentStart } },
          _sum: { amount: true },
        }),
        prisma.payment.aggregate({
          where: { status: 'APPROVED', approvedAt: { gte: previousStart, lt: currentStart } },
          _sum: { amount: true },
        }),

        // Enrollment Growth
        prisma.enrollment.count({
          where: { status: 'ENROLLED', enrolledAt: { gte: currentStart } },
        }),
        prisma.enrollment.count({
          where: { status: 'ENROLLED', enrolledAt: { gte: previousStart, lt: currentStart } },
        }),

        // Student Growth
        prisma.studentProfile.count({
          where: { createdAt: { gte: currentStart } },
        }),
        prisma.studentProfile.count({
          where: { createdAt: { gte: previousStart, lt: currentStart } },
        }),
      ])

      const totalRevenue = Number(totalRevenueResult._sum.amount || 0)

      return {
        totalUsers,
        totalStudents: {
          value: totalStudents,
          growth: calculateGrowth(currentStudents, previousStudents),
        },
        totalApplicants,
        totalInstructors,
        activeEnrollments: {
          value: activeEnrollments,
          growth: calculateGrowth(currentEnrollments, previousEnrollments),
        },
        pendingPayments,
        openPools,
        totalRevenue: {
          value: totalRevenue,
          growth: calculateGrowth(Number(currentRevenue._sum.amount || 0), Number(previousRevenue._sum.amount || 0)),
        },
      }
    },
    ['metrics-dashboard', period, customFrom?.toISOString() ?? 'none', customTo?.toISOString() ?? 'none'],
    { revalidate: 300, tags: ['metrics', 'dashboard'] }
  )()

export const getTopCourses = (limit = 5) =>
  unstable_cache(
    async () => {
      const topEnrollments = await prisma.enrollment.groupBy({
        by: ['courseId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: limit,
      })

      const courseIds = topEnrollments.map((e) => e.courseId)
      const courses = await prisma.course.findMany({
        where: { id: { in: courseIds } },
        select: { id: true, name: true, code: true },
      })

      return topEnrollments.map((e) => {
        const course = courses.find((c) => c.id === e.courseId)
        return {
          id: e.courseId,
          name: course?.name || 'Unknown',
          code: course?.code || 'N/A',
          enrollments: e._count.id,
        }
      })
    },
    ['metrics-top-courses', String(limit)],
    { revalidate: 300, tags: ['metrics', 'top-courses'] }
  )()

export const getBehavioralMetrics = (period: string = 'mom', customFrom?: Date, customTo?: Date) =>
  unstable_cache(
    async () => {
      const now = new Date()
      let currentStart: Date
      let previousStart: Date

      if (period === 'custom' && customFrom && customTo) {
        currentStart = customFrom
        const duration = differenceInMilliseconds(customTo, customFrom)
        previousStart = new Date(currentStart.getTime() - duration)
      } else {
        switch (period) {
          case 'yoy':
            currentStart = subYears(now, 1)
            previousStart = subYears(currentStart, 1)
            break
          case 'mom':
            currentStart = subDays(now, 30)
            previousStart = subDays(currentStart, 30)
            break
          case 'wow':
            currentStart = subDays(now, 7)
            previousStart = subDays(currentStart, 7)
            break
          case 'day':
          case '24h':
            currentStart = subDays(now, 1)
            previousStart = subDays(currentStart, 1)
            break
          case '4h':
            currentStart = subHours(now, 4)
            previousStart = subHours(currentStart, 4)
            break
          case '1h':
            currentStart = subHours(now, 1)
            previousStart = subHours(currentStart, 1)
            break
          default:
            currentStart = subDays(now, 30)
            previousStart = subDays(currentStart, 30)
        }
      }

      const [
        totalEvents,
        activeUsersRaw,
        currentPageViews,
        previousPageViews,
        featureAdoptersRaw,
      ] = await Promise.all([
        prisma.auditLog.count({
          where: { entity: 'ANALYTICS', createdAt: { gte: currentStart, lt: now } },
        }),
        prisma.auditLog.findMany({
          where: { entity: 'ANALYTICS', createdAt: { gte: currentStart, lt: now } },
          select: { userId: true },
          distinct: ['userId'],
        }),
        prisma.auditLog.count({
          where: { action: 'PAGE_VIEW', entity: 'ANALYTICS', createdAt: { gte: currentStart, lt: now } },
        }),
        prisma.auditLog.count({
          where: { action: 'PAGE_VIEW', entity: 'ANALYTICS', createdAt: { gte: previousStart, lt: currentStart } },
        }),
        prisma.auditLog.findMany({
          where: { action: 'FEATURE_USED', entity: 'ANALYTICS', createdAt: { gte: currentStart, lt: now } },
          select: { userId: true },
          distinct: ['userId'],
        }),
      ])

      const activeUsers = activeUsersRaw.filter((u): u is { userId: string } => Boolean(u.userId)).length
      const featureAdopters = featureAdoptersRaw.filter((u): u is { userId: string } => Boolean(u.userId)).length
      const featureAdoptionRate = activeUsers > 0 ? Math.round((featureAdopters / activeUsers) * 100) : 0
      const avgSessionEvents = activeUsers > 0 ? Math.round(totalEvents / activeUsers) : 0
      const pageViewGrowth = calculateGrowth(currentPageViews, previousPageViews)

      return {
        totalEvents,
        activeUsers,
        avgSessionEvents,
        pageViews: currentPageViews,
        pageViewGrowth,
        featureAdoptionRate,
      }
    },
    ['metrics-behavioral', period, customFrom?.toISOString() ?? 'none', customTo?.toISOString() ?? 'none'],
    { revalidate: 300, tags: ['metrics', 'behavioral'] }
  )()

export const getAttendanceRate = (userId?: string) =>
  unstable_cache(
    async () => {
      const where: any = {}
      if (userId) {
        // Validate that the user exists before querying attendance
        const userExists = await prisma.user.findUnique({
          where: { id: userId, deletedAt: null },
          select: { id: true },
        })
        if (!userExists) {
          return { total: 0, present: 0, absent: 0, rate: 0 }
        }
        where.userId = userId
      }

      const [total, present] = await Promise.all([
        prisma.attendanceRecord.count({ where }),
        prisma.attendanceRecord.count({ where: { ...where, status: 'PRESENT' } }),
      ])

      const rate = total > 0 ? Math.round((present / total) * 100) : 0

      return {
        total,
        present,
        absent: total - present,
        rate,
      }
    },
    ['metrics-attendance-rate', userId ?? 'all'],
    { revalidate: 300, tags: ['metrics', 'attendance'] }
  )()
