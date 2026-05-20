import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withErrorHandler, apiCreated, apiError } from '@/lib/api/response'
import { requirePermission } from '@/lib/auth/permissions'
import { ADDITIONAL_PERMISSION_KEYS } from '@/lib/auth/permission-registry'
import { createPayoutRun } from '@/lib/referral/admin'

const schema = z.object({
  periodStart: z.string(),
  periodEnd: z.string(),
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const actor = await requirePermission(ADDITIONAL_PERMISSION_KEYS.MANAGE_REFERRALS)
  const body = schema.parse(await req.json())
  const start = new Date(body.periodStart)
  const end = new Date(body.periodEnd)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
    return apiError('Invalid period', 400)
  }
  const result = await createPayoutRun(start, end, actor.id)
  return apiCreated(result)
})
