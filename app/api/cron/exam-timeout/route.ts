import { NextRequest, NextResponse } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { withErrorHandler } from '@/lib/api/response'
import { env } from '@/lib/env'
import { transitionExamSession } from '@/lib/internal-exam/state-machine'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const authHeader = req.headers.get('authorization')
  const cronSecret = env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

  return NextResponse.json({ success: true, count })
})
