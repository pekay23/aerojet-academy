import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireInstructor } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiForbidden, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { getInstructorProfileByUserId } from '@/lib/instructor/profile'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'

const remindSchema = z.object({
  sessionId: z.string().optional(),
  studentId: z.string().optional(),
  message: z.string().min(1).max(500).optional(),
})

/**
 * POST /api/instructor/exams/classes/[classId]/remind
 *
 * Sends an in-app reminder `Notification` to a student about their internal
 * exam for this class. Accepts either a `sessionId` (resolved to its student)
 * or an explicit `studentId`.
 */
export const POST = withErrorHandler(
  async (req: NextRequest, ctx: { params: Promise<{ classId: string }> }) => {
    const user = await requireInstructor()
    const instructorProfile = await getInstructorProfileByUserId(user.id)
    if (!instructorProfile) return apiForbidden('Instructor profile not found')

    if (!(await isInternalExamSystemEnabled())) {
      return apiError('Internal exams are not currently available', 403)
    }
    const { classId } = await ctx.params

    const classItem = await prismaUnfiltered.class.findUnique({
      where: { id: classId },
      select: { id: true, instructorId: true, name: true, course: { select: { name: true } } },
    })
    if (!classItem) return apiNotFound('Class not found')
    if (classItem.instructorId !== instructorProfile.id) {
      return apiForbidden('Not assigned to this class')
    }

    const body = await req.json()
    const parsed = remindSchema.safeParse(body)
    if (!parsed.success) return apiError('Invalid input — sessionId or studentId required')

    const { sessionId, studentId, message } = parsed.data

    let targetStudentId = studentId
    if (!targetStudentId && sessionId) {
      const session = await prismaUnfiltered.internalExamSession.findUnique({
        where: { id: sessionId },
        select: { id: true, studentId: true, classId: true },
      })
      if (!session) return apiError('Session not found', 404)
      if (session.classId !== classId) return apiForbidden('Session does not belong to this class')
      targetStudentId = session.studentId
    }
    if (!targetStudentId) return apiError('A studentId or sessionId is required', 400)

    const notification = await prismaUnfiltered.notification.create({
      data: {
        userId: targetStudentId,
        type: 'EXAM_REMINDER',
        title: 'Internal Exam Reminder',
        message:
          message ||
          `Your instructor reminded you about the internal exam for ${classItem.course.name} (${classItem.name}). Please complete it before the deadline.`,
        linkUrl: '/student/exams/internal',
        sentBy: user.id,
      },
    })

    await createAuditLog({
      userId: user.id,
      action: AuditAction.UPDATE,
      entity: 'Notification',
      entityId: notification.id,
      description: `Sent exam reminder to student ${targetStudentId} for class ${classItem.name}`,
      changes: { classId, studentId: targetStudentId },
    })

    return apiSuccess({ sent: true, userId: targetStudentId, notificationId: notification.id })
  }
)
