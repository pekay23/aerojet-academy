import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { getExamPricingConfig } from '@/lib/pools/pricing-config'
import { getBundlePricing } from '@/lib/pools/pricing'

/**
 * Returns all current exam pricing info for display in the UI.
 * All values are admin-editable via SystemSettings.
 */
export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const config = await getExamPricingConfig()
    const bundles = await getBundlePricing(config)

    return NextResponse.json({
      pool: {
        standardPrice: config.poolExamFee,
        discountedPrice: config.multiPoolDiscountFee,
        discountNote: '3+ pools in same event or Ambassador status',
      },
      individual: {
        price: config.individualExamFee,
      },
      resit: {
        price: config.resitExamFee,
      },
      bundles,
      surcharges: {
        lateBooking: config.lateBookingSurcharge,
        lateBookingDays: config.lateBookingDays,
        moduleChange: config.moduleChangeFee,
      },
      groupCharter: {
        price: config.groupCharterFee,
        maxSeats: 28,
      },
    })
  } catch (error) {
    console.error('Error fetching pricing:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
