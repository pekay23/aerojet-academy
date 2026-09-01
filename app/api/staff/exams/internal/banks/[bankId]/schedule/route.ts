import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiCreated, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'
import { z } from 'zod'

const createSchema = z.object({
  classId: z.string(),
  scheduledStart: z.string().datetime().optional(),
  scheduledEnd: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
  allowLateStart: z.boolean().default(false),
  sebRequired: z.boolean().default(false),
})

export const GET = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ bankId: string }> }) => {
  await requireStaff()
  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }
  const { bankId } = await ctx.params

  const schedules = await prismaUnfiltered.internalExamClassSchedule.findMany({
    where: { bankId },
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
    orderBy: { scheduledStart: 'asc' },
  })

  return apiSuccess(schedules)
})

export const POST = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ bankId: string }> }) => {
  const staff = await requireStaff()
  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }
  const { bankId } = await ctx.params
  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return apiError('Invalid input')

  const schedule = await prismaUnfiltered.internalExamClassSchedule.create({
    data: {
      bankId,
      classId: parsed.data.classId,
      scheduledStart: parsed.data.scheduledStart ? new Date(parsed.data.scheduledStart) : null,
      scheduledEnd: parsed.data.scheduledEnd ? new Date(parsed.data.scheduledEnd) : null,
      isActive: parsed.data.isActive,
      allowLateStart: parsed.data.allowLateStart,
      sebRequired: parsed.data.sebRequired,
    },
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
    action: AuditAction.EXAM_SCHEDULE_CREATED,
    userId: staff.id,
    entity: 'InternalExamClassSchedule',
    entityId: schedule.id,
    description: `Created exam schedule for class`,
    changes: { bankId, ...parsed.data },
  })

  return apiCreated(schedule)
})
