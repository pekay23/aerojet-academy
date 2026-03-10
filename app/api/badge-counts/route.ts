import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const role = session.user.role

    // Common counts for all roles
    const [unreadNotifications, unreadMessages] = await Promise.all([
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
      prisma.message.count({
        where: { recipientId: userId, isRead: false },
      }),
    ])

    const counts: Record<string, number> = {
      notifications: unreadNotifications,
      messages: unreadMessages,
    }

    // Staff/Admin-specific counts
    if (['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(role)) {
      const [pendingApplicants, pendingEnrollments, pendingPayments] = await Promise.all([
        prisma.user.count({ where: { role: 'APPLICANT', status: 'PENDING' } }),
        prisma.enrollment.count({ where: { status: 'PENDING' } }),
        prisma.payment.count({ where: { status: 'PENDING' } }),
      ])
      counts.applicants = pendingApplicants
      counts.enrollments = pendingEnrollments
      counts.payments = pendingPayments
    }

    // Instructor-specific counts
    if (['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
      const pendingGrading = await prisma.grade.count({
        where: {
          gradedBy: userId,
          score: 0,
        },
      })
      counts.pendingGrading = pendingGrading
    }

    return NextResponse.json(counts)
  } catch (error) {
    console.error('Badge counts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
