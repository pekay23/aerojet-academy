import { NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { getBankRules, isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { validateSebRequest, SebValidationError } from '@/lib/middleware/seb-validation'

/**
 * GET /api/student/exams/internal/session?sessionId=xxx
 * Returns the current session data for resume/load.
 * Strips correct answers from questions.
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
    return apiError('Only enrolled students may view internal exam sessions', 403)
  }

  const url = new URL(req.url)
  const sessionId = url.searchParams.get('sessionId')
  if (!sessionId) return apiError('sessionId is required')

  // SEB validation if required by schedule
  const examSessionForSeb = await prismaUnfiltered.internalExamSession.findUnique({
    where: { id: sessionId },
    select: { bankId: true, classId: true },
  })
  if (examSessionForSeb?.bankId && examSessionForSeb?.classId) {
    const scheduleForSeb = await prismaUnfiltered.internalExamClassSchedule.findFirst({
      where: { bankId: examSessionForSeb.bankId, classId: examSessionForSeb.classId },
      select: { sebRequired: true },
    })
    if (scheduleForSeb?.sebRequired) {
      try {
        await validateSebRequest(sessionId, req)
      } catch (error) {
        if (error instanceof SebValidationError) {
          return apiError(error.message, error.statusCode)
        }
        return apiError('SEB validation failed', 403)
      }
    }
  }

  const examSession = await prismaUnfiltered.internalExamSession.findUnique({
    where: { id: sessionId },
    include: {
      answers: {
        select: {
          questionId: true,
          selectedAnswer: true,
          flaggedForReview: true,
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

  if (examSession.status === 'IN_PROGRESS') {
    try {
      await validateSebRequest(examSession.id, req)
    } catch (err) {
      if (err instanceof SebValidationError) {
        return apiError(err.message, err.statusCode)
      }
      return apiError('SEB validation failed', 403)
    }
  }

  // If session is completed, return full results if published
  if (examSession.status !== 'IN_PROGRESS') {
    const rules = await getBankRules(examSession.bankId)

    if (!examSession.isPublished) {
      return apiSuccess({
        completed: true,
        sessionId: examSession.id,
        status: examSession.status,
        score: examSession.score,
        totalPoints: examSession.totalPoints,
        percentage: examSession.percentage,
        passed: examSession.passed,
        categoryCode: examSession.categoryCode,
        passMarkPct: rules.passMarkPct,
      })
    }

    const answersWithQuestions = await prismaUnfiltered.internalExamAnswer.findMany({
      where: { sessionId },
      include: {
        question: {
          select: {
            id: true,
            text: true,
            options: true,
            points: true,
            subTopic: true,
            correctAnswer: true,
            explanation: true,
          },
        },
      },
    })

    return apiSuccess({
      completed: true,
      sessionId: examSession.id,
      status: examSession.status,
      score: examSession.score,
      totalPoints: examSession.totalPoints,
      percentage: examSession.percentage,
      passed: examSession.passed,
      categoryCode: examSession.categoryCode,
      passMarkPct: rules.passMarkPct,
      isPublished: true,
      questions: answersWithQuestions.map(a => ({
        id: a.question.id,
        text: a.question.text,
        options: a.question.options,
        points: a.question.points,
        subTopic: a.question.subTopic,
        correctAnswer: a.question.correctAnswer,
        explanation: a.question.explanation,
        studentAnswer: a.selectedAnswer,
        isCorrect: a.isCorrect,
        pointsAwarded: a.pointsAwarded,
        flaggedForReview: a.flaggedForReview,
      })),
    })
  }

  const now = new Date()
  const effectiveExpiresAt = examSession.expiresAt
    ? new Date(examSession.expiresAt.getTime() + (examSession.timeExtensionSec || 0) * 1000)
    : null
  const totalTimeSecs = effectiveExpiresAt
    ? Math.max(0, Math.floor((effectiveExpiresAt.getTime() - now.getTime()) / 1000))
    : 0

  // If expired, auto-submit
  if (totalTimeSecs <= 0) {
    return apiError('Session has expired. Please submit.', 410)
  }

  const rules = await getBankRules(examSession.bankId)

  let questions = examSession.answers.map(a => a.question)
  const savedAnswers = examSession.answers.map(a => ({
    questionId: a.questionId,
    selectedAnswer: a.selectedAnswer,
    flaggedForReview: a.flaggedForReview,
  }))

  // Apply stored question order for randomised papers
  if (examSession.questionOrder && Array.isArray(examSession.questionOrder)) {
    const orderSet = new Set(examSession.questionOrder as string[])
    const ordered = (examSession.questionOrder as string[])
      .map((qId) => questions.find(q => q.id === qId))
      .filter((q): q is NonNullable<typeof questions[number]> => q != null)
    // Append any questions not in the order (shouldn't happen, but defensive)
    const remaining = questions.filter(q => !orderSet.has(q.id))
    questions = [...ordered, ...remaining]
  }

  return apiSuccess({
    sessionId: examSession.id,
    status: examSession.status,
    questions,
    savedAnswers,
    resumed: true,
    totalTimeSecs,
    expiresAt: examSession.expiresAt?.toISOString(),
    effectiveExpiresAt: effectiveExpiresAt?.toISOString(),
    timeExtensionSec: examSession.timeExtensionSec || 0,
    timeExtensionRecoveredAt: examSession.timeExtensionRecoveredAt?.toISOString(),
    lastActivityAt: examSession.lastActivityAt?.toISOString(),
    recoveredAt: examSession.recoveredAt?.toISOString(),
    recoveredBy: examSession.recoveredBy || null,
    recoveryReason: examSession.recoveryReason || null,
    supervised: examSession.supervised,
    categoryCode: examSession.categoryCode,
    rules: {
      timePerQuestionSecs: rules.timePerQuestionSecs,
      passMarkPct: rules.passMarkPct,
      allowKeyboardAutoSubmit: rules.allowKeyboardAutoSubmit,
    },
  })
})
