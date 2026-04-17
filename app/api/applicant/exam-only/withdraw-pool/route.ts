import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { withdrawFromPool } from '@/lib/pools/withdraw'

export async function POST(request: Request) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { poolId } = await request.json()

    if (!poolId) {
      return NextResponse.json({ error: 'Pool ID is required' }, { status: 400 })
    }

    const result = await withdrawFromPool(poolId, userId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      amountReleased: result.amountReleased,
      message: result.amountReleased
        ? `Successfully left pool. €${result.amountReleased} released back to your wallet.`
        : 'Successfully left pool.',
    })
  } catch (error) {
    console.error('Error withdrawing from pool:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
