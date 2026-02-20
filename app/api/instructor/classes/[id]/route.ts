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
      include: {
        course: true,
        attendanceRecords: {
          include: {
            user: { include: { profile: { select: { firstName: true, lastName: true } } } },
          },
          orderBy: { date: 'desc' },
        },
      },
    })

    if (!classItem) return apiNotFound('Class not found')
    if (classItem.instructorId !== user.id) return apiForbidden('Not assigned to this class')

    return apiSuccess(classItem)
  }
)
