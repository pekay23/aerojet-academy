import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler, RouteContext } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { z } from 'zod'

const reviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNote: z.string().optional(),
})

export const PATCH = withErrorHandler(async (req: NextRequest, ctx?: RouteContext) => {
  const staff = await requireStaff()
  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }

  const { questionId } = (await ctx!.params) as { questionId: string }
  const body = await req.json()

  const parsed = reviewSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; '), 400)
  }

  const question = await prismaUnfiltered.internalExamQuestion.findUnique({
    where: { id: questionId },
    select: {
      id: true,
      bankId: true,
      status: true,
      reviewNote: true,
      reviewedById: true,
      reviewedAt: true,
      text: true,
      subTopic: true,
      difficulty: true,
      points: true,
    },
  })

  if (!question) {
    return apiError('Question not found', 404)
  }

  const updated = await prismaUnfiltered.internalExamQuestion.update({
    where: { id: questionId },
    data: {
      status: parsed.data.status,
      reviewNote: parsed.data.reviewNote || null,
      reviewedById: staff.id,
      reviewedAt: new Date(),
    },
  })

  await createAuditLog({
    userId: staff.id,
    action: AuditAction.EXAM_QUESTION_UPDATED,
    entity: 'InternalExamQuestion',
    entityId: questionId,
    description: `Question ${questionId} review status changed to ${parsed.data.status}`,
    changes: {
      questionId,
      bankId: question.bankId,
      before: { status: question.status },
      after: { status: parsed.data.status },
      reviewNote: parsed.data.reviewNote || null,
    },
  })

  const { correctAnswer: _correctAnswer, ...safeQuestion } = updated as unknown as Record<string, unknown>

  return apiSuccess(safeQuestion)
})
