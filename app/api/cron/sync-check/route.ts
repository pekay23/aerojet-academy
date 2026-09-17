import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { runSyncCheck } from '@/lib/supabase/sync-check'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { prismaUnfiltered } from '@/lib/prisma/client'

import { UserRole } from '@/types/enums'

const STAFF_ROLES: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF]

async function notifyStaff(title: string, message: string) {
  const staff = await prismaUnfiltered.user.findMany({
    where: { role: { in: STAFF_ROLES }, status: 'ACTIVE' },
    select: { id: true },
  })
  await prismaUnfiltered.notification.createMany({
    data: staff.map((u) => ({
      userId: u.id,
      type: 'CRITICAL',
      title,
      message,
      linkUrl: '/staff/admin/permissions',
      linkText: 'View Details',
    })),
    skipDuplicates: true,
  })
}

// Weekly Neon ↔ Supabase replication drift sanity check.
// Scheduled in vercel.json. See docs/guides/neon-supabase-logical-replication.md.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runSyncCheck()

    if (!result.ran) {
      return NextResponse.json({ ok: true, skipped: true, reason: result.reason })
    }

    if (result.anyAlarmed) {
      await createAuditLog({
        action: AuditAction.SYSTEM,
        entity: 'SyncCheck',
        entityId: 'neon-supabase',
        description: `Neon↔Supabase drift detected — worst ${(result.worstDriftPct * 100).toFixed(2)}%`,
        changes: {
          rows: JSON.parse(JSON.stringify(result.rows.filter((r) => r.alarmed))),
        },
      })
      await notifyStaff(
        'Data Sync Drift Detected',
        `Neon ↔ Supabase replication drift detected (worst ${(result.worstDriftPct * 100).toFixed(2)}%).`
      )
    }

    return NextResponse.json({ ok: true, ...result })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[Cron sync-check] Error:', message)
    await notifyStaff('Sync Check Failed', `Neon ↔ Supabase sync check failed: ${message}`)
    await createAuditLog({
      action: AuditAction.SYSTEM,
      entity: 'SyncCheck',
      entityId: 'neon-supabase',
      description: `Sync check failed: ${message}`,
    })
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
