import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { mirrorBatch, sweepTempFolders } from '@/lib/storage/uploadthing-mirror'
import { createAuditLog } from '@/lib/audit/logger'

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
      action: 'SYSTEM',
      entity: 'SupabaseMirror',
      entityId: 'nightly',
      description: `Mirrored ${mirror.mirrored}/${mirror.scanned} files; swept ${sweep.deleted}/${sweep.scanned} temp objects`,
      changes: { mirror, sweep, ms: Date.now() - started },
    })

    return NextResponse.json({ ok: true, mirror, sweep, ms: Date.now() - started })
  } catch (err: any) {
    console.error('[Cron supabase-mirror] Error:', err.message)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
