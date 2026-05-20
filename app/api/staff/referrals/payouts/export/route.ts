import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth/permissions'
import { ADDITIONAL_PERMISSION_KEYS } from '@/lib/auth/permission-registry'
import { exportPayoutCsv } from '@/lib/referral/admin'
import { createAuditLog } from '@/lib/audit/logger'

export async function GET(req: NextRequest) {
  let actor
  try {
    actor = await requirePermission(ADDITIONAL_PERMISSION_KEYS.MANAGE_REFERRALS)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.message === 'Unauthorized' ? 401 : 403 })
  }

  const url = new URL(req.url)
  const idsParam = url.searchParams.get('ids')
  const ids = idsParam ? idsParam.split(',').filter(Boolean) : undefined
  const csv = await exportPayoutCsv(ids)

  await createAuditLog({
    userId: actor.id,
    action: 'EXPORT',
    entity: 'ReferralPayout',
    entityId: ids ? `selection:${ids.length}` : 'pending',
    description: `Exported ${ids ? ids.length : 'PENDING'} payout(s) as CSV`,
  })

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="referral-payouts-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
