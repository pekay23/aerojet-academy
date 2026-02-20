import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireAuth } from '@/lib/auth/helpers'
import { apiSuccess, apiForbidden, withErrorHandler } from '@/lib/api/response'
import { UserRole } from '@prisma/client'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth()
  if (user.role !== UserRole.INSTRUCTOR) return apiForbidden('Instructor access required')

  const instructorProfile = await prisma.instructorProfile.findUnique({
    where: { userId: user.id },
  })

  const [classes, upcomingClasses, totalStudents] = await Promise.all([
    prisma.class.findMany({
      where: { instructorId: user.id },
      include: {
        course: { select: { code: true, name: true } },
        _count: { select: { attendanceRecords: true } },
      },
      orderBy: { startDate: 'desc' },
    }),
    prisma.class.findMany({
      where: { instructorId: user.id, startDate: { gte: new Date() } },
      include: { course: { select: { code: true, name: true } } },
      orderBy: { startDate: 'asc' },
      take: 10,
    }),
    prisma.attendanceRecord.findMany({
      where: { class: { instructorId: user.id } },
      select: { userId: true },
      distinct: ['userId'],
    }),
  ])

  const recentAttendance = await prisma.attendanceRecord.findMany({
    where: { class: { instructorId: user.id } },
    orderBy: { date: 'desc' },
    take: 100,
  })

  const attendanceRate =
    recentAttendance.length > 0
      ? Math.round(
          (recentAttendance.filter((r) => r.status === 'PRESENT').length /
            recentAttendance.length) *
            100
        )
      : 0

  return apiSuccess({
    instructorProfile,
    stats: {
      totalClasses: classes.length,
      upcomingClasses: upcomingClasses.length,
      totalStudents: totalStudents.length,
      attendanceRate,
    },
    upcomingClasses,
    recentClasses: classes.slice(0, 10),
  })
})
