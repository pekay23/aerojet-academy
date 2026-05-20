import { NextRequest } from 'next/server'
import { withErrorHandler, apiSuccess } from '@/lib/api/response'
import { requirePermission } from '@/lib/auth/permissions'
import { ADDITIONAL_PERMISSION_KEYS } from '@/lib/auth/permission-registry'
import { runFraudHeuristics } from '@/lib/referral/admin'

export const POST = withErrorHandler(async (_req: NextRequest) => {
  await requirePermission(ADDITIONAL_PERMISSION_KEYS.MANAGE_REFERRALS)
  const result = await runFraudHeuristics(30)
  return apiSuccess({ scanned: result.scanned, flagged: result.flagged })
})
