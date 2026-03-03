import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { purchaseBundle, getUserBundles } from '@/lib/pools/bundles'

export async function POST(request: Request) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { bundleType } = await request.json()

    if (!bundleType || !['TWO_SEAT', 'FOUR_SEAT'].includes(bundleType)) {
      return NextResponse.json(
        { error: 'Bundle type must be TWO_SEAT or FOUR_SEAT' },
        { status: 400 }
      )
    }

    const result = await purchaseBundle(userId, bundleType)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      bundleId: result.bundleId,
      message: `${bundleType === 'TWO_SEAT' ? '2-Seat' : '4-Seat'} bundle purchased successfully!`,
    })
  } catch (error) {
    console.error('Error purchasing bundle:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const bundles = await getUserBundles(userId)

    return NextResponse.json({ bundles })
  } catch (error) {
    console.error('Error fetching bundles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
