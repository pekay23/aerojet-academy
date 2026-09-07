import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler , RouteContext } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'

export const POST = withErrorHandler(async (req: NextRequest, ctx?: RouteContext) => {
  const session = await requireStaff()
  const { id } = (await ctx!.params) as { id: string }
  const body = await req.json().catch(() => ({}))
  const { timeExtensionSec = 300 } = body as { timeExtensionSec?: number }

  if (typeof timeExtensionSec !== 'number' || timeExtensionSec <= 0 || timeExtensionSec > 600) {
    return apiError('timeExtensionSec must be between 1 and 600 seconds', 400)
  }

  const examSession = await prismaUnfiltered.internalExamSession.findUnique({
    where: { id },
    select: { id: true, status: true, expiresAt: true },
  })
  if (!examSession) return apiError('Session not found', 404)
  if (examSession.status !== 'IN_PROGRESS') return apiError('Session is not in progress', 400)

  const updated = await prismaUnfiltered.internalExamSession.update({
    where: { id },
    data: {
      timeExtensionSec: { increment: timeExtensionSec },
    },
  })

  await createAuditLog({
    userId: session.id,
    action: AuditAction.EXAM_SESSION_EXTENDED,
    entity: 'InternalExamSession',
    entityId: id,
    description: `Extended exam session ${id} by ${timeExtensionSec}s`,
    changes: { timeExtensionSec, newExpiresAt: updated.expiresAt },
  })

  return apiSuccess({ success: true, timeExtensionSec: updated.timeExtensionSec, expiresAt: updated.expiresAt })
})
