import { NextRequest } from 'next/server'
import { getAuthSession, requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { getRequestContext } from '@/lib/server/request-context'

export const GET = withErrorHandler(async (req: NextRequest, context: { params: { id: string } }) => {
  await requireStaff()

  const { id } = await context.params

  const session = await prismaUnfiltered.internalExamSession.findUnique({
    where: { id },
    include: {
      bank: { select: { id: true, name: true, course: { select: { code: true, name: true } } } },
      student: { select: { id: true, firstName: true, lastName: true, email: true } },
      class: { select: { id: true, name: true, classroom: { select: { name: true } } } },
    },
  })

  if (!session) return apiError('Session not found', 404)

  return apiSuccess({
    session: {
      id: session.id,
      status: session.status,
      supervised: session.supervised,
      bank: session.bank,
      student: session.student,
      class: session.class,
    },
  })
})

export const POST = withErrorHandler(async (req: NextRequest, context: { params: { id: string } }) => {
  await requireStaff()
  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }

  const { id } = await context.params
  const body = await req.json()
  const { candidateId, candidateDetails } = body || {}

  if (!candidateId) {
    return apiError('candidateId is required', 400)
  }

  const existing = await prismaUnfiltered.internalExamSession.findUnique({
    where: { id },
    select: { id: true, supervised: true, studentId: true },
  })

  if (!existing) return apiError('Session not found', 404)

  const updated = await prismaUnfiltered.internalExamSession.update({
    where: { id },
    data: {
      supervised: true,
      studentId: candidateId,
      status: 'IN_PROGRESS',
      startedAt: new Date(),
    },
  })

  const ctx = await getRequestContext()
  await createAuditLog({
    userId: (await getAuthSession())?.user?.id,
    action: AuditAction.EXAM_SESSION_STARTED,
    entity: 'InternalExamSession',
    entityId: id,
    description: `Started supervised exam session ${id} for candidate ${candidateId}`,
    changes: { candidateId, candidateDetails: candidateDetails || null, supervised: true },
    ipAddress: ctx.ipAddress ?? undefined,
    userAgent: ctx.userAgent ?? undefined,
  })

  return apiSuccess({ success: true, session: { id: updated.id, supervised: updated.supervised, status: updated.status } })
})
