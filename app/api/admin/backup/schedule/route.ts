import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireAdmin } from '@/lib/auth/helpers'
import { apiError, withErrorHandler } from '@/lib/api/response'
import { createAuditLog } from '@/lib/audit/logger'

const SCHEDULE_KEYS = [
  'backup_schedule',
  'backup_email',
  'backup_custom_days',
  'backup_last_run',
] as const

// GET: Fetch current backup schedule settings
export const GET = withErrorHandler(async () => {
  await requireAdmin()

  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: [...SCHEDULE_KEYS] } },
  })

  const values: Record<string, string> = {}
  for (const s of settings) {
    values[s.key] = s.value
  }

  return NextResponse.json({
    schedule: values.backup_schedule || 'off',
    email: values.backup_email || '',
    customDays: values.backup_custom_days || '7',
    lastRun: values.backup_last_run || null,
  })
})

// POST: Update backup schedule settings
export const POST = withErrorHandler(async (req: NextRequest) => {
  const admin = await requireAdmin()
  const { schedule, email, customDays } = await req.json()

  if (!['off', 'daily', 'weekly', 'monthly', 'custom'].includes(schedule)) {
    return apiError('Invalid schedule option', 400)
  }

  if (schedule !== 'off' && (!email || typeof email !== 'string')) {
    return apiError('Email address is required for scheduled backups', 400)
  }

  // Upsert all schedule settings
  await Promise.all([
    prisma.systemSetting.upsert({
      where: { key: 'backup_schedule' },
      update: { value: schedule, updatedBy: admin.id },
      create: { key: 'backup_schedule', value: schedule, type: 'STRING', updatedBy: admin.id },
    }),
    prisma.systemSetting.upsert({
      where: { key: 'backup_email' },
      update: { value: email || '', updatedBy: admin.id },
      create: { key: 'backup_email', value: email || '', type: 'STRING', updatedBy: admin.id },
    }),
    prisma.systemSetting.upsert({
      where: { key: 'backup_custom_days' },
      update: { value: String(customDays || 7), updatedBy: admin.id },
      create: {
        key: 'backup_custom_days',
        value: String(customDays || 7),
        type: 'NUMBER',
        updatedBy: admin.id,
      },
    }),
  ])

  await createAuditLog({
    action: 'UPDATE',
    entity: 'System',
    entityId: 'backup-schedule',
    userId: admin.id,
    description: `Backup schedule updated to "${schedule}"${schedule === 'custom' ? ` (every ${customDays} days)` : ''}`,
  })

  return NextResponse.json({ success: true, schedule, email, customDays })
})
