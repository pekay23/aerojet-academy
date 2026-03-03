import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { mergePools } from '@/lib/events/go-no-go'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

/**
 * POST — Merge a source pool into a target pool.
 * Used when a pool is below threshold and needs to be combined.
 */
export const POST = withErrorHandler(
  async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
    const admin = await requireStaff()
    if (admin.role !== 'ADMIN' && admin.role !== 'SUPER_ADMIN') {
      return apiError('Unauthorized — admin access required', 403)
    }

    const { sourcePoolId, targetPoolId } = await req.json()
    if (!sourcePoolId || !targetPoolId) {
      return apiError('sourcePoolId and targetPoolId are required')
    }

    const result = await mergePools(sourcePoolId, targetPoolId, admin.id)

    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'ExamPool',
      entityId: targetPoolId,
      userId: admin.id,
      details: { mergedFrom: sourcePoolId, movedMembers: result.movedMembers },
    })

    return apiSuccess(result)
  }
)
