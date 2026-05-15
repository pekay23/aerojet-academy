import { NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { getBankRules, EASA_DEFAULTS, isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { z } from 'zod'

const submitSchema = z.object({
  sessionId: z.string(),
  answers: z.array(z.object({
    questionId: z.string(),
    selectedAnswer: z.string(),
  })),
  autoSubmitted: z.boolean().optional(),
})

// POST /api/student/exams/internal/submit — submit exam answers
export const POST = withErrorHandler(async (req: NextRequest, _ctx: any) => {
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
  if (examSession.status !== 'IN_PROGRESS') return apiError('Session already submitted')

  // Check expiry — if expired, force auto-submit with TIMED_OUT status
  const now = new Date()
  const isExpired = examSession.expiresAt && now > examSession.expiresAt
  const finalStatus = isExpired ? 'TIMED_OUT' : 'COMPLETED'

  // Grade answers and update everything in a single transaction
  const result = await prismaUnfiltered.$transaction(async (tx) => {
    let score = 0
    let totalPoints = 0

    // Grade each answer
    for (const ans of examSession.answers) {
      const studentAnswer = answers.find(a => a.questionId === ans.questionId)
      const isCorrect = studentAnswer?.selectedAnswer === ans.question.correctAnswer
      const pointsAwarded = isCorrect ? ans.question.points : 0

      score += pointsAwarded
      totalPoints += ans.question.points

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

    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100 * 10) / 10 : 0
    const rules = await getBankRules(examSession.bankId)
    const passed = percentage >= rules.passMarkPct

    // Calculate retake date and ban logic
    const retakeEligibleAt = new Date(now.getTime() + rules.retakeWaitDays * 24 * 60 * 60 * 1000)

    // Check if this triggers a ban (3 consecutive failures)
    let banLiftDate: Date | null = null
    if (!passed) {
      const previousFails = await tx.internalExamSession.count({
        where: {
          studentId: session.user.id,
          bankId: examSession.bankId,
          passed: false,
          status: { in: ['COMPLETED', 'TIMED_OUT'] },
          id: { not: sessionId }, // exclude current session
        },
      })
      // +1 for current attempt
      if (rules.maxRetakes && (previousFails + 1) >= rules.maxRetakes) {
        banLiftDate = new Date(now.getTime() + EASA_DEFAULTS.banDurationMonths * 30 * 24 * 60 * 60 * 1000)
      }
    }

    // Update session — all in one atomic transaction
    await tx.internalExamSession.update({
      where: { id: sessionId },
      data: {
        status: finalStatus as any,
        submittedAt: now,
        autoSubmitted: autoSubmitted || isExpired || false,
        ...(autoSubmitted && !isExpired ? { keyboardEvents: { increment: 1 } } : {}),
        score,
        totalPoints,
        percentage,
        passed,
        retakeEligibleAt,
        banLiftDate,
      },
    })

    return { score, totalPoints, percentage, passed, rules, retakeEligibleAt, banLiftDate }
  })

  return apiSuccess({
    score: result.score,
    totalPoints: result.totalPoints,
    percentage: result.percentage,
    passed: result.passed,
    passMarkPct: result.rules.passMarkPct,
    timedOut: isExpired,
    retakeEligibleAt: result.retakeEligibleAt.toISOString(),
    banned: !!result.banLiftDate,
    banLiftDate: result.banLiftDate?.toISOString() || null,
  })
})
