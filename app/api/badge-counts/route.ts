import { NextRequest, NextResponse } from 'next/server'
import _prisma, { prismaUnfiltered } from '@/lib/_prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'
import { badgeCountsCache } from './cache'

export async function GET(_req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const role = session.user.role

    // Try user cache first
    const cachedUser = badgeCountsCache.getUser(userId, 'badges')
    if (cachedUser) return NextResponse.json(cachedUser)

    const counts: any = {
      pendingApplicants: 0,
      pendingEnrollments: 0,
      pendingPayments: 0,
      unreadMessages: 0,
      unreadNotifications: 0,
    }

    // Role-based counts
    if (['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(role)) {
      const globalCache = badgeCountsCache.getGlobal('staff_badges')
      if (globalCache) {
        Object.assign(counts, globalCache)
      } else {
        const [applicants, enrollments, payments] = await Promise.allSettled([
          prismaUnfiltered.user.count({ where: { role: 'APPLICANT', status: 'PENDING' } }),
          prismaUnfiltered.enrollment.count({ where: { status: 'PENDING' } }),
          prismaUnfiltered.payment.count({ where: { status: 'PENDING' } }),
        ])

        counts.pendingApplicants = applicants.status === 'fulfilled' ? applicants.value : 0
        counts.pendingEnrollments = enrollments.status === 'fulfilled' ? enrollments.value : 0
        counts.pendingPayments = payments.status === 'fulfilled' ? payments.value : 0

        badgeCountsCache.setGlobal('staff_badges', {
          pendingApplicants: counts.pendingApplicants,
          pendingEnrollments: counts.pendingEnrollments,
          pendingPayments: counts.pendingPayments,
        })
      }
    }

    // User-specific counts
    const [messages, notifications] = await Promise.allSettled([
      prismaUnfiltered.message.count({ where: { recipientId: userId, isRead: false } }),
      prismaUnfiltered.notification.count({ where: { userId, isRead: false } }),
    ])

    counts.unreadMessages = messages.status === 'fulfilled' ? messages.value : 0
    counts.unreadNotifications = notifications.status === 'fulfilled' ? notifications.value : 0

    // Save to user cache
    badgeCountsCache.setUser(userId, 'badges', counts)

    return NextResponse.json(counts)
  } catch (error) {
    console.error('Error fetching staff badge counts:', error)
    return NextResponse.json({
      pendingApplicants: 0,
      pendingEnrollments: 0,
      pendingPayments: 0,
      unreadMessages: 0,
      unreadNotifications: 0,
      error: 'Partial failure fetching counts',
    })
  }
}
