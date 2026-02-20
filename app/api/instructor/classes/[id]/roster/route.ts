import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireAuth } from '@/lib/auth/helpers'
import { apiSuccess, apiForbidden, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { UserRole } from '@prisma/client'

export const GET = withErrorHandler(
  async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
    const user = await requireAuth()
    if (user.role !== UserRole.INSTRUCTOR) return apiForbidden('Instructor access required')

    const classItem = await prisma.class.findUnique({
      where: { id: ctx?.params?.id },
      include: { course: true },
    })
    if (!classItem) return apiNotFound('Class not found')
    if (classItem.instructorId !== user.id) return apiForbidden('Not assigned to this class')

    // Get students enrolled in the course
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: classItem.courseId, status: 'ENROLLED' },
      include: {
        user: {
          include: {
            profile: { select: { firstName: true, lastName: true } },
            studentProfile: { select: { studentId: true } },
          },
        },
      },
    })

    // Get attendance for this specific class
    const attendance = await prisma.attendanceRecord.findMany({
      where: { classId: classItem.id },
      select: { userId: true, status: true, date: true },
    })

    const roster = enrollments.map((e) => {
      const record = attendance.find((a) => a.userId === e.userId)
      return {
        ...e.user,
        attendanceMarked: !!record,
        present: record?.status === 'PRESENT' ? true : record ? false : null,
      }
    })

    return apiSuccess({ class: classItem, roster })
  }
)
