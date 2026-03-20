import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'

const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'STAFF']

export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session || !STAFF_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    const [notifications, messages, recentApplicants, recentPayments, recentEnrollments] =
      await Promise.all([
        prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            title: true,
            message: true,
            type: true,
            isRead: true,
            createdAt: true,
            linkUrl: true,
          },
        }),
        prisma.message.findMany({
          where: { recipientId: userId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            subject: true,
            body: true,
            isRead: true,
            createdAt: true,
            sender: {
              select: {
                email: true,
                profile: { select: { firstName: true, lastName: true } },
              },
            },
          },
        }),
        prisma.user.findMany({
          where: { role: 'APPLICANT', status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: {
            id: true,
            email: true,
            createdAt: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        }),
        prisma.payment.findMany({
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: {
            id: true,
            amount: true,
            currency: true,
            createdAt: true,
            user: {
              select: {
                email: true,
                profile: { select: { firstName: true, lastName: true } },
              },
            },
          },
        }),
        prisma.enrollment.findMany({
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: {
            id: true,
            createdAt: true,
            user: {
              select: {
                email: true,
                profile: { select: { firstName: true, lastName: true } },
              },
            },
            course: { select: { name: true, code: true } },
          },
        }),
      ])

    const transformedMessages = messages.map((msg) => ({
      ...msg,
      sender: {
        name: msg.sender.profile
          ? `${msg.sender.profile.firstName} ${msg.sender.profile.lastName}`
          : null,
        email: msg.sender.email,
      },
    }))

    const pendingItems = {
      applicants: recentApplicants.map((a) => ({
        id: a.id,
        name: a.profile ? `${a.profile.firstName} ${a.profile.lastName}` : null,
        email: a.email,
        createdAt: a.createdAt,
      })),
      payments: recentPayments.map((p) => ({
        id: p.id,
        userName: p.user.profile
          ? `${p.user.profile.firstName} ${p.user.profile.lastName}`
          : p.user.email,
        amount: Number(p.amount),
        currency: p.currency,
        createdAt: p.createdAt,
      })),
      enrollments: recentEnrollments.map((e) => ({
        id: e.id,
        userName: e.user.profile
          ? `${e.user.profile.firstName} ${e.user.profile.lastName}`
          : e.user.email,
        courseName: e.course.name,
        createdAt: e.createdAt,
      })),
    }

    return NextResponse.json({
      notifications,
      messages: transformedMessages,
      pendingItems,
    })
  } catch (error) {
    console.error('Staff topbar items error:', error)
    return NextResponse.json({
      notifications: [],
      messages: [],
      pendingItems: { applicants: [], payments: [], enrollments: [] },
    })
  }
}
