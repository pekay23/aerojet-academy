import { NextRequest } from 'next/server'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { z } from 'zod'

const violationSchema = z.object({
  sessionId: z.string(),
  type: z.string(),
  detail: z.string().optional(),
  severity: z.enum(['WARNING', 'NOTICE', 'CRITICAL']).optional(),
  deviceInfo: z.any().optional(),
})

const batchViolationSchema = z.object({
  sessionId: z.string(),
  events: z.array(z.object({
    type: z.string(),
    detail: z.string().optional(),
    severity: z.enum(['WARNING', 'NOTICE', 'CRITICAL']).optional(),
    deviceInfo: z.any().optional(),
    timestamp: z.string().optional(),
  })),
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json()

  const isBatch = Array.isArray(body.events)
  const events = isBatch ? body.events : [body]

  const results = []
  for (const rawEvent of events) {
    const parsed = isBatch
      ? batchViolationSchema.shape.events.element.parse(rawEvent) as { sessionId: string; type: string; detail?: string; severity?: string; deviceInfo?: any }
      : violationSchema.parse(rawEvent) as { sessionId: string; type: string; detail?: string; severity?: string; deviceInfo?: any }

    const session = await prismaUnfiltered.internalExamSession.findUnique({
      where: { id: parsed.sessionId },
      select: { id: true, status: true, studentId: true, bankId: true },
    })

    if (!session) {
      results.push({ error: 'Session not found', event: parsed.type })
      continue
    }

    const violation = await prismaUnfiltered.internalExamViolation.create({
      data: {
        sessionId: parsed.sessionId,
        studentId: session.studentId,
        bankId: session.bankId,
        type: parsed.type as any,
        severity: (parsed.severity || 'WARNING') as 'WARNING' | 'NOTICE' | 'CRITICAL',
        detail: parsed.detail,
        deviceInfo: parsed.deviceInfo || null,
      },
    })

    results.push({ id: violation.id, type: violation.type })
  }

  return apiSuccess({ logged: results.length, results })
})
