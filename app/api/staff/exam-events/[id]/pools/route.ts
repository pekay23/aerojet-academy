import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiCreated, apiError, withErrorHandler , RouteContext } from '@/lib/api/response'
import { createExamPoolSchema, validateBody } from '@/lib/validation/schemas'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

export const GET = withErrorHandler(
  async (req: NextRequest, ctx?: RouteContext) => {
    await requireStaff()
    const pools = await prismaUnfiltered.examPool.findMany({
      where: { eventId: (await ctx!.params).id },
      include: { _count: { select: { memberships: true } } },
      orderBy: { examDate: 'asc' },
    })
    return apiSuccess(pools)
  }
)

export const POST = withErrorHandler(
  async (req: NextRequest, ctx?: RouteContext) => {
    const staff = await requireStaff()
    const body = await req.json()
    const data = { ...body, eventId: (await ctx!.params).id }
    const validation = validateBody(createExamPoolSchema, data)
    if (!validation.success) return apiError(validation.error)

    const pool = await prismaUnfiltered.examPool.create({
      data: {
        ...validation.data,
        status: 'OPEN',
        examDate: new Date(validation.data.examDate),
        examStartTime: new Date(validation.data.examStartTime),
        examEndTime: new Date(validation.data.examEndTime),
      },
    })
    await createAuditLog({
      action: AuditAction.CREATE,
      entity: 'ExamPool',
      entityId: pool.id,
      userId: staff.id,
    })
    return apiCreated(pool)
  }
)
