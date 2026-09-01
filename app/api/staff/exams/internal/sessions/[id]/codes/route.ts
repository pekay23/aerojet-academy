import { NextRequest } from 'next/server'
import { getAuthSession, requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { z } from 'zod'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { getRequestContext } from '@/lib/server/request-context'
import crypto from 'crypto'

const generateCodeSchema = z.object({
  count: z.number().int().min(1).max(100).default(1),
  candidateId: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
})

function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.randomBytes(32)
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars[bytes[i] % chars.length]
  }
  return result
}

export const POST = withErrorHandler(async (req: NextRequest, context: { params: { id: string } }) => {
  await requireStaff()
  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }

  const { id: sessionId } = context.params

  const session = await prismaUnfiltered.internalExamSession.findUnique({
    where: { id: sessionId },
    select: { id: true, expiresAt: true },
  })
  if (!session) return apiError('Session not found', 404)

  const body = await req.json()
  const parsed = generateCodeSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; '), 400)
  }

  const { count, candidateId, expiresAt } = parsed.data

  const codes: string[] = []
  const now = new Date()
  const codeExpiresAt = expiresAt ? new Date(expiresAt) : session.expiresAt || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const createOperations = Array.from({ length: count }, () =>
    prismaUnfiltered.internalExamAccessCode.create({
      data: {
        code: generateAccessCode(),
        sessionId,
        candidateId: candidateId || null,
        expiresAt: codeExpiresAt,
      },
    })
  )

  const created = await prismaUnfiltered.$transaction(createOperations)
  created.forEach(c => codes.push(c.code))

  const authSession = await getAuthSession()
  const ctx = await getRequestContext()
  await createAuditLog({
    userId: authSession?.user?.id,
    action: AuditAction.EXAM_ACCESS_CODE_GENERATED,
    entity: 'InternalExamSession',
    entityId: sessionId,
    description: `Generated ${count} access code(s) for session ${sessionId}`,
    changes: { count, candidateId: candidateId || null, expiresAt: codeExpiresAt.toISOString() },
    ipAddress: ctx.ipAddress ?? undefined,
    userAgent: ctx.userAgent ?? undefined,
  })

  return apiSuccess({ codes })
})
