import { NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { getBankRules, isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { calculateScore } from '@/lib/internal-exam/grading'
import { z } from 'zod'
import { validateSessionTransition } from '@/lib/internal-exam/state-machine'

const submitSchema = z.object({
  sessionId: z.string(),
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedAnswer: z.string(),
    })
  ),
  autoSubmitted: z.boolean().optional(),
})

// POST /api/student/exams/internal/submit — submit exam answers
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
    return apiError('Only enrolled students may submit internal exams', 403)
  }

  const body = await req.json()
  const parsed = submitSchema.safeParse(body)
  if (!parsed.success) return apiError('Invalid input')

  const { sessionId, answers, autoSubmitted } = parsed.data

  // Load session with answers
  const examSession = await prismaUnfiltered.internalExamSession.findUnique({
    where: { id: sessionId },
    include: {
      answers: { include: { question: { select: { correctAnswer: true, points: true } } } },
      bank: { select: { id: true } },
    },
  })

  if (!examSession) return apiError('Session not found', 404)
  if (examSession.studentId !== session.user.id) return apiError('Unauthorized', 403)

  const now = new Date()
  const isExpired = examSession.expiresAt && now > examSession.expiresAt
  const finalStatus = isExpired ? 'TIMED_OUT' : 'COMPLETED'

  try {
    validateSessionTransition(examSession.status, finalStatus)
  } catch {
    return apiError('Session cannot be submitted from current status', 403)
  }

  // Grade answers and update everything in a single transaction
  const _result = await prismaUnfiltered.$transaction(async (tx) => {
    const responses = answers.map((a) => ({
      questionId: a.questionId,
      selectedAnswer: a.selectedAnswer,
    }))
    const gradableAnswers = examSession.answers.map((a) => ({
      questionId: a.questionId,
      correctAnswer: a.question.correctAnswer,
      points: a.question.points,
    }))

    const rules = await getBankRules(examSession.bankId)
    const { score, totalPoints, percentage, passed } = calculateScore(
      responses,
      gradableAnswers,
      rules.passMarkPct
    )

    for (const ans of examSession.answers) {
      const studentAnswer = answers.find((a) => a.questionId === ans.questionId)
      const isCorrect = studentAnswer?.selectedAnswer === ans.question.correctAnswer
      const pointsAwarded = isCorrect ? ans.question.points : 0

      await tx.internalExamAnswer.update({
        where: { id: ans.id },
        data: {
          selectedAnswer: studentAnswer?.selectedAnswer || null,
          isCorrect,
          pointsAwarded,
          answeredAt: now,
        },
      })
    }
    // Single-attempt policy: `checkEligibility` blocks any retake of a
    // non-VOIDED COMPLETED/TIMED_OUT session, and only an admin void
    // clears the block. We deliberately do NOT compute retakeEligibleAt
    // or banLiftDate here — those vestigial columns from the prior
    // multi-attempt model are left as `null` so reports surface the
    // current policy honestly.
    await tx.internalExamSession.update({
      where: { id: sessionId },
      data: {
        status: finalStatus,
        submittedAt: now,
        autoSubmitted: autoSubmitted || isExpired || false,
        ...(autoSubmitted && !isExpired ? { keyboardEvents: { increment: 1 } } : {}),
        score,
        totalPoints,
        percentage,
        passed,
      },
    })

    return { score, totalPoints, percentage, passed, rules }
  })

  // Do NOT return scores to students — results are pending admin review
  return apiSuccess({
    submitted: true,
    pendingReview: true,
    timedOut: isExpired,
  })
})
