import { NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { getBankRules, isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'

export const runtime = 'nodejs'

export const GET = withErrorHandler(async (req: NextRequest) => {
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
    return apiError('Only enrolled students may view internal exam sessions', 403)
  }

  const url = new URL(req.url)
  const sessionId = url.pathname.split('/').filter(Boolean).at(-2)
  if (!sessionId) return apiError('sessionId is required', 400)

  const examSession = await prismaUnfiltered.internalExamSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      studentId: true,
      status: true,
      expiresAt: true,
      timeExtensionSec: true,
      bankId: true,
    },
  })

  if (!examSession) return apiError('Session not found', 404)
  if (examSession.studentId !== session.user.id) return apiError('Unauthorized', 403)

  const rules = await getBankRules(examSession.bankId)

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => {
        controller.enqueue(encoder.encode(data))
      }

      const heartbeatInterval = setInterval(() => {
        send(': heartbeat\n\n')
      }, 15_000)

      const timerInterval = setInterval(async () => {
        const current = await prismaUnfiltered.internalExamSession.findUnique({
          where: { id: sessionId },
          select: { status: true, expiresAt: true, timeExtensionSec: true },
        })

        if (!current || current.status !== 'IN_PROGRESS') {
          clearInterval(timerInterval)
          clearInterval(heartbeatInterval)
          send('event: close\ndata: {}\n\n')
          controller.close()
          return
        }

        const effectiveExpiresAt = current.expiresAt
          ? new Date(current.expiresAt.getTime() + (current.timeExtensionSec || 0) * 1000)
          : null
        const totalTimeSecs = effectiveExpiresAt
          ? Math.max(0, Math.floor((effectiveExpiresAt.getTime() - Date.now()) / 1000))
          : 0

        send(`event: tick\ndata: ${JSON.stringify({ timeRemaining: totalTimeSecs, expiresAt: effectiveExpiresAt?.toISOString() ?? null })}\n\n`)

        if (totalTimeSecs <= 0) {
          clearInterval(timerInterval)
          clearInterval(heartbeatInterval)
          send('event: close\ndata: {}\n\n')
          controller.close()
        }
      }, 1000)

      req.signal.addEventListener('abort', () => {
        clearInterval(timerInterval)
        clearInterval(heartbeatInterval)
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
})
