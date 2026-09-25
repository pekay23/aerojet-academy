import { NextRequest, NextResponse } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'
import { getInstructorProfileIdOrThrow } from '@/lib/instructor/profile'
import { badgeCountsCache, isStaffBadgeCounts, isNumber } from './cache'

export async function GET(_req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const role = session.user.role

    // Try user cache first
    const userCacheKey = `${role}:badges`
    const cachedUser = badgeCountsCache.getUserValidated(
      userId,
      userCacheKey,
      (
        data: unknown
      ): data is {
        notifications: number
        messages: number
        applicants?: number
        enrollments?: number
        payments?: number
        pendingGrading?: number
      } => {
        if (typeof data !== 'object' || data === null) return false
        const d = data as Record<string, unknown>
        return (
          typeof d.notifications === 'number' &&
          typeof d.messages === 'number' &&
          (d.applicants === undefined || typeof d.applicants === 'number') &&
          (d.enrollments === undefined || typeof d.enrollments === 'number') &&
          (d.payments === undefined || typeof d.payments === 'number') &&
          (d.pendingGrading === undefined || typeof d.pendingGrading === 'number')
        )
      }
    )
    if (cachedUser) return NextResponse.json(cachedUser)

    const counts: {
      notifications: number
      messages: number
      applicants?: number
      enrollments?: number
      payments?: number
      pendingGrading?: number
    } = {
      notifications: 0,
      messages: 0,
    }

    // Role-based counts for staff/admin/super_admin
    if (['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(role)) {
      const globalCache = badgeCountsCache.getGlobalValidated('staff_badges', isStaffBadgeCounts)
      if (globalCache) {
        Object.assign(counts, globalCache)
      } else {
        const [applicants, enrollments, payments] = await Promise.allSettled([
          prismaUnfiltered.user.count({ where: { role: 'APPLICANT', status: 'PENDING' } }),
          prismaUnfiltered.enrollment.count({ where: { status: 'PENDING' } }),
          prismaUnfiltered.payment.count({ where: { status: 'PENDING' } }),
        ])

        counts.applicants = applicants.status === 'fulfilled' ? applicants.value : 0
        counts.enrollments = enrollments.status === 'fulfilled' ? enrollments.value : 0
        counts.payments = payments.status === 'fulfilled' ? payments.value : 0

        badgeCountsCache.setGlobal('staff_badges', {
          applicants: counts.applicants,
          enrollments: counts.enrollments,
          payments: counts.payments,
        })
      }
    }

    // Instructor-specific pendingGrading count
    if (role === 'INSTRUCTOR') {
      const instructorCacheKey = `instructor_pendingGrading:${userId}`
      const cachedInstructor = badgeCountsCache.getGlobalValidated(instructorCacheKey, isNumber)
      if (cachedInstructor !== null) {
        counts.pendingGrading = cachedInstructor
      } else {
        try {
          const instructorId = await getInstructorProfileIdOrThrow(userId)
          const pendingGrading = await prismaUnfiltered.grade.count({
            where: {
              gradedBy: instructorId,
              score: 0,
            },
          })
          counts.pendingGrading = pendingGrading
          badgeCountsCache.setGlobal(instructorCacheKey, pendingGrading)
        } catch {
          counts.pendingGrading = 0
        }
      }
    }

    // User-specific counts (all authenticated roles)
    const [messages, notifications] = await Promise.allSettled([
      prismaUnfiltered.message.count({ where: { recipientId: userId, isRead: false } }),
      prismaUnfiltered.notification.count({ where: { userId, isRead: false } }),
    ])

    counts.messages = messages.status === 'fulfilled' ? messages.value : 0
    counts.notifications = notifications.status === 'fulfilled' ? notifications.value : 0

    // Save to user cache
    badgeCountsCache.setUser(userId, userCacheKey, counts)

    return NextResponse.json(counts)
  } catch (error) {
    console.error('Error fetching badge counts:', error)
    // Return zero counts without error field to maintain contract compatibility
    return NextResponse.json({
      notifications: 0,
      messages: 0,
    })
  }
}
