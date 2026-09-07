import { NextRequest, NextResponse } from 'next/server'
import { prismaUnfiltered as prisma } from '@/lib/prisma/client'
import { env } from '@/lib/env'
import { getSystemSetting } from '@/lib/settings'

const DEFAULT_RETENTION_DAYS = 365
const ARCHIVE_BATCH_SIZE = 1000

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
    // Read configurable retention period from system settings
    const retentionSetting = await getSystemSetting('audit_log_retention_days', String(DEFAULT_RETENTION_DAYS))
    const retentionDays = Math.max(30, parseInt(retentionSetting, 10) || DEFAULT_RETENTION_DAYS)
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)

    // Count logs to be archived
    const expiredCount = await prisma.auditLog.count({
      where: { createdAt: { lt: cutoff } },
    })

    if (expiredCount === 0) {
      return NextResponse.json({
        success: true,
        message: `No audit logs older than ${retentionDays} days`,
        archivedCount: 0,
        deletedCount: 0,
      })
    }

    // Archive expired logs to the audit_log_archive table in batches
    let archivedCount = 0
    let cursor: string | undefined

    while (archivedCount < expiredCount) {
      const batch = await prisma.auditLog.findMany({
        where: { createdAt: { lt: cutoff } },
        take: ARCHIVE_BATCH_SIZE,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { createdAt: 'asc' },
      })

      if (batch.length === 0) break

      // Insert into archive table
      await prisma.auditLogArchive.createMany({
        data: batch.map(log => ({
          originalId: log.id,
          userId: log.userId,
          action: log.action,
          entity: log.entity,
          entityId: log.entityId,
          description: log.description,
          changes: log.changes ?? undefined,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          originalCreatedAt: log.createdAt,
        })),
        skipDuplicates: true,
      })

      archivedCount += batch.length
      cursor = batch[batch.length - 1].id
    }

    // Delete the archived logs
    const { count: deletedCount } = await prisma.auditLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    })

    // Record the last cleanup timestamp
    await prisma.systemSetting.upsert({
      where: { key: 'audit_log_last_cleanup' },
      update: { value: new Date().toISOString() },
      create: { key: 'audit_log_last_cleanup', value: new Date().toISOString(), type: 'STRING' },
    })

    return NextResponse.json({
      success: true,
      message: `Archived and deleted ${deletedCount} audit logs older than ${retentionDays} days`,
      cutoffDate: cutoff.toISOString(),
      archivedCount,
      deletedCount,
      retentionDays,
    })
  } catch (error: unknown) {
    console.error('Cron cleanup-audit-logs error:', error instanceof Error ? error : 'Unknown error')
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
