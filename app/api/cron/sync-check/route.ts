import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { runSyncCheck } from '@/lib/supabase/sync-check'
import { createAuditLog } from '@/lib/audit/logger'

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
        action: 'SYSTEM',
        entity: 'SyncCheck',
        entityId: 'neon-supabase',
        description: `Neon↔Supabase drift detected — worst ${(result.worstDriftPct * 100).toFixed(2)}%`,
        changes: {
          rows: result.rows.filter((r) => r.alarmed),
        },
      })
    }

    return NextResponse.json({ ok: true, ...result })
  } catch (err: any) {
    console.error('[Cron sync-check] Error:', err.message)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
