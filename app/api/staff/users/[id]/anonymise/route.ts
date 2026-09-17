import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withErrorHandler, apiSuccess , RouteContext } from '@/lib/api/response'
import { requirePermission } from '@/lib/auth/permissions'
import { ADDITIONAL_PERMISSION_KEYS } from '@/lib/auth/permission-registry'
import { anonymiseUser } from '@/lib/gdpr/anonymise'

const schema = z.object({
  reason: z.string().min(5).max(280),
  confirmEmail: z.string().email(),
})

export const POST = withErrorHandler(async (
  req: NextRequest, ctx?: RouteContext) => {
  const actor = await requirePermission(ADDITIONAL_PERMISSION_KEYS.MANAGE_GDPR)
  const { id } = (await ctx!.params) as { id: string }
  const body = schema.parse(await req.json())
  const result = await anonymiseUser(id, actor.id, `${body.reason} (confirmed via ${body.confirmEmail})`)
  return apiSuccess(result)
})
