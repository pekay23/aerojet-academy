import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'
import { z } from 'zod'

const updateSchema = z.object({
  canEdit: z.boolean().optional(),
  canReview: z.boolean().optional(),
  canMonitor: z.boolean().optional(),
})

export const PATCH = withErrorHandler(
  async (req: NextRequest, ctx: { params: Promise<{ bankId: string; instructorId: string }> }) => {
    const staff = await requireStaff()
    if (!(await isInternalExamSystemEnabled())) {
      return apiError('Internal exams are not currently available', 403)
    }
    const { bankId, instructorId } = await ctx.params
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return apiError('Invalid input')

    const assignment = await prismaUnfiltered.internalExamBankInstructor.findUnique({
      where: { bankId_instructorId: { bankId, instructorId } },
    })
    if (!assignment) return apiError('Assignment not found', 404)

    const updated = await prismaUnfiltered.internalExamBankInstructor.update({
      where: { bankId_instructorId: { bankId, instructorId } },
      data: parsed.data,
      include: {
        instructor: {
          include: {
            user: {
              include: {
                profile: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    })

    await createAuditLog({
      action: AuditAction.EXAM_BANK_INSTRUCTOR_UPDATED,
      userId: staff.id,
      targetUserId: instructorId,
      entity: 'InternalExamBankInstructor',
      entityId: updated.id,
      description: `Updated instructor permissions for bank`,
      changes: { bankId, instructorId, ...parsed.data },
    })

    return apiSuccess(updated)
  }
)

export const DELETE = withErrorHandler(
  async (req: NextRequest, ctx: { params: Promise<{ bankId: string; instructorId: string }> }) => {
    const staff = await requireStaff()
    if (!(await isInternalExamSystemEnabled())) {
      return apiError('Internal exams are not currently available', 403)
    }
    const { bankId, instructorId } = await ctx.params

    const assignment = await prismaUnfiltered.internalExamBankInstructor.findUnique({
      where: { bankId_instructorId: { bankId, instructorId } },
    })
    if (!assignment) return apiError('Assignment not found', 404)

    await prismaUnfiltered.internalExamBankInstructor.delete({
      where: { bankId_instructorId: { bankId, instructorId } },
    })

    await createAuditLog({
      action: AuditAction.EXAM_BANK_INSTRUCTOR_REVOKED,
      userId: staff.id,
      targetUserId: instructorId,
      entity: 'InternalExamBankInstructor',
      entityId: assignment.id,
      description: `Revoked instructor access to bank`,
      changes: { bankId, instructorId },
    })

    return new NextResponse(null, { status: 204 })
  }
)
