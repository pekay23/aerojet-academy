import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'
import { z } from 'zod'

const reviewSchema = z.object({
  outcome: z.enum(['GRACIOUS', 'STRICT', 'DISMISSED']),
  reviewNote: z.string().optional(),
})

export const PATCH = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string; violationId: string }> }) => {
  const session = await requireStaff()
  const { id, violationId } = await ctx.params
  const body = reviewSchema.safeParse(await req.json())
  if (!body.success) return apiError(body.error.issues.map(i => i.message).join('; '), 400)

  const violation = await prismaUnfiltered.internalExamViolation.findFirst({
    where: { id: violationId, sessionId: id },
  })
  if (!violation) return apiError('Violation not found', 404)

  const updated = await prismaUnfiltered.internalExamViolation.update({
    where: { id: violationId },
    data: {
      reviewOutcome: body.data.outcome,
      reviewNote: body.data.reviewNote,
      reviewedAt: new Date(),
      reviewedBy: session.id,
    },
  })

  if (body.data.outcome === 'STRICT') {
    await prismaUnfiltered.internalExamSession.update({
      where: { id },
      data: { status: 'COMPLETED', autoSubmitted: true, submittedAt: new Date(), voidReason: 'Ended by instructor' },
    })
  }

  await createAuditLog({
    userId: session.id,
    action: AuditAction.EXAM_VIOLATION_REVIEWED,
    entity: 'InternalExamViolation',
    entityId: violationId,
    description: `Reviewed violation ${violationId}: ${body.data.outcome}`,
    changes: { outcome: body.data.outcome, reviewNote: body.data.reviewNote },
  })

  return apiSuccess(updated)
})
