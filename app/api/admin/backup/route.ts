import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/helpers'
import { apiError, withErrorHandler } from '@/lib/api/response'
import { createAuditLog } from '@/lib/audit/logger'
import {
  BACKUP_MODELS,
  exportAllTables,
  generateJsonBackup,
  generateReadableReport,
  sendBackupEmail,
} from '@/lib/backup'

// GET: Download backup file
// ?format=json (default) | html
export const GET = withErrorHandler(async (req: NextRequest) => {
  const admin = await requireAdmin()
  const format = req.nextUrl.searchParams.get('format') || 'json'

  const backup = await exportAllTables()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

  await createAuditLog({
    action: 'EXPORT',
    entity: 'System',
    entityId: 'database-backup',
    userId: admin.id,
    description: `Database backup downloaded as ${format.toUpperCase()} (${BACKUP_MODELS.length} tables)`,
  })

  if (format === 'html') {
    const html = generateReadableReport(backup)
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="aerojet-backup-${timestamp}.html"`,
      },
    })
  }

  // Default: JSON
  const payload = generateJsonBackup(backup)
  const json = JSON.stringify(payload, null, 2)

  return new NextResponse(json, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="aerojet-backup-${timestamp}.json"`,
    },
  })
})

// POST: Export and send backup via email (both formats attached)
export const POST = withErrorHandler(async (req: NextRequest) => {
  const admin = await requireAdmin()
  const { email } = await req.json()

  if (!email || typeof email !== 'string') {
    return apiError('Email address is required', 400)
  }

  const backup = await exportAllTables()

  try {
    await sendBackupEmail(email, backup)
  } catch (err: unknown) {
    console.error('[Backup Email] Failed:', err instanceof Error ? err.message : 'Unknown error')
    return apiError(err instanceof Error ? err.message : 'Unknown error', 500)
  }

  await createAuditLog({
    action: 'EXPORT',
    entity: 'System',
    entityId: 'database-backup',
    userId: admin.id,
    description: `Database backup emailed to ${email} (${BACKUP_MODELS.length} tables, JSON + HTML)`,
  })

  return NextResponse.json({ success: true, message: `Backup sent to ${email}` })
})
