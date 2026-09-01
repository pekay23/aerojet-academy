import { NextRequest, NextResponse } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { withErrorHandler } from '@/lib/api/response'
import { env } from '@/lib/env'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const authHeader = req.headers.get('authorization')
  const cronSecret = env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await prismaUnfiltered.$executeRaw`
    UPDATE internal_exam_sessions
    SET status = 'TIMED_OUT', autoSubmitted = true
    WHERE status = 'IN_PROGRESS'
      AND expiresAt < now()
      AND (lastActivityAt IS NULL OR lastActivityAt < now() - INTERVAL '5 minutes')
  `

  const count = Number(result)

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
