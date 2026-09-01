import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiCreated, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'
import { z } from 'zod'

const assignSchema = z.object({
  instructorId: z.string(),
  canEdit: z.boolean().default(false),
  canReview: z.boolean().default(false),
  canMonitor: z.boolean().default(true),
  bulk: z.boolean().default(false),
})

export const GET = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ bankId: string }> }) => {
  await requireStaff()
  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }
  const { bankId } = await ctx.params

  const assignments = await prismaUnfiltered.internalExamBankInstructor.findMany({
    where: { bankId },
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
    orderBy: { assignedAt: 'desc' },
  })

  return apiSuccess(assignments)
})

export const POST = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ bankId: string }> }) => {
  const staff = await requireStaff()
  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }
  const { bankId } = await ctx.params
  const body = await req.json()
  const parsed = assignSchema.safeParse(body)
  if (!parsed.success) return apiError('Invalid input')

  const { instructorId, canEdit, canReview, canMonitor, bulk } = parsed.data

  if (bulk) {
    const bank = await prismaUnfiltered.internalExamBank.findUnique({
      where: { id: bankId },
      select: { courseId: true },
    })
    if (!bank) return apiError('Bank not found', 404)

    const classes = await prismaUnfiltered.class.findMany({
      where: { courseId: bank.courseId },
      select: { instructorId: true },
    })

    const instructorIds = [...new Set(classes.map((c) => c.instructorId).filter((id): id is string => Boolean(id)))]

    const results = []
    for (const id of instructorIds) {
      const existing = await prismaUnfiltered.internalExamBankInstructor.findUnique({
        where: { bankId_instructorId: { bankId, instructorId: id } },
      })
      if (!existing) {
        const assignment = await prismaUnfiltered.internalExamBankInstructor.create({
          data: {
            bankId,
            instructorId: id,
            canEdit,
            canReview,
            canMonitor,
            assignedBy: staff.id,
          },
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
          action: AuditAction.EXAM_BANK_INSTRUCTOR_ASSIGNED,
          userId: staff.id,
          targetUserId: id,
          entity: 'InternalExamBankInstructor',
          entityId: assignment.id,
          description: `Bulk assigned instructor to bank`,
          changes: { bankId, instructorId: id, canEdit, canReview, canMonitor },
        })
        results.push(assignment)
      }
    }
    return apiCreated(results)
  }

  const existing = await prismaUnfiltered.internalExamBankInstructor.findUnique({
    where: { bankId_instructorId: { bankId, instructorId } },
  })
  if (existing) {
    return apiError('Instructor already assigned to this bank', 409)
  }

  const assignment = await prismaUnfiltered.internalExamBankInstructor.create({
    data: {
      bankId,
      instructorId,
      canEdit,
      canReview,
      canMonitor,
      assignedBy: staff.id,
    },
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
    action: AuditAction.EXAM_BANK_INSTRUCTOR_ASSIGNED,
    userId: staff.id,
    targetUserId: instructorId,
    entity: 'InternalExamBankInstructor',
    entityId: assignment.id,
    description: `Assigned instructor to bank`,
    changes: { bankId, instructorId, canEdit, canReview, canMonitor },
  })

  return apiCreated(assignment)
})
