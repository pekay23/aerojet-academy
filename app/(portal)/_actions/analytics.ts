'use server'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'

/**
 * Records a course engagement event in the AuditLog.
 */
export async function recordCourseEngagement(courseId: string, action: string) {
  try {
    const session = await getAuthSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { name: true },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: `COURSE_${action.toUpperCase()}`,
        entity: 'Course',
        entityId: courseId,
        description: `User ${session.user.role} performed ${action} on course ${course?.name ?? courseId}`,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('[ANALYTICS_ERROR]', error)
    return { success: false, error: 'Internal Server Error' }
  }
}
