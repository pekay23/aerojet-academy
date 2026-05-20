import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withErrorHandler, apiSuccess, apiError } from '@/lib/api/response'
import { requirePermission } from '@/lib/auth/permissions'
import { ADDITIONAL_PERMISSION_KEYS } from '@/lib/auth/permission-registry'
import { disqualifyReferral } from '@/lib/referral/admin'

const schema = z.object({
  action: z.enum(['disqualify']),
  ids: z.array(z.string()).min(1),
  reason: z.string().min(2).max(280),
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const actor = await requirePermission(ADDITIONAL_PERMISSION_KEYS.MANAGE_REFERRALS)
  const body = schema.parse(await req.json())

  if (body.action === 'disqualify') {
    let failed = 0
    for (const id of body.ids) {
      try {
        await disqualifyReferral(id, actor.id, body.reason)
      } catch (err) {
        failed += 1
        console.error(`[bulk disqualify] ${id}`, err)
      }
    }
    return apiSuccess({ processed: body.ids.length - failed, failed })
  }
  return apiError('Unknown action', 400)
})
