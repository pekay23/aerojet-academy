import { NextRequest } from 'next/server'
import { apiSuccess, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const violationSchema = z.object({
  sessionId: z.string(),
  type: z.string(),
  detail: z.string().optional(),
  severity: z.enum(['WARNING', 'NOTICE', 'CRITICAL']).optional(),
  deviceInfo: z.record(z.string(), z.unknown()).optional(),
})

const batchViolationSchema = z.object({
  sessionId: z.string(),
  events: z.array(z.object({
    type: z.string(),
    detail: z.string().optional(),
    severity: z.enum(['WARNING', 'NOTICE', 'CRITICAL']).optional(),
    deviceInfo: z.record(z.string(), z.unknown()).optional(),
    timestamp: z.string().optional(),
  })),
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json()

  const isBatch = Array.isArray(body.events)
  const events = isBatch ? body.events : [body]

  const results = []
  for (const rawEvent of events) {
    const parsed = (isBatch
      ? batchViolationSchema.shape.events.element.parse(rawEvent)
      : violationSchema.parse(rawEvent)) as { sessionId?: string; type: string; detail?: string; severity?: string; deviceInfo?: Record<string, unknown>; timestamp?: string }

    const sessionId = (isBatch ? body.sessionId : parsed.sessionId) as string
    const session = await prismaUnfiltered.internalExamSession.findUnique({
      where: { id: sessionId },
      select: { id: true, status: true, studentId: true, bankId: true },
    })

    if (!session) {
      results.push({ error: 'Session not found', event: parsed.type })
      continue
    }

    const violation = await prismaUnfiltered.internalExamViolation.create({
      data: {
        sessionId,
        studentId: session.studentId,
        bankId: session.bankId,
        type: parsed.type,
        severity: (parsed.severity || 'WARNING') as 'WARNING' | 'NOTICE' | 'CRITICAL',
        detail: parsed.detail,
        deviceInfo: parsed.deviceInfo as Prisma.InputJsonValue | undefined,
      },
    })

    results.push({ id: violation.id, type: violation.type })
  }

  return apiSuccess({ logged: results.length, results })
})
