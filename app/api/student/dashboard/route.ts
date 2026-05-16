import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStudent } from '@/lib/auth/helpers'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireStudent()

  const [studentData, wallet, enrollments, poolMemberships, upcomingExams, notifications, totalAttendanceRecords, presentCount] =
    (await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        include: { profile: true, studentProfile: true },
      }),
      prisma.wallet.findUnique({ where: { userId: user.id } }),
      prisma.enrollment.findMany({
        where: { userId: user.id, status: { in: ['ACTIVE', 'ENROLLED', 'APPROVED'] } },
        include: { course: { select: { name: true, code: true, duration: true } } },
      }),
      prisma.examBooking.findMany({
        where: { userId: user.id, exam: { examDate: { gte: new Date() } } },
        include: { exam: { select: { name: true, duration: true, examDate: true } } },
        orderBy: { exam: { examDate: 'asc' } },
        take: 5,
      }),
      prisma.notification.count({
        where: { userId: user.id, isRead: false },
      }),
      prisma.attendanceRecord.count({
        where: { userId: user.id },
      }),
      prisma.attendanceRecord.count({
        where: { userId: user.id, status: 'PRESENT' },
      }),
    ])) as unknown as [any, any, any, any, any, number, number, number]
  const attendanceRate =
    totalAttendanceRecords > 0 ? Math.round((presentCount / totalAttendanceRecords) * 100) : 0

  const { password, ...safe } = studentData!
  return apiSuccess({
    user: safe,
    wallet,
    enrollments,
    poolMemberships,
    upcomingExams,
    unreadNotifications: notifications,
    attendanceRate,
  })
})
