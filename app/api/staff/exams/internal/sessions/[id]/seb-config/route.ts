import { NextRequest, NextResponse } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { withErrorHandler, apiError } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import {
  generateBekPair,
  buildSebConfig,
  generateSebConfig,
  _BekPair,
  BankSebConfig,
} from '@/lib/internal-exam/seb-config'

// GET /api/staff/exams/internal/sessions/[id]/seb-config — return .seb config
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('sessionId')

  if (!sessionId) {
    return apiError('sessionId is required', 400)
  }

  const session = await prismaUnfiltered.internalExamSession.findUnique({
    where: { id: sessionId },
    include: {
      bank: { select: { id: true, name: true, sebConfig: true } },
      class: { select: { id: true, name: true } },
    },
  })

  if (!session) {
    return apiError('Session not found', 404)
  }

  if (!session.classId || !session.class) {
    return apiError('This session is not tied to a class schedule', 400)
  }

  const schedule = await prismaUnfiltered.internalExamClassSchedule.findFirst({
    where: { bankId: session.bankId, classId: session.classId },
  })

  if (!schedule || !schedule.sebRequired) {
    return apiError('SEB is not required for this exam schedule', 403)
  }

  const bekPair = generateBekPair()

  await prismaUnfiltered.internalExamSession.update({
    where: { id: sessionId },
    data: {
      sebKeys: bekPair as unknown as any,
    },
  })

  const examDurationSecs = session.expiresAt
    ? Math.max(0, Math.floor((session.expiresAt.getTime() - Date.now()) / 1000))
    : 0

  const bankConfig = (session.bank?.sebConfig as BankSebConfig | null) ?? null
  const startUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/student/exams/internal/${sessionId}`

  const sebConfig = buildSebConfig({
    bekPair,
    startUrl,
    examDurationSecs,
    bankConfig,
  })

  const sebZip = generateSebConfig(sebConfig)

  const headers = new Headers()
  headers.set('Content-Type', 'application/octet-stream')
  headers.set('Content-Disposition', `attachment; filename="exam-${sessionId}.seb"`)

  await createAuditLog({
    action: AuditAction.EXAM_SESSION_STARTED,
    userId: session.studentId,
    entity: 'InternalExamSession',
    entityId: sessionId,
    description: `SEB config generated for session ${sessionId}`,
    details: {
      bankId: session.bankId,
      classId: session.classId,
      lockdownLevel: bankConfig?.lockdownLevel || 'strict',
    },
  })

  return new NextResponse(Buffer.from(sebZip), { headers, status: 200 })
})
