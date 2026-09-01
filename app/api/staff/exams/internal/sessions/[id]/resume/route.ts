import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'

export const POST = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const session = await requireStaff()
  const { id } = await ctx.params
  const body = await req.json().catch(() => ({}))
  const { reason = 'Resumed by instructor' } = body as { reason?: string }

  const examSession = await prismaUnfiltered.internalExamSession.findUnique({
    where: { id },
    select: { id: true, status: true },
  })
  if (!examSession) return apiError('Session not found', 404)

  const updated = await prismaUnfiltered.internalExamSession.update({
    where: { id },
    data: {
      recoveredAt: new Date(),
      recoveredBy: session.id,
      recoveryReason: reason,
    },
  })

  await createAuditLog({
    userId: session.id,
    action: AuditAction.EXAM_SESSION_RESUMED,
    entity: 'InternalExamSession',
    entityId: id,
    description: `Resumed exam session ${id}: ${reason}`,
    changes: { recoveredAt: updated.recoveredAt, recoveredBy: session.id, recoveryReason: reason },
  })

  return apiSuccess({ success: true, recoveredAt: updated.recoveredAt })
})
