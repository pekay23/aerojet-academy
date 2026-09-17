import { NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { z } from 'zod'

const violationSchema = z.object({
  sessionId: z.string().min(1),
  type: z.enum(['FULLSCREEN_EXIT', 'TAB_SWITCH', 'KEYBOARD_SHORTCUT', 'NETWORK_DISCONNECT', 'EXAM_INTERFACE_UNLOAD']),
  detail: z.string().optional(),
  deviceInfo: z.any().optional(),
  severity: z.enum(['WARNING', 'NOTICE', 'CRITICAL']).optional(),
})

/**
 * POST /api/student/exams/internal/violation — log an exam violation
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await getAuthSession()
  if (!session?.user?.id) return apiError('Unauthorized', 401)
  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }

  const user = await prismaUnfiltered.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  if (!user || user.role !== 'STUDENT') {
    return apiError('Only enrolled students may log exam violations', 403)
  }

  const body = await req.json()
  const parsed = violationSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Invalid request body', 400)
  }
  const { sessionId, type, detail, deviceInfo } = parsed.data

  const examSession = await prismaUnfiltered.internalExamSession.findUnique({
    where: { id: sessionId },
    select: { studentId: true, classId: true, bankId: true },
  })

  if (!examSession) return apiError('Session not found', 404)
  if (examSession.studentId !== session.user.id) return apiError('Unauthorized', 403)

  const previousCount = await prismaUnfiltered.internalExamViolation.count({
    where: { sessionId },
  })

  let severity: 'WARNING' | 'NOTICE' | 'CRITICAL' = 'WARNING'
  if (parsed.data.severity) {
    severity = parsed.data.severity
  } else if (previousCount >= 3) {
    severity = 'CRITICAL'
  } else if (previousCount >= 1) {
    severity = 'NOTICE'
  }

  const violation = await prismaUnfiltered.internalExamViolation.create({
    data: {
      sessionId,
      studentId: session.user.id,
      classId: examSession.classId || null,
      bankId: examSession.bankId,
      type,
      severity,
      detail: detail || null,
      deviceInfo: deviceInfo || undefined,
    },
  })

  await createAuditLog({
    action: AuditAction.EXAM_VIOLATION_LOGGED,
    userId: session.user.id,
    targetUserId: session.user.id,
    description: `${type} violation logged for session ${sessionId}`,
    changes: {
      sessionId,
      violationId: violation.id,
      type,
      severity,
      detail,
    },
  })

  return apiSuccess({
    id: violation.id,
    severity,
    previousCount,
  })
})
