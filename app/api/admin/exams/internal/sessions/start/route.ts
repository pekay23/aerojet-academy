import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiCreated, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'
import { z } from 'zod'

const startSchema = z.object({
  studentId: z.string().min(1),
  bankId: z.string().min(1),
  classId: z.string().optional(),
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await requireAdmin()
  const body = startSchema.safeParse(await req.json())
  if (!body.success) return apiError(body.error.issues.map(i => i.message).join('; '), 400)

  const { studentId, bankId, classId } = body.data

  const bank = await prismaUnfiltered.internalExamBank.findFirst({
    where: { id: bankId, isActive: true, reviewState: 'APPROVED' },
  })
  if (!bank) return apiError('Bank not found or not approved', 404)

  const student = await prismaUnfiltered.user.findFirst({
    where: { id: studentId, role: 'STUDENT' },
  })
  if (!student) return apiError('Student not found', 404)

  if (classId) {
    const cls = await prismaUnfiltered.class.findFirst({
      where: { id: classId, courseId: bank.courseId },
    })
    if (!cls) return apiError('Class not found or does not match bank course', 400)
  }

  const existing = await prismaUnfiltered.internalExamSession.findFirst({
    where: { studentId, bankId, status: { in: ['NOT_STARTED', 'IN_PROGRESS'] } },
  })
  if (existing) {
    return apiSuccess({ sessionId: existing.id, reused: true })
  }

  const examSession = await prismaUnfiltered.internalExamSession.create({
    data: {
      studentId,
      bankId,
      classId,
      ruleSet: bank.ruleSet,
      status: 'NOT_STARTED',
      categoryCode: bank.categoryCode,
    },
  })

  await createAuditLog({
    userId: session.id,
    action: AuditAction.EXAM_SESSION_STARTED,
    entity: 'InternalExamSession',
    entityId: examSession.id,
    description: `Admin started individual exam for student ${studentId} on bank ${bankId}`,
    changes: { studentId, bankId, classId },
  })

  return apiCreated({ sessionId: examSession.id, reused: false })
})
