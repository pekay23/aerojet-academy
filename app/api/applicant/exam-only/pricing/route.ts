import { NextResponse } from 'next/server'
import { requireApplicant } from '@/lib/auth/helpers'
import { getExamPricingConfig } from '@/lib/pools/pricing-config'
import { getBundlePricing } from '@/lib/pools/pricing'
import { withErrorHandler } from '@/lib/api/response'

/**
 * Returns all current exam pricing info for display in the UI.
 * All values are admin-editable via SystemSettings.
 */
export const GET = withErrorHandler(async () => {
  await requireApplicant()

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
})
