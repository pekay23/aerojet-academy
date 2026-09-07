import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withErrorHandler, apiSuccess , RouteContext } from '@/lib/api/response'
import { requirePermission } from '@/lib/auth/permissions'
import { ADDITIONAL_PERMISSION_KEYS } from '@/lib/auth/permission-registry'
import { revokeAmbassador } from '@/lib/referral/admin'

const schema = z.object({ reason: z.string().min(2).max(280) })

export const POST = withErrorHandler(async (
  req: NextRequest, ctx?: RouteContext) => {
  const actor = await requirePermission(ADDITIONAL_PERMISSION_KEYS.MANAGE_REFERRALS)
  const { userId } = (await ctx!.params) as { userId: string }
  const { reason } = schema.parse(await req.json())
  await revokeAmbassador(userId, actor.id, reason)
  return apiSuccess({ revoked: true })
})
