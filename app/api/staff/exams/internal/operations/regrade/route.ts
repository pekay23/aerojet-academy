import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { getBankRules } from '@/lib/internal-exam/engine'
import { z } from 'zod'

const regradeSchema = z.object({
  sessionIds: z.array(z.string()).min(1),
})

/**
 * POST /api/staff/exams/internal/operations/regrade
 * Re-evaluates all answers in the specified sessions against the CURRENT correct answers
 * in the question bank. Use after admin fixes a question's correct answer.
 */
export const POST = withErrorHandler(async (req: NextRequest, _ctx: any) => {
  await requireStaff()

  const body = await req.json()
  const parsed = regradeSchema.safeParse(body)
  if (!parsed.success) return apiError('Provide an array of session IDs')

  const { sessionIds } = parsed.data

  const results: { sessionId: string; oldPct: number | null; newPct: number | null; changed: boolean }[] = []

  for (const sessionId of sessionIds) {
    const session = await prismaUnfiltered.internalExamSession.findUnique({
      where: { id: sessionId },
      include: {
        answers: {
          include: {
            question: { select: { id: true, correctAnswer: true, points: true } },
          },
        },
      },
    })

    if (!session || session.status === 'VOIDED' || session.status === 'IN_PROGRESS') {
      results.push({ sessionId, oldPct: null, newPct: null, changed: false })
      continue
    }

    const oldPct = session.percentage

    // Get pass mark from engine rules
    const rules = await getBankRules(session.bankId)

    let totalScore = 0
    let totalPoints = 0

    // Re-evaluate each answer
    for (const answer of session.answers) {
      const question = answer.question
      totalPoints += question.points

      const wasCorrect = answer.isCorrect
      const isNowCorrect =
        answer.selectedAnswer !== null &&
        answer.selectedAnswer === question.correctAnswer
      const pointsAwarded = isNowCorrect ? question.points : 0

      if (wasCorrect !== isNowCorrect || answer.pointsAwarded !== pointsAwarded) {
        await prismaUnfiltered.internalExamAnswer.update({
          where: { id: answer.id },
          data: { isCorrect: isNowCorrect, pointsAwarded },
        })
      }

      totalScore += pointsAwarded
    }

    const newPct = totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0
    const passed = newPct >= rules.passMarkPct

    // Update session scores
    await prismaUnfiltered.internalExamSession.update({
      where: { id: sessionId },
      data: {
        score: totalScore,
        totalPoints,
        percentage: newPct,
        passed,
      },
    })

    results.push({
      sessionId,
      oldPct,
      newPct,
      changed: oldPct !== newPct,
    })
  }

  const changedCount = results.filter(r => r.changed).length

  return apiSuccess({
    regraded: results.length,
    changed: changedCount,
    details: results,
  })
})
