import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireInstructor } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiForbidden, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { getInstructorProfileByUserId } from '@/lib/instructor/profile'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'

const voidSchema = z.object({
  sessionId: z.string(),
  reason: z.string().min(1).max(500).optional(),
})

/**
 * POST /api/instructor/exams/classes/[classId]/void
 *
 * Instructor-scoped equivalent of the staff void operation. Voids an exam
 * session so the student can retake it. Mirrors
 * `/api/staff/exams/internal/operations/void` but is gated on the instructor
 * actually teaching the class that owns the session.
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
      select: { id: true, instructorId: true },
    })
    if (!classItem) return apiNotFound('Class not found')
    if (classItem.instructorId !== instructorProfile.id) {
      return apiForbidden('Not assigned to this class')
    }

    const body = await req.json()
    const parsed = voidSchema.safeParse(body)
    if (!parsed.success) return apiError('Invalid input — sessionId required')

    const { sessionId, reason } = parsed.data
    const voidReason = reason || 'Instructor-initiated void/reset'

    const before = await prismaUnfiltered.internalExamSession.findUnique({
      where: { id: sessionId },
      select: { id: true, studentId: true, bankId: true, status: true, classId: true },
    })
    if (!before) return apiError('Session not found', 404)
    if (before.classId !== classId) return apiForbidden('Session does not belong to this class')
    if (before.status === 'VOIDED') return apiError('Session is already voided')

    await prismaUnfiltered.internalExamSession.update({
      where: { id: sessionId },
      data: {
        status: 'VOIDED',
        voidedAt: new Date(),
        voidedBy: instructorProfile.id,
        voidReason,
      },
    })

    const resolved = await prismaUnfiltered.internalExamReport.updateMany({
      where: { sessionId, status: 'PENDING' },
      data: { status: 'RESOLVED', resolvedAt: new Date() },
    })

    await createAuditLog({
      userId: user.id,
      action: AuditAction.UPDATE,
      entity: 'InternalExamSession',
      entityId: sessionId,
      description: `Voided internal exam session for retake: ${voidReason}`,
      changes: {
        before: { status: before.status },
        after: { status: 'VOIDED', voidedBy: instructorProfile.id, voidReason },
        resolvedReportCount: resolved.count,
      },
    })

    return apiSuccess({ voided: true, sessionId })
  }
)
