import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth/permissions'
import { ADDITIONAL_PERMISSION_KEYS } from '@/lib/auth/permission-registry'
import { buildUserDataExport } from '@/lib/gdpr/export'
import { createAuditLog } from '@/lib/audit/logger'

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  let actor
  try {
    actor = await requirePermission(ADDITIONAL_PERMISSION_KEYS.MANAGE_GDPR)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.message === 'Unauthorized' ? 401 : 403 })
  }
  const { id } = await ctx.params

  try {
    const data = await buildUserDataExport(id)
    await createAuditLog({
      userId: actor.id,
      action: 'EXPORT',
      entity: 'User',
      entityId: id,
      description: 'GDPR Article 15 export',
    })
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="gdpr-export-${id}.json"`,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
