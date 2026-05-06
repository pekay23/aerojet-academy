import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client'
import { env } from '@/lib/env'

const RETENTION_DAYS = 3650

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 503 })
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000)

    const { count } = await prisma.auditLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    })

    return NextResponse.json({
      success: true,
      message: `Deleted ${count} audit logs older than ${RETENTION_DAYS} days`,
      cutoffDate: cutoff.toISOString(),
      deletedCount: count,
    })
  } catch (error: any) {
    console.error('Cron cleanup-audit-logs error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
