import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requirePermission, PERMISSIONS } from '@/lib/auth/permissions'
import { apiSuccess, apiError, apiNotFound, withErrorHandler , RouteContext } from '@/lib/api/response'
import { executeGo, executeNoGo, executePostponement } from '@/lib/events/go-no-go'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

export const POST = withErrorHandler(
  async (req: NextRequest, ctx: RouteContext<{ id: string }>) => {
    const admin = await requirePermission(PERMISSIONS.MANAGE_EXAMS)

    const id = (await ctx!.params).id
    if (!id) return apiError('Event ID required')

    const body = await req.json()
    const { decision, newStartDate, newEndDate } = body // 'go' | 'no_go' | 'postpone'

    if (!['go', 'no_go', 'postpone'].includes(decision)) {
      return apiError('Decision must be "go", "no_go", or "postpone"')
    }

    const event = await prismaUnfiltered.examEvent.findUnique({ where: { id } })
    if (!event) return apiNotFound('Event not found')

    let result: Record<string, unknown>

    if (decision === 'go') {
      result = await executeGo(id, admin.id)
    } else if (decision === 'no_go') {
      result = await executeNoGo(id, admin.id)
    } else {
      if (!newStartDate || !newEndDate) {
        return apiError('newStartDate and newEndDate required for postponement')
      }
      result = await executePostponement(id, new Date(newStartDate), new Date(newEndDate), admin.id)
    }

    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'ExamEvent',
      entityId: id,
      userId: admin.id,
      details: { decision, ...result },
    })

    return apiSuccess({ decision, ...result })
  }
)
