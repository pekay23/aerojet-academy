import { NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { getBankRules, isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'

/**
 * GET /api/student/exams/internal/session?sessionId=xxx
 * Returns the current session data for resume/load.
 * Strips correct answers from questions.
 */
export const GET = withErrorHandler(async (req: NextRequest, _ctx: any) => {
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
    return apiError('Only enrolled students may view internal exam sessions', 403)
  }

  const url = new URL(req.url)
  const sessionId = url.searchParams.get('sessionId')
  if (!sessionId) return apiError('sessionId is required')

  const examSession = await prismaUnfiltered.internalExamSession.findUnique({
    where: { id: sessionId },
    include: {
      answers: {
        select: {
          questionId: true,
          selectedAnswer: true,
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

  // If session is completed, redirect to results
  if (examSession.status !== 'IN_PROGRESS') {
    return apiSuccess({
      completed: true,
      sessionId: examSession.id,
      status: examSession.status,
      score: examSession.score,
      totalPoints: examSession.totalPoints,
      percentage: examSession.percentage,
      passed: examSession.passed,
      categoryCode: examSession.categoryCode,
    })
  }

  // Calculate remaining time
  const now = new Date()
  const totalTimeSecs = examSession.expiresAt
    ? Math.max(0, Math.floor((examSession.expiresAt.getTime() - now.getTime()) / 1000))
    : 0

  // If expired, auto-submit
  if (totalTimeSecs <= 0) {
    return apiError('Session has expired. Please submit.', 410)
  }

  const rules = await getBankRules(examSession.bankId)

  // Extract questions and saved answers
  const questions = examSession.answers.map(a => a.question)
  const savedAnswers = examSession.answers.map(a => ({
    questionId: a.questionId,
    selectedAnswer: a.selectedAnswer,
  }))

  return apiSuccess({
    sessionId: examSession.id,
    questions,
    savedAnswers,
    resumed: true,
    totalTimeSecs,
    expiresAt: examSession.expiresAt?.toISOString(),
    categoryCode: examSession.categoryCode,
    rules: {
      timePerQuestionSecs: rules.timePerQuestionSecs,
      passMarkPct: rules.passMarkPct,
      allowKeyboardAutoSubmit: rules.allowKeyboardAutoSubmit,
    },
  })
})
