import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { mirrorBatch, sweepTempFolders } from '@/lib/storage/uploadthing-mirror'
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

// Nightly UploadThing → Supabase reconciliation + temp-folder retention sweep.
// See docs/guides/neon-supabase-logical-replication.md for the storage strategy.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const started = Date.now()
  try {
    const [mirror, sweep] = await Promise.all([mirrorBatch(50), sweepTempFolders(30)])

    await createAuditLog({
      action: AuditAction.SYSTEM,
      entity: 'SupabaseMirror',
      entityId: 'nightly',
      description: `Mirrored ${mirror.mirrored}/${mirror.scanned} files; swept ${sweep.deleted}/${sweep.scanned} temp objects`,
      changes: { mirror, sweep, ms: Date.now() - started },
    })

    return NextResponse.json({ ok: true, mirror, sweep, ms: Date.now() - started })
  } catch (err: any) {
    console.error('[Cron supabase-mirror] Error:', err.message)
    await notifyStaff('Supabase Mirror Failed', `Nightly file mirror failed: ${err.message}`)
    await createAuditLog({
      action: AuditAction.SYSTEM,
      entity: 'SupabaseMirror',
      entityId: 'nightly',
      description: `Mirror failed: ${err.message}`,
    })
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
