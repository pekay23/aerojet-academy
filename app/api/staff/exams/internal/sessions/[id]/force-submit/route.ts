import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler , RouteContext } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'
import { getBankRules } from '@/lib/internal-exam/engine'

export const POST = withErrorHandler(async (req: NextRequest, ctx?: RouteContext) => {
  const staff = await requireStaff()
  const { id } = (await ctx!.params) as { id: string }

  const examSession = await prismaUnfiltered.internalExamSession.findUnique({
    where: { id },
    include: {
      answers: { include: { question: { select: { correctAnswer: true, points: true } } } },
      bank: { select: { id: true, moduleCode: true } },
    },
  })
  if (!examSession) return apiError('Session not found', 404)
  if (examSession.status !== 'IN_PROGRESS') return apiError('Session is not in progress', 400)

  const now = new Date()

  const result = await prismaUnfiltered.$transaction(async (tx) => {
    let score = 0
    let totalPoints = 0

    for (const ans of examSession.answers) {
      const isCorrect = ans.selectedAnswer === ans.question.correctAnswer
      const pointsAwarded = isCorrect ? ans.question.points : 0
      score += pointsAwarded
      totalPoints += ans.question.points

      await tx.internalExamAnswer.update({
        where: { id: ans.id },
        data: {
          isCorrect,
          pointsAwarded,
          answeredAt: ans.answeredAt || now,
        },
      })
    }

    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100 * 10) / 10 : 0
    const rules = await getBankRules(examSession.bankId)
    const passed = percentage >= rules.passMarkPct

    await tx.internalExamSession.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        autoSubmitted: true,
        submittedAt: now,
        score,
        totalPoints,
        percentage,
        passed,
      },
    })

    return { score, totalPoints, percentage, passed }
  })

  await createAuditLog({
    userId: staff.id,
    action: AuditAction.EXAM_SESSION_FORCE_SUBMITTED,
    entity: 'InternalExamSession',
    entityId: id,
    description: `Force-submitted exam session ${id}`,
    changes: { status: 'COMPLETED', autoSubmitted: true, ...result },
  })

  return apiSuccess({ success: true, status: 'COMPLETED', submittedAt: now.toISOString(), ...result })
})
