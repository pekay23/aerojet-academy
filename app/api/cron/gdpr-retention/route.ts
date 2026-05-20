import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { runRetentionSweep, seedDefaultRetentionPolicies } from '@/lib/gdpr/retention'
import { createAuditLog } from '@/lib/audit/logger'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await seedDefaultRetentionPolicies()
    const results = await runRetentionSweep()
    const totalAffected = results.reduce((s, r) => s + r.affected, 0)
    const errors = results.filter((r) => r.error).length

    await createAuditLog({
      action: 'SYSTEM',
      entity: 'GdprRetention',
      entityId: 'weekly',
      description: `Retention sweep — ${totalAffected} rows affected across ${results.length} policies (${errors} errors)`,
      changes: { results },
    })

    return NextResponse.json({ ok: true, totalAffected, results })
  } catch (err: any) {
    console.error('[Cron gdpr-retention] Error:', err.message)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
