import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'
import { z } from 'zod'

const updateSchema = z.object({
  scheduledStart: z.string().datetime().optional(),
  scheduledEnd: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
  allowLateStart: z.boolean().optional(),
})

export const PATCH = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ bankId: string; scheduleId: string }> }) => {
  const staff = await requireStaff()
  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }
  const { bankId, scheduleId } = await ctx.params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return apiError('Invalid input')

  const schedule = await prismaUnfiltered.internalExamClassSchedule.findUnique({
    where: { id: scheduleId },
  })
  if (!schedule || schedule.bankId !== bankId) {
    return apiError('Schedule not found', 404)
  }

  const data: Record<string, unknown> = {}
  if (parsed.data.scheduledStart !== undefined) {
    data.scheduledStart = parsed.data.scheduledStart ? new Date(parsed.data.scheduledStart) : null
  }
  if (parsed.data.scheduledEnd !== undefined) {
    data.scheduledEnd = parsed.data.scheduledEnd ? new Date(parsed.data.scheduledEnd) : null
  }
  if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive
  if (parsed.data.allowLateStart !== undefined) data.allowLateStart = parsed.data.allowLateStart

  const updated = await prismaUnfiltered.internalExamClassSchedule.update({
    where: { id: scheduleId },
    data,
    include: {
      class: {
        include: {
          course: { select: { code: true, name: true } },
          instructor: {
            include: {
              user: { include: { profile: { select: { firstName: true, lastName: true } } } },
            },
          },
        },
      },
    },
  })

  await createAuditLog({
    action: AuditAction.EXAM_SCHEDULE_UPDATED,
    userId: staff.id,
    entity: 'InternalExamClassSchedule',
    entityId: scheduleId,
    description: `Updated exam schedule for class`,
    changes: { bankId, scheduleId, ...parsed.data },
  })

  return apiSuccess(updated)
})

export const DELETE = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ bankId: string; scheduleId: string }> }) => {
  const staff = await requireStaff()
  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }
  const { bankId, scheduleId } = await ctx.params

  const schedule = await prismaUnfiltered.internalExamClassSchedule.findUnique({
    where: { id: scheduleId },
  })
  if (!schedule || schedule.bankId !== bankId) {
    return apiError('Schedule not found', 404)
  }

  await prismaUnfiltered.internalExamClassSchedule.delete({
    where: { id: scheduleId },
  })

  await createAuditLog({
    action: AuditAction.EXAM_SCHEDULE_DELETED,
    userId: staff.id,
    entity: 'InternalExamClassSchedule',
    entityId: scheduleId,
    description: `Deleted exam schedule for class`,
    changes: { bankId, scheduleId, classId: schedule.classId },
  })

  return new Response(null, { status: 204 })
})
