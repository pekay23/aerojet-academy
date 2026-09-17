import { NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { z } from 'zod'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { getRequestContext } from '@/lib/server/request-context'

const accessCodeSchema = z.object({ code: z.string().min(1) })

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await getAuthSession()
  if (!session?.user?.id) return apiError('Unauthorized', 401)
  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }

  const body = await req.json()
  const parsed = accessCodeSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Invalid request body', 400)
  }

  const { code } = parsed.data

  const accessCode = await prismaUnfiltered.internalExamAccessCode.findUnique({
    where: { code },
    include: { session: { select: { id: true, bankId: true } } },
  })

  if (!accessCode) return apiError('Invalid access code', 404)
  if (accessCode.used) return apiError('Access code has already been used', 409)
  if (accessCode.expiresAt < new Date()) return apiError('Access code has expired', 410)

  if (accessCode.candidateId && accessCode.candidateId !== session.user.id) {
    return apiError('This access code is bound to another candidate', 403)
  }

  await prismaUnfiltered.internalExamAccessCode.update({
    where: { id: accessCode.id },
    data: { used: true, usedAt: new Date() },
  })

  const ctx = await getRequestContext()
  await createAuditLog({
    userId: session.user.id,
    action: AuditAction.EXAM_ACCESS_CODE_USED,
    entity: 'InternalExamAccessCode',
    entityId: accessCode.id,
    description: `Access code ${code} validated for session ${accessCode.sessionId}`,
    changes: { code, sessionId: accessCode.sessionId, candidateId: accessCode.candidateId },
    ipAddress: ctx.ipAddress ?? undefined,
    userAgent: ctx.userAgent ?? undefined,
  })

  return apiSuccess({
    valid: true,
    sessionId: accessCode.sessionId,
    candidateId: accessCode.candidateId,
    requiresIdentityForm: true,
  })
})
