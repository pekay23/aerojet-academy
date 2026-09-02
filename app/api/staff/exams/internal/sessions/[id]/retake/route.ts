import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireSuperAdmin } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

const retakeSchema = z.object({
  sessionId: z.string(),
  reason: z.string().min(1).max(500).optional(),
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const admin = await requireSuperAdmin()

  const body = await req.json()
  const parsed = retakeSchema.safeParse(body)
  if (!parsed.success) return apiError('Invalid input — sessionId required')

  const { sessionId, reason } = parsed.data
  const retakeReason = reason || 'Admin-initiated retake'

  const original = await prismaUnfiltered.internalExamSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      studentId: true,
      bankId: true,
      status: true,
      attemptNumber: true,
      categoryCode: true,
    },
  })

  if (!original) return apiError('Session not found', 404)
  if (original.status !== 'VOIDED') return apiError('Session must be VOIDED before retake')

  const newSession = await prismaUnfiltered.internalExamSession.create({
    data: {
      studentId: original.studentId,
      bankId: original.bankId,
      classId: null,
      sittingId: null,
      ruleSet: 'STANDARD',
      status: 'NOT_STARTED',
      attemptNumber: original.attemptNumber + 1,
      categoryCode: original.categoryCode,
    },
  })

  await createAuditLog({
    userId: admin.id,
    action: AuditAction.CREATE,
    entity: 'InternalExamSession',
    entityId: newSession.id,
    description: `Retake session created for student ${original.studentId} from voided session ${sessionId}: ${retakeReason}`,
    changes: {
      originalSessionId: sessionId,
      newSessionId: newSession.id,
      attemptNumber: newSession.attemptNumber,
      reason: retakeReason,
    },
  })

  return apiSuccess({ retakeSession: newSession })
})
