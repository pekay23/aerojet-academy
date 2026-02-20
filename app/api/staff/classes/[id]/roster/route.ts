import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiNotFound, withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(
  async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
    await requireStaff()
    const cls = await prisma.class.findUnique({
      where: { id: ctx?.params?.id },
      include: {
        course: { select: { code: true, name: true } },
        attendanceRecords: {
          include: {
            user: {
              include: {
                profile: { select: { firstName: true, lastName: true } },
                studentProfile: { select: { studentId: true } },
              },
            },
          },
          orderBy: { date: 'desc' },
        },
      },
    })
    if (!cls) return apiNotFound('Class not found')

    // Get unique students from attendance records
    const studentMap = new Map()
    cls.attendanceRecords.forEach((a) => {
      if (!studentMap.has(a.userId)) {
        studentMap.set(a.userId, { user: a.user, attendanceCount: 0, presentCount: 0 })
      }
      const entry = studentMap.get(a.userId)
      entry.attendanceCount++
      if (a.status === 'PRESENT') entry.presentCount++
    })

    return apiSuccess({ class: cls, roster: Array.from(studentMap.values()) })
  }
)
