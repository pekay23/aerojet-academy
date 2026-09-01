import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { getBankRules } from '@/lib/internal-exam/engine'

const endSchema = z.object({
  reason: z.string().min(1).max(500).optional(),
})

/**
 * POST /api/staff/exams/internal/sessions/[id]/end
 * Force-ends an in-progress exam session by staff. Grades whatever answers
 * the student has saved so far and marks the session COMPLETED (timed-out).
 * This is the "End Exam Now" action triggered from the ViolationReviewPanel
 * when a CRITICAL violation warrants immediate termination.
 */
export const POST = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const staff = await requireStaff()
  const { id } = await ctx.params

  const body = await req.json()
  const parsed = endSchema.safeParse(body)
  if (!parsed.success) return apiError('Invalid input')

  const reason = parsed.data.reason || 'Admin force-end due to violation'

  const examSession = await prismaUnfiltered.internalExamSession.findUnique({
    where: { id },
    include: {
      answers: {
        include: {
          question: { select: { correctAnswer: true, points: true } },
        },
      },
      bank: { select: { id: true, moduleCode: true } },
      student: { select: { id: true, email: true } },
    },
  })

  if (!examSession) return apiError('Session not found', 404)
  if (examSession.status !== 'IN_PROGRESS' && examSession.status !== 'NOT_STARTED') {
    return apiError(`Cannot force-end a session in ${examSession.status} status`)
  }

  const now = new Date()
  let score = 0
  let totalPoints = 0

  await prismaUnfiltered.$transaction(async (tx) => {
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
          answeredAt: ans.answeredAt ?? now,
        },
      })
    }

    const rules = await getBankRules(examSession.bankId)
    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100 * 10) / 10 : 0

    await tx.internalExamSession.update({
      where: { id },
      data: {
        status: 'TIMED_OUT',
        submittedAt: now,
        autoSubmitted: true,
        score,
        totalPoints,
        percentage,
        passed: percentage >= rules.passMarkPct,
        voidReason: reason,
      },
    })
  })

  const rules = await getBankRules(examSession.bankId)
  const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100 * 10) / 10 : 0

  await createAuditLog({
    userId: staff.id,
    action: AuditAction.EXAM_SESSION_FORCE_SUBMITTED,
    entity: 'InternalExamSession',
    entityId: id,
    description: `Staff force-ended session ${id}: ${reason}`,
    changes: {
      before: { status: examSession.status },
      after: {
        status: 'TIMED_OUT',
        score,
        totalPoints,
        percentage,
        passed: percentage >= rules.passMarkPct,
        autoSubmitted: true,
        submittedAt: now.toISOString(),
      },
    },
  })

  return apiSuccess({
    ended: true,
    sessionId: id,
    score,
    totalPoints,
    percentage,
    passed: percentage >= rules.passMarkPct,
  })
})
