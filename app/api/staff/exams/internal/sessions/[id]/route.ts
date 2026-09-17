import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler, RouteContext } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { createAuditLog } from '@/lib/audit/logger'
import { z } from 'zod'

const editGradeSchema = z.object({
  score: z.coerce.number().int().min(0),
  percentage: z.coerce.number().min(0).max(100),
  passed: z.boolean(),
})

export const PATCH = withErrorHandler(async (req: NextRequest, ctx?: RouteContext) => {
  const staff = await requireStaff()
  const { id } = (await ctx!.params) as { id: string }

  const body = await req.json()
  const parsed = editGradeSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Invalid grade data: ' + parsed.error.message)
  }

  const { score, percentage, passed } = parsed.data

  const session = await prismaUnfiltered.internalExamSession.findUnique({
    where: { id },
    select: { id: true, status: true, isPublished: true, bankId: true, studentId: true },
  })

  if (!session) return apiError('Session not found')
  if (session.status === 'VOIDED' || session.status === 'IN_PROGRESS') {
    return apiError('Cannot edit grade for voided or in-progress session')
  }
  if (session.isPublished) {
    return apiError('Cannot edit grade after results are published')
  }

  await prismaUnfiltered.internalExamSession.update({
    where: { id },
    data: { score, percentage, passed },
  })

  await createAuditLog({
    userId: staff.id,
    action: 'UPDATE',
    entity: 'InternalExamSession',
    entityId: id,
    description: `Manually edited grade: ${percentage}% (${passed ? 'PASS' : 'FAIL'}) for session ${id} (bank: ${session.bankId}, student: ${session.studentId})`,
    changes: { score, percentage, passed, bankId: session.bankId, studentId: session.studentId },
  })

  return apiSuccess({ success: true })
})
