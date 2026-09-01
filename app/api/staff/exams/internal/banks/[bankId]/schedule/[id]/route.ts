import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'
import { z } from 'zod'

const updateSchema = z.object({
  scheduledStart: z.string().datetime().optional().nullable(),
  scheduledEnd: z.string().datetime().optional().nullable(),
  allowLateStart: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sebRequired: z.boolean().optional(),
})

export const PUT = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ bankId: string; id: string }> }) => {
  const session = await requireStaff()
  const { bankId, id } = await ctx.params
  const body = updateSchema.safeParse(await req.json())
  if (!body.success) return apiError(body.error.issues.map(i => i.message).join('; '), 400)

  const existing = await prismaUnfiltered.internalExamClassSchedule.findFirst({
    where: { id, bankId },
  })
  if (!existing) return apiNotFound('Schedule not found')

  const data: any = { ...body.data }
  if (data.scheduledStart) data.scheduledStart = new Date(data.scheduledStart)
  if (data.scheduledEnd) data.scheduledEnd = new Date(data.scheduledEnd)

  const updated = await prismaUnfiltered.internalExamClassSchedule.update({
    where: { id },
    data,
    include: {
      class: { select: { id: true, name: true, course: { select: { code: true, name: true } } } },
    },
  })

  await createAuditLog({
    userId: session.id,
    action: AuditAction.EXAM_SCHEDULE_UPDATED,
    entity: 'InternalExamClassSchedule',
    entityId: id,
    description: `Updated schedule ${id} for bank ${bankId}`,
    changes: { before: existing, after: data },
  })

  return apiSuccess(updated)
})

export const DELETE = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ bankId: string; id: string }> }) => {
  const session = await requireStaff()
  const { bankId, id } = await ctx.params

  const existing = await prismaUnfiltered.internalExamClassSchedule.findFirst({
    where: { id, bankId },
  })
  if (!existing) return apiNotFound('Schedule not found')

  await prismaUnfiltered.internalExamClassSchedule.delete({ where: { id } })

  await createAuditLog({
    userId: session.id,
    action: AuditAction.EXAM_SCHEDULE_DELETED,
    entity: 'InternalExamClassSchedule',
    entityId: id,
    description: `Deleted schedule ${id} for bank ${bankId}`,
    changes: { bankId, classId: existing.classId },
  })

  return apiSuccess({ deleted: true })
})
