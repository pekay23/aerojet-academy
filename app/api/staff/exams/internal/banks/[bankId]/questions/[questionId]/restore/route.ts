import { NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { Prisma } from '@prisma/client'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'

/**
 * POST /api/staff/exams/internal/banks/[bankId]/questions/[questionId]/restore
 * Restore a retired question (set isActive back to true)
 */
export const POST = withErrorHandler(async (
  _req: NextRequest,
  ctx: { params: Promise<{ bankId: string; questionId: string }> }
) => {
  const session = await getAuthSession()
  if (!session || !['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(session.user.role)) {
    return apiError('Unauthorized', 403)
  }
  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }

  const { questionId } = await ctx.params

  const existing = await prismaUnfiltered.internalExamQuestion.findUnique({
    where: { id: questionId },
  })
  if (!existing) {
    return apiError('Question not found', 404)
  }

  if (existing.isActive) {
    return apiError('Question is already active', 400)
  }

  const nextVersion = (await prismaUnfiltered.internalExamQuestionVersion.count({
    where: { questionId },
  })) + 1

  await prismaUnfiltered.internalExamQuestionVersion.create({
    data: {
      questionId,
      version: nextVersion,
      text: existing.text,
      options: existing.options as unknown as Prisma.InputJsonValue,
      correctAnswer: existing.correctAnswer,
      points: existing.points,
      difficulty: existing.difficulty,
      isActive: true,
      explanation: existing.explanation,
      changeType: 'REACTIVATED',
      changedById: session.user.id,
      changeReason: 'Question restored from retired state',
    },
  })

  const restored = await prismaUnfiltered.internalExamQuestion.update({
    where: { id: questionId },
    data: {
      isActive: true,
      status: 'PENDING_APPROVAL',
    },
  })

  await createAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'InternalExamQuestion',
    entityId: questionId,
    description: `Question ${questionId} restored from retired state.`,
    changes: { questionId, bankId: existing.bankId, changeType: 'REACTIVATED' },
  })

  return apiSuccess(restored)
})
