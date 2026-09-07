import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler , RouteContext } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'

export const POST = withErrorHandler(async (req: NextRequest, ctx?: RouteContext) => {
  const session = await requireStaff()
  const { id } = (await ctx!.params) as { id: string }

  const examSession = await prismaUnfiltered.internalExamSession.findUnique({
    where: { id },
    select: { id: true, status: true },
  })
  if (!examSession) return apiError('Session not found', 404)
  if (examSession.status !== 'IN_PROGRESS') return apiError('Session is not in progress', 400)

  const updated = await prismaUnfiltered.internalExamSession.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      autoSubmitted: true,
      submittedAt: new Date(),
      voidReason: 'Ended by instructor',
    },
  })

  await createAuditLog({
    userId: session.id,
    action: AuditAction.EXAM_SESSION_FORCE_SUBMITTED,
    entity: 'InternalExamSession',
    entityId: id,
    description: `Strictly ended exam session ${id}`,
    changes: { status: 'COMPLETED', autoSubmitted: true, voidReason: 'Ended by instructor' },
  })

  return apiSuccess({ success: true, status: updated.status })
})
