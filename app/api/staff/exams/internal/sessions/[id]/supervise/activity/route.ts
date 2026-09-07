import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler, RouteContext } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { getRequestContext } from '@/lib/server/request-context'

export const POST = withErrorHandler(async (req: NextRequest, ctx: RouteContext<{ id: string }>) => {
  const staff = await requireStaff()
  const { id } = (await ctx!.params) as { id: string }
  const body = await req.json()
  const { type, description, studentName, studentEmail, bankName, className } = body || {}

  if (!type || !description) {
    return apiError('type and description are required', 400)
  }

  const requestContext = await getRequestContext()
  await createAuditLog({
    userId: staff.id,
    action: AuditAction.EXAM_SESSION_STARTED,
    entity: 'InternalExamSession',
    entityId: id,
    description: `[Supervised] ${type}: ${description}`,
    changes: { studentName, studentEmail, bankName, className, type, description },
    ipAddress: requestContext.ipAddress ?? undefined,
    userAgent: requestContext.userAgent ?? undefined,
  })

  return apiSuccess({ success: true })
})
