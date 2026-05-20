import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withErrorHandler, apiSuccess } from '@/lib/api/response'
import { requirePermission } from '@/lib/auth/permissions'
import { ADDITIONAL_PERMISSION_KEYS } from '@/lib/auth/permission-registry'
import { revokeAmbassador } from '@/lib/referral/admin'

const schema = z.object({ reason: z.string().min(2).max(280) })

export const POST = withErrorHandler(async (
  req: NextRequest,
  ctx: { params: Promise<{ userId: string }> }
) => {
  const actor = await requirePermission(ADDITIONAL_PERMISSION_KEYS.MANAGE_REFERRALS)
  const { userId } = await ctx.params
  const { reason } = schema.parse(await req.json())
  await revokeAmbassador(userId, actor.id, reason)
  return apiSuccess({ revoked: true })
})
