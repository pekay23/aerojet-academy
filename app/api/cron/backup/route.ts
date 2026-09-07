import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client'
import { env } from '@/lib/env'
import { createAuditLog } from '@/lib/audit/logger'
import {
  BACKUP_MODELS,
  exportAllTables,
  sendBackupEmail,
  isBackupDue,
  type BackupSchedule,
} from '@/lib/backup'

// Cron job: Automated database backup
// Runs daily at 4:00 AM — checks schedule settings and sends backup if due
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Read schedule settings
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: { in: ['backup_schedule', 'backup_email', 'backup_custom_days', 'backup_last_run'] },
      },
    })

    const vals: Record<string, string> = {}
    for (const s of settings) vals[s.key] = s.value

    const schedule = (vals.backup_schedule || 'off') as BackupSchedule
    const email = vals.backup_email || ''
    const customDays = parseInt(vals.backup_custom_days || '7', 10)
    const lastRun = vals.backup_last_run || null

    // Check if backup is due
    if (!isBackupDue(schedule, lastRun, customDays)) {
      return NextResponse.json({
        success: true,
        message: 'Backup not due yet',
        schedule,
        lastRun,
      })
    }

    if (!email) {
      return NextResponse.json({
        success: false,
        message: 'Backup is due but no email address configured',
      })
    }

    // Run the backup
    const backup = await exportAllTables()
    const { jsonFilename, htmlFilename } = await sendBackupEmail(email, backup)

    // Update last run timestamp
    await prisma.systemSetting.upsert({
      where: { key: 'backup_last_run' },
      update: { value: new Date().toISOString() },
      create: { key: 'backup_last_run', value: new Date().toISOString(), type: 'STRING' },
    })

    await createAuditLog({
      action: 'EXPORT',
      entity: 'System',
      entityId: 'database-backup',
      description: `Scheduled ${schedule} backup sent to ${email} (${BACKUP_MODELS.length} tables)`,
    })

    return NextResponse.json({
      success: true,
      message: `Backup sent to ${email}`,
      schedule,
      files: [jsonFilename, htmlFilename],
    })
  } catch (err: unknown) {
    console.error('[Cron Backup] Error:', err instanceof Error ? err.message : 'Unknown error')
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
