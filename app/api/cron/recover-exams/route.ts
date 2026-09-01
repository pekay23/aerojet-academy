import { NextRequest } from 'next/server'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

/**
 * POST /api/cron/recover-exams
 *
 * Recovery cron for expired exam attempts that were not auto-submitted.
 * Runs on a short interval (e.g. every 60s) and on server startup.
 * Gates on CRON_SECRET to prevent unauthorised access.
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return apiError('Unauthorized', 401)
  }

  const now = new Date()

  // Find expired IN_PROGRESS sessions that haven't been recovered
  const expiredSessions = await prismaUnfiltered.internalExamSession.findMany({
    where: {
      status: 'IN_PROGRESS',
      expiresAt: { lte: now },
      submittedAt: null,
    },
    include: {
      answers: { include: { question: true } },
      bank: { select: { id: true, name: true } },
      student: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  })

  let recovered = 0
  for (const session of expiredSessions) {
    // Calculate score
    let score = 0
    let totalPoints = 0
    for (const answer of session.answers) {
      totalPoints += answer.question.points
      if (answer.selectedAnswer && answer.selectedAnswer === answer.question.correctAnswer) {
        score += answer.question.points
      }
    }

    const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0
    const rules = await prismaUnfiltered.internalExamRuleOverride.findUnique({
      where: { bankId: session.bankId },
    })
    const passMarkPct = rules?.passMarkPct ?? 75
    const passed = percentage >= passMarkPct

    await prismaUnfiltered.internalExamSession.update({
      where: { id: session.id },
      data: {
        status: 'TIMED_OUT',
        submittedAt: now,
        autoSubmitted: true,
        score,
        totalPoints,
        percentage,
        passed,
      },
    })

    await createAuditLog({
      action: AuditAction.EXAM_SESSION_SUBMITTED,
      userId: session.student.id,
      entity: 'InternalExamSession',
      entityId: session.id,
      description: `Auto-submitted expired exam session for ${session.student.firstName} ${session.student.lastName}`,
      details: {
        bankId: session.bankId,
        bankName: session.bank.name,
        score,
        totalPoints,
        percentage,
        passed,
        autoSubmitted: true,
        reason: 'expired',
      },
    })

    recovered++
  }

  return apiSuccess({
    recovered,
    scannedAt: now.toISOString(),
  })
})
