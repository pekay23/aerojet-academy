import { NextResponse } from 'next/server'
import { requireApplicant } from '@/lib/auth/helpers'
import { getOrCreateReferralCode, getReferralStats } from '@/lib/referral/operations'
import { withErrorHandler } from '@/lib/api/response'

/**
 * GET — Return user's referral code and stats
 * POST — Generate referral code if not exists
 */
export const GET = withErrorHandler(async () => {
  const user = await requireApplicant()
  const stats = await getReferralStats(user.id)
  return NextResponse.json(stats)
})

export const POST = withErrorHandler(async () => {
  const user = await requireApplicant()
  const code = await getOrCreateReferralCode(user.id)
  return NextResponse.json({ referralCode: code })
})
