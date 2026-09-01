import { NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { z } from 'zod'

const reviewLaterSchema = z.object({
  sessionId: z.string().min(1),
  questionId: z.string().min(1),
  flagged: z.boolean(),
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await getAuthSession()
  if (!session?.user?.id) return apiError('Unauthorized', 401)
  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }

  const user = await prismaUnfiltered.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  if (!user || user.role !== 'STUDENT') {
    return apiError('Only enrolled students may flag exam questions', 403)
  }

  const body = await req.json()
  const parsed = reviewLaterSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Invalid request body', 400)
  }
  const { sessionId, questionId, flagged } = parsed.data

  const examSession = await prismaUnfiltered.internalExamSession.findUnique({
    where: { id: sessionId },
    select: { studentId: true, status: true },
  })

  if (!examSession) return apiError('Session not found', 404)
  if (examSession.studentId !== session.user.id) return apiError('Unauthorized', 403)
  if (examSession.status !== 'IN_PROGRESS') return apiError('Session is not active')

  const answer = await prismaUnfiltered.internalExamAnswer.findFirst({
    where: { sessionId, questionId },
  })

  if (!answer) return apiError('Answer record not found', 404)

  await prismaUnfiltered.internalExamAnswer.update({
    where: { id: answer.id },
    data: { flaggedForReview: flagged },
  })

  return apiSuccess({ flagged })
})
