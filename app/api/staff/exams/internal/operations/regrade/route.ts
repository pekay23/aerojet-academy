import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { isInternalExamSystemEnabled, getBankRules } from '@/lib/internal-exam/engine'
import { calculateScore } from '@/lib/internal-exam/grading'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { z } from 'zod'

const regradeSchema = z.object({
  sessionIds: z.array(z.string()).min(1).max(500),
})

/**
 * POST /api/staff/exams/internal/operations/regrade
 * Re-evaluates all answers in the specified sessions against the CURRENT correct answers
 * in the question bank. Use after admin fixes a question's correct answer.
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const staff = await requireStaff()

  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }

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

    const rules = await getBankRules(session.bankId)

    const responses = session.answers.map(a => ({
      questionId: a.question.id,
      selectedAnswer: a.selectedAnswer || '',
    }))
    const gradableAnswers = session.answers.map(a => ({
      questionId: a.question.id,
      correctAnswer: a.question.correctAnswer,
      points: a.question.points,
    }))

    const { score: totalScore, totalPoints, percentage: newPct, passed } = calculateScore(
      responses,
      gradableAnswers,
      rules.passMarkPct,
    )

    for (const answer of session.answers) {
      const question = answer.question
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
    }
    // Update session scores. Re-check status atomically in the DB so a
    // session that flips to IN_PROGRESS/VOIDED between the guard above and
    // the write is skipped — updateMany is non-throwing on zero matching rows.
    const upd = await prismaUnfiltered.internalExamSession.updateMany({
      where: {
        id: sessionId,
        status: { notIn: ['VOIDED', 'IN_PROGRESS'] },
      },
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
      changed: upd.count > 0 && oldPct !== newPct,
    })
  }

  const changedCount = results.filter(r => r.changed).length

  await createAuditLog({
    userId: staff.id,
    action: AuditAction.UPDATE,
    entity: 'InternalExamSession',
    entityId: `batch:${results.length}`,
    description: `Regraded ${results.length} internal exam session(s); ${changedCount} score(s) changed`,
    changes: {
      sessionIds,
      before: { scores: results.map((r) => ({ sessionId: r.sessionId, oldPct: r.oldPct })) },
      after: { scores: results.map((r) => ({ sessionId: r.sessionId, newPct: r.newPct, changed: r.changed })) },
    },
  })

  return apiSuccess({
    regraded: results.length,
    changed: changedCount,
    details: results,
  })
})
