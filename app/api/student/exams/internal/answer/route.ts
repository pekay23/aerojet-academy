import { NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { z } from 'zod'

const answerSchema = z.object({
  sessionId: z.string(),
  questionId: z.string(),
  selectedAnswer: z.string(),
})

/**
 * POST /api/student/exams/internal/answer — save a single answer (autosave)
 * Called on each question answer to persist progress for resume support.
 */
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
    return apiError('Only enrolled students may answer internal exams', 403)
  }

  const body = await req.json()
  const parsed = answerSchema.safeParse(body)
  if (!parsed.success) return apiError('Invalid input')

  const { sessionId, questionId, selectedAnswer } = parsed.data

  // Verify session ownership and status
  const examSession = await prismaUnfiltered.internalExamSession.findUnique({
    where: { id: sessionId },
    select: { studentId: true, status: true, expiresAt: true },
  })

  if (!examSession) return apiError('Session not found', 404)
  if (examSession.studentId !== session.user.id) return apiError('Unauthorized', 403)
  if (examSession.status !== 'IN_PROGRESS') return apiError('Session is not active')

  // Check expiry
  if (examSession.expiresAt && new Date() > examSession.expiresAt) {
    return apiError('Session has expired', 410)
  }

  // Update the answer record
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

  return apiSuccess({ saved: true })
})
