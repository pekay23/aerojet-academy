import { NextRequest, NextResponse } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { withErrorHandler } from '@/lib/api/response'
import { env } from '@/lib/env'
import { transitionExamSession } from '@/lib/internal-exam/state-machine'

function isAuthorized(request: NextRequest): boolean {
  const expected = env.CRON_SECRET
  const authorization = request.headers.get('authorization')
  return Boolean(expected) && authorization === `Bearer ${expected}`
}

async function processExamTimeouts() {
  const expiredSessions = await prismaUnfiltered.internalExamSession.findMany({
    where: {
      status: 'IN_PROGRESS',
      expiresAt: { lt: new Date() },
      lastActivityAt: { lt: new Date(Date.now() - 5 * 60 * 1000) },
    },
    select: { id: true },
  })

  let count = 0
  for (const s of expiredSessions) {
    try {
      await transitionExamSession(
        s.id,
        'TIMED_OUT',
        'system',
        'Auto-submitted by cron: session expired'
      )
      count++
    } catch {
      // skip sessions that fail validation or transition
    }
  }

  if (count > 0) {
    await createAuditLog({
      action: AuditAction.EXAM_SESSION_AUTO_SUBMITTED,
      entity: 'InternalExamSession',
      description: `Auto-submitted ${count} expired exam session(s)`,
      changes: { count },
    })
  }

  return count
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const count = await processExamTimeouts()
    return NextResponse.json({ ok: true, count })
  } catch (error) {
    console.error('Exam timeout processing failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Retain GET for backward compatibility
export const GET = withErrorHandler(async (req: NextRequest) => {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const count = await processExamTimeouts()
  return NextResponse.json({ success: true, count })
})
