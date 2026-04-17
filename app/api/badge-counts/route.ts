import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const role = session.user.role

    // Initialize counts with zeros
    const counts: Record<string, number> = {
      notifications: 0,
      messages: 0,
    }

    try {
      // Basic counts for all authenticated users
      const [unreadNotifications, unreadMessages] = await Promise.all([
        prisma.notification.count({
          where: { userId, isRead: false },
        }),
        prisma.message.count({
          where: { recipientId: userId, isRead: false },
        }),
      ])
      counts.notifications = unreadNotifications
      counts.messages = unreadMessages
    } catch (baseError) {
      console.error('Error fetching base badge counts:', baseError)
    }

    // Staff/Admin-specific counts
    if (['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(role)) {
      try {
        const [pendingApplicants, pendingEnrollments, pendingPayments] = await Promise.all([
          prisma.user.count({ where: { role: 'APPLICANT', status: 'PENDING' } }),
          prisma.enrollment.count({ where: { status: 'PENDING' } }),
          prisma.payment.count({ where: { status: 'PENDING' } }),
        ])
        counts.applicants = pendingApplicants
        counts.enrollments = pendingEnrollments
        counts.payments = pendingPayments
      } catch (staffError) {
        console.error('Error fetching staff badge counts:', staffError)
      }
    }

    // Instructor-specific counts
    if (['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
      try {
        const pendingGradingCount = await prisma.grade.count({
          where: {
            gradedBy: userId,
            score: 0,
          },
        })
        counts.pendingGrading = pendingGradingCount
      } catch (instructorError) {
        console.error('Error fetching instructor badge counts:', instructorError)
      }
    }

    return NextResponse.json(counts)
  } catch (error) {
    console.error('Badge counts critical failure:', error)
    return NextResponse.json({
      notifications: 0,
      messages: 0,
    }, { status: 200 }) // Return 200 to prevent global UI crashes if possible
  }
}
