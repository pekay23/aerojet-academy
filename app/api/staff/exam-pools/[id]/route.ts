import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler , RouteContext } from '@/lib/api/response'
import { getPoolWithDetails } from '@/lib/pools/operations'
import { updateExamPoolSchema, validateBody } from '@/lib/validation/schemas'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

export const GET = withErrorHandler(
  async (req: NextRequest, ctx?: RouteContext) => {
    await requireStaff()
    const id = (await ctx!.params).id
    const pool = await getPoolWithDetails(id!)
    if (!pool) return apiNotFound('Pool not found')
    return apiSuccess(pool)
  }
)

export const PATCH = withErrorHandler(
  async (req: NextRequest, ctx?: RouteContext) => {
    const staff = await requireStaff()
    const id = (await ctx!.params).id
    const body = await req.json()
    const validation = validateBody(updateExamPoolSchema, body)

    if (!validation.success) return apiError(validation.error)

    const existingPool = await prismaUnfiltered.examPool.findUnique({
      where: { id },
    })

    if (!existingPool) {
      return apiNotFound('Exam booking not found')
    }

    // Check for unique name within the same event (excluding current pool)
    if (validation.data.name && validation.data.name !== existingPool.name) {
      const duplicatePool = await prismaUnfiltered.examPool.findFirst({
        where: {
          eventId: existingPool.eventId,
          name: validation.data.name,
          id: { not: id },
        },
      })

      if (duplicatePool) {
        return apiError('A pool with this name already exists in this event')
      }
    }

    const updatedPool = await prismaUnfiltered.examPool.update({
      where: { id },
      data: validation.data,
    })

    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'ExamPool',
      entityId: updatedPool.id,
      userId: staff.id,
      details: { changes: validation.data },
    })

    return apiSuccess(updatedPool)
  }
)
