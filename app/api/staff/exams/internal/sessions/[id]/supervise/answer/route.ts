import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

export const POST = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const staff = await requireStaff()
  const { id: sessionId } = await ctx.params
  const body = await req.json().catch(() => ({}))
  const { questionId, selectedAnswer } = body as { questionId?: string; selectedAnswer?: string }

  if (!questionId || selectedAnswer === undefined) {
    return apiError('questionId and selectedAnswer are required', 400)
  }

  const examSession = await prismaUnfiltered.internalExamSession.findUnique({
    where: { id: sessionId },
    select: { id: true, studentId: true, status: true, supervised: true, expiresAt: true },
  })

  if (!examSession) return apiError('Session not found', 404)
  if (!examSession.supervised) return apiError('This session is not supervised', 403)
  if (examSession.status !== 'IN_PROGRESS') return apiError('Session is not active', 400)

  if (examSession.expiresAt && new Date() > examSession.expiresAt) {
    return apiError('Session has expired', 410)
  }

  const answer = await prismaUnfiltered.internalExamAnswer.findFirst({
    where: { sessionId, questionId },
  })
  if (!answer) return apiError('Answer record not found', 404)

  await prismaUnfiltered.internalExamAnswer.update({
    where: { id: answer.id },
    data: {
      selectedAnswer,
      answeredAt: new Date(),
    },
  })

  await createAuditLog({
    userId: staff.id,
    action: AuditAction.EXAM_SESSION_STARTED,
    entity: 'InternalExamAnswer',
    entityId: answer.id,
    description: `Invigilator saved answer for question ${questionId} in supervised session`,
    details: { sessionId, questionId, selectedAnswer, studentId: examSession.studentId },
  })

  return apiSuccess({ saved: true })
})
