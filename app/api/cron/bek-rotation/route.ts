import { NextRequest, NextResponse } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { createAuditLog } from '@/lib/audit/logger'
import { env } from '@/lib/env'

// Cron job: Expire Browser Exam Keys (BEKs) past their rotation window.
// Sessions with bekExpiresAt < now have their BEK cleared so the key cannot
// be reused after expiry. Runs daily.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()

    const expired = await prismaUnfiltered.internalExamSession.findMany({
      where: {
        bekExpiresAt: { lt: now },
        status: 'IN_PROGRESS',
      },
      select: { id: true, bankId: true, studentId: true },
    })

    if (expired.length === 0) {
      return NextResponse.json({ success: true, expired: 0 })
    }

    await prismaUnfiltered.internalExamSession.updateMany({
      where: { id: { in: expired.map((s) => s.id) } },
      data: { bekExpiresAt: null },
    })

    await createAuditLog({
      action: 'SYSTEM_UPDATE',
      entity: 'InternalExamSession',
      entityId: 'cron',
      description: `BEK rotation expired ${expired.length} session key(s)`,
    })

    return NextResponse.json({ success: true, expired: expired.length })
  } catch (error: unknown) {
    console.error('[CRON] bek-rotation error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
