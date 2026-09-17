import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireAuth } from '@/lib/auth/helpers'
import { apiSuccess, apiForbidden, apiNotFound, withErrorHandler , RouteContext } from '@/lib/api/response'
import { getInstructorProfileByUserId } from '@/lib/instructor/profile'
import { UserRole } from '@prisma/client'

export const GET = withErrorHandler(
  async (req: NextRequest, ctx?: RouteContext) => {
    const user = await requireAuth()
    if (user.role !== UserRole.INSTRUCTOR) return apiForbidden('Instructor access required')

    const instructorProfile = await getInstructorProfileByUserId(user.id)
    if (!instructorProfile) return apiForbidden('Instructor profile not found')

    const classItem = await prisma.class.findUnique({
      where: { id: (await ctx!.params).id },
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
    if (classItem.instructorId !== instructorProfile.id) {
      return apiForbidden('Not assigned to this class')
    }

    return apiSuccess(classItem)
  }
)
