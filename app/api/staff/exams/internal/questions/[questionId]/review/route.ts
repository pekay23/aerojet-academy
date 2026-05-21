import { NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { z } from 'zod'

const reviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNote: z.string().optional(),
})

export const PATCH = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const session = await getAuthSession()
  // Only Staff, Admin, Super Admin, Examiner can review
  if (!session || !['ADMIN', 'SUPER_ADMIN', 'STAFF', 'EXAMINER'].includes(session.user.role)) {
    return apiError('Unauthorized', 403)
  }

  const { questionId } = await ctx.params
  const body = await req.json()

  const parsed = reviewSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; '), 400)
  }

  const question = await prismaUnfiltered.internalExamQuestion.findUnique({
    where: { id: questionId },
  })

  if (!question) {
    return apiError('Question not found', 404)
  }

  const updated = await prismaUnfiltered.internalExamQuestion.update({
    where: { id: questionId },
    data: {
      status: parsed.data.status,
      reviewNote: parsed.data.reviewNote || null,
      reviewedById: session.user.id,
      reviewedAt: new Date(),
    },
  })

  return apiSuccess(updated)
})
