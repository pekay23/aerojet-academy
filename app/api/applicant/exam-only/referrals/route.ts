import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { getOrCreateReferralCode, getReferralStats } from '@/lib/referral/operations'

/**
 * GET — Return user's referral code and stats
 * POST — Generate referral code if not exists
 */
export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const stats = await getReferralStats(userId)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching referral stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const code = await getOrCreateReferralCode(userId)

    return NextResponse.json({ referralCode: code })
  } catch (error) {
    console.error('Error generating referral code:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
