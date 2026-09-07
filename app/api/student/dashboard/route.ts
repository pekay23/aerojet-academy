import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStudent } from '@/lib/auth/helpers'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async (_req: NextRequest) => {
  const user = await requireStudent()

  const [studentData, wallet, enrollments, poolMemberships, upcomingExams, notifications, totalAttendanceRecords, presentCount] =
    (await Promise.all([
      prismaUnfiltered.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          personalEmail: true,
          academyEmail: true,
          role: true,
          status: true,
          registrationCode: true,
          registrationFee: true,
          registrationCurrency: true,
          registrationPaid: true,
          paymentProofUrl: true,
          paymentApprovedAt: true,
          programmeChoice: true,
          selectedLicenseCategories: true,
          settings: true,
          hasCompletedTour: true,
          createdAt: true,
          updatedAt: true,
          profile: true,
          studentProfile: true,
        },
      }),
      prismaUnfiltered.wallet.findUnique({ where: { userId: user.id } }),
      prismaUnfiltered.enrollment.findMany({
        where: { userId: user.id, status: { in: ['ACTIVE', 'ENROLLED', 'APPROVED'] } },
        include: { course: { select: { name: true, code: true, duration: true } } },
      }),
      prismaUnfiltered.poolMembership.findMany({
        where: { userId: user.id },
        include: { pool: { include: { event: { select: { name: true, startDate: true } } } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prismaUnfiltered.examBooking.findMany({
        where: { userId: user.id, exam: { examDate: { gte: new Date() } } },
        include: { exam: { select: { name: true, duration: true, examDate: true } } },
        orderBy: { exam: { examDate: 'asc' } },
        take: 5,
      }),
      prismaUnfiltered.notification.count({
        where: { userId: user.id, isRead: false },
      }),
      prismaUnfiltered.attendanceRecord.count({
        where: { userId: user.id },
      }),
      prismaUnfiltered.attendanceRecord.count({
        where: { userId: user.id, status: 'PRESENT' },
      }),
    ]))
  const attendanceRate =
    totalAttendanceRecords > 0 ? Math.round((presentCount / totalAttendanceRecords) * 100) : 0

  if (!studentData) throw new Error('Student not found')

  return apiSuccess({
    user: studentData,
    wallet,
    enrollments,
    poolMemberships,
    upcomingExams,
    unreadNotifications: notifications,
    attendanceRate,
  })
})
