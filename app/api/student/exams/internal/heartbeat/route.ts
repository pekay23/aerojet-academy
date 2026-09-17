import { NextRequest } from 'next/server'
import { getAuthSession, checkRateLimit } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiTooManyRequests, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { z } from 'zod'

const heartbeatSchema = z.object({
  sessionId: z.string().min(1),
})

/**
 * POST /api/student/exams/internal/heartbeat — keepalive / activity ping
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
    return apiError('Only enrolled students may send exam heartbeats', 403)
  }

  const body = await req.json()
  const parsed = heartbeatSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Invalid request body', 400)
  }
  const { sessionId } = parsed.data

  // Rate-limit: 1 heartbeat per 10s per session
  if (!checkRateLimit(`exam-heartbeat-${sessionId}`, 1, 10_000)) {
    return apiTooManyRequests('Too many heartbeats. Please slow down.')
  }

  const examSession = await prismaUnfiltered.internalExamSession.findUnique({
    where: { id: sessionId },
    select: { studentId: true, status: true, expiresAt: true, timeExtensionSec: true },
  })

  if (!examSession) return apiError('Session not found', 404)
  if (examSession.studentId !== session.user.id) return apiError('Unauthorized', 403)
  if (examSession.status !== 'IN_PROGRESS') return apiError('Session is not active')

  const now = new Date()
  const effectiveExpiresAt = examSession.expiresAt
    ? new Date(examSession.expiresAt.getTime() + (examSession.timeExtensionSec || 0) * 1000)
    : null

  if (effectiveExpiresAt && now > effectiveExpiresAt) {
    return apiError('Session has expired', 410)
  }

  await prismaUnfiltered.internalExamSession.update({
    where: { id: sessionId },
    data: { lastActivityAt: now },
  })

  const timeLeft = effectiveExpiresAt
    ? Math.max(0, Math.floor((effectiveExpiresAt.getTime() - now.getTime()) / 1000))
    : 0

  return apiSuccess({
    accepted: true,
    expiresAt: examSession.expiresAt?.toISOString(),
    effectiveExpiresAt: effectiveExpiresAt?.toISOString(),
    timeLeft,
  })
})
