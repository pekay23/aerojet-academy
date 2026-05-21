import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { createAuditLog } from '@/lib/audit/logger'

const voidSchema = z.object({
  sessionId: z.string(),
  reason: z.string().min(1).max(500).optional(),
})

/**
 * POST /api/staff/exams/internal/operations/void
 * Voids an exam session so the student can retake. The original session
 * is kept as VOIDED with `voidedAt`/`voidedBy`/`voidReason` set for the
 * audit trail; any pending reports tied to it are resolved.
 *
 * Voiding is the single legitimate retake path under the single-attempt
 * policy enforced by `lib/internal-exam/engine.ts:checkEligibility`.
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const staff = await requireStaff()

  const body = await req.json()
  const parsed = voidSchema.safeParse(body)
  if (!parsed.success) return apiError('Invalid input — sessionId required')

  const { sessionId, reason } = parsed.data
  const voidReason = reason || 'Admin-initiated void/reset'

  const before = await prismaUnfiltered.internalExamSession.findUnique({
    where: { id: sessionId },
    select: { id: true, studentId: true, bankId: true, status: true, categoryCode: true },
  })

  if (!before) return apiError('Session not found', 404)
  if (before.status === 'VOIDED') return apiError('Session is already voided')

  await prismaUnfiltered.internalExamSession.update({
    where: { id: sessionId },
    data: {
      status: 'VOIDED',
      voidedAt: new Date(),
      voidedBy: staff.id,
      voidReason,
    },
  })

  // Auto-resolve any pending student-issued reports for this session
  const resolved = await prismaUnfiltered.internalExamReport.updateMany({
    where: { sessionId, status: 'PENDING' },
    data: { status: 'RESOLVED', resolvedAt: new Date() },
  })

  await createAuditLog({
    userId: staff.id,
    action: 'UPDATE',
    entity: 'InternalExamSession',
    entityId: sessionId,
    description: `Voided internal exam session for retake: ${voidReason}`,
    changes: {
      before: { status: before.status },
      after: { status: 'VOIDED', voidedBy: staff.id, voidReason },
      resolvedReportCount: resolved.count,
    },
  })

  return apiSuccess({ voided: true, sessionId })
})
