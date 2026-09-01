import { NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { getBankRules, isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { z } from 'zod'

const resumeSchema = z.object({
  sessionId: z.string().min(1),
})

/**
 * GET /api/student/exams/internal/resume — resume an in-progress exam session
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
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
    return apiError('Only enrolled students may resume internal exams', 403)
  }

  const body = await req.json()
  const parsed = resumeSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Invalid request body', 400)
  }
  const { sessionId } = parsed.data

  const examSession = await prismaUnfiltered.internalExamSession.findUnique({
    where: { id: sessionId },
    include: {
      answers: {
        include: {
          question: {
            select: {
              id: true,
              text: true,
              options: true,
              points: true,
              subTopic: true,
              syllabusRef: true,
            },
          },
        },
      },
      bank: { select: { id: true, name: true } },
    },
  })

  if (!examSession) return apiError('Session not found', 404)
  if (examSession.studentId !== session.user.id) return apiError('Unauthorized', 403)

  const now = new Date()
  const effectiveExpiresAt = examSession.expiresAt
    ? new Date(examSession.expiresAt.getTime() + (examSession.timeExtensionSec || 0) * 1000)
    : null

  if (examSession.status === 'IN_PROGRESS' && effectiveExpiresAt && now <= effectiveExpiresAt) {
    const rules = await getBankRules(examSession.bankId)

    const questions = examSession.answers.map(a => a.question)
    const savedAnswers = examSession.answers.map(a => ({
      questionId: a.questionId,
      selectedAnswer: a.selectedAnswer,
      flaggedForReview: a.flaggedForReview,
    }))

    return apiSuccess({
      sessionId: examSession.id,
      questions,
      savedAnswers,
      resumed: true,
      totalTimeSecs: effectiveExpiresAt
        ? Math.max(0, Math.floor((effectiveExpiresAt.getTime() - now.getTime()) / 1000))
        : 0,
      expiresAt: examSession.expiresAt?.toISOString(),
      effectiveExpiresAt: effectiveExpiresAt?.toISOString(),
      timeExtensionSec: examSession.timeExtensionSec || 0,
      lastActivityAt: examSession.lastActivityAt?.toISOString(),
      recoveredAt: examSession.recoveredAt?.toISOString(),
      recoveredBy: examSession.recoveredBy || null,
      recoveryReason: examSession.recoveryReason || null,
      categoryCode: examSession.categoryCode,
      rules: {
        timePerQuestionSecs: rules.timePerQuestionSecs,
        passMarkPct: rules.passMarkPct,
        allowKeyboardAutoSubmit: rules.allowKeyboardAutoSubmit,
      },
    })
  }

  return apiError('Exam time has expired', 410)
})
