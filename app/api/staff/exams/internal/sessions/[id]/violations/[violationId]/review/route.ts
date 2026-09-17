import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler, RouteContext } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'
import { z } from 'zod'
import { transitionExamSession } from '@/lib/internal-exam/state-machine'

const reviewSchema = z.object({
  outcome: z.enum(['GRACIOUS', 'STRICT', 'DISMISSED']),
  reviewNote: z.string().optional(),
})

export const PATCH = withErrorHandler(async (req: NextRequest, ctx?: RouteContext) => {
  const session = await requireStaff()
  const { id, violationId } = (await ctx!.params) as { id: string; violationId: string }
  const body = reviewSchema.safeParse(await req.json())
  if (!body.success) return apiError(body.error.issues.map((i) => i.message).join('; '), 400)

  const violation = await prismaUnfiltered.internalExamViolation.findFirst({
    where: { id: violationId, sessionId: id },
  })
  if (!violation) return apiError('Violation not found', 404)

  const updated = await prismaUnfiltered.internalExamViolation.update({
    where: { id: violationId },
    data: {
      reviewOutcome: body.data.outcome,
      reviewedAt: new Date(),
      reviewedBy: session.id,
    },
  })

  if (body.data.outcome === 'STRICT') {
    await transitionExamSession(
      id,
      'COMPLETED',
      session.id,
      'Ended by instructor via violation review',
      { autoSubmitted: true, submittedAt: new Date(), voidReason: 'Ended by instructor' }
    )
  }

  await createAuditLog({
    userId: session.id,
    action: AuditAction.EXAM_VIOLATION_REVIEWED,
    entity: 'InternalExamViolation',
    entityId: violationId,
    description: `Reviewed violation ${violationId}: ${body.data.outcome}`,
    changes: { outcome: body.data.outcome },
  })

  return apiSuccess(updated)
})
