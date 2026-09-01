import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'
import { z } from 'zod'

const updateSchema = z.object({
  canEdit: z.boolean().optional(),
  canReview: z.boolean().optional(),
  canMonitor: z.boolean().optional(),
  canPublish: z.boolean().optional(),
})

export const PUT = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ bankId: string; id: string }> }) => {
  const session = await requireStaff()
  const { bankId, id } = await ctx.params
  const body = updateSchema.safeParse(await req.json())
  if (!body.success) return apiError(body.error.issues.map(i => i.message).join('; '), 400)

  const existing = await prismaUnfiltered.internalExamBankInstructor.findFirst({
    where: { id, bankId },
  })
  if (!existing) return apiNotFound('Assignment not found')

  const updated = await prismaUnfiltered.internalExamBankInstructor.update({
    where: { id },
    data: body.data,
    include: {
      instructor: {
        select: {
          id: true,
          employeeId: true,
          user: {
            select: {
              id: true,
              email: true,
              profile: { select: { firstName: true, lastName: true } },
            },
          },
        },
      },
    },
  })

  await createAuditLog({
    userId: session.id,
    action: AuditAction.EXAM_BANK_INSTRUCTOR_UPDATED,
    entity: 'InternalExamBankInstructor',
    entityId: id,
    description: `Updated permissions for instructor assignment ${id}`,
    changes: { before: existing, after: body.data },
  })

  return apiSuccess(updated)
})

export const DELETE = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ bankId: string; id: string }> }) => {
  const session = await requireStaff()
  const { bankId, id } = await ctx.params

  const existing = await prismaUnfiltered.internalExamBankInstructor.findFirst({
    where: { id, bankId },
    include: { instructor: { select: { employeeId: true } } },
  })
  if (!existing) return apiNotFound('Assignment not found')

  await prismaUnfiltered.internalExamBankInstructor.delete({ where: { id } })

  await createAuditLog({
    userId: session.id,
    action: AuditAction.EXAM_BANK_INSTRUCTOR_REVOKED,
    entity: 'InternalExamBankInstructor',
    entityId: id,
    description: `Revoked instructor ${existing.instructor?.employeeId || id} from bank ${bankId}`,
    changes: { instructorId: existing.instructorId, bankId },
  })

  return apiSuccess({ deleted: true })
})
