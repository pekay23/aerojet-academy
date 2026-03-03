/**
 * Admin-editable Exam Pricing Configuration
 *
 * All pricing values are loaded from the SystemSetting table at runtime,
 * allowing admins to change prices without code deployments.
 * Fallback defaults match the current business rules.
 */

import { getSystemSettings } from '@/lib/settings'

export interface ExamPricingConfig {
  poolExamFee: number
  individualExamFee: number
  multiPoolDiscountFee: number
  twoSeatBundle: number
  fourSeatBundle: number
  resitExamFee: number
  groupCharterFee: number
  lateBookingSurcharge: number
  moduleChangeFee: number
  lateBookingDays: number
  ambassadorCredit: number
}

/**
 * Load all exam pricing from the SystemSetting table.
 * Each value has a hardcoded fallback matching the Feb 2026 price list.
 */
export async function getExamPricingConfig(): Promise<ExamPricingConfig> {
  const settings = await getSystemSettings([
    'pool_exam_fee',
    'individual_exam_fee',
    'multi_pool_discount_fee',
    'two_seat_bundle_price',
    'four_seat_bundle_price',
    'resit_exam_fee',
    'group_charter_fee',
    'late_booking_surcharge',
    'module_change_fee',
    'late_booking_days',
    'ambassador_credit_amount',
  ])

  return {
    poolExamFee: Number(settings.get('pool_exam_fee') ?? 300),
    individualExamFee: Number(settings.get('individual_exam_fee') ?? 520),
    multiPoolDiscountFee: Number(settings.get('multi_pool_discount_fee') ?? 270),
    twoSeatBundle: Number(settings.get('two_seat_bundle_price') ?? 980),
    fourSeatBundle: Number(settings.get('four_seat_bundle_price') ?? 1900),
    resitExamFee: Number(settings.get('resit_exam_fee') ?? 480),
    groupCharterFee: Number(settings.get('group_charter_fee') ?? 7500),
    lateBookingSurcharge: Number(settings.get('late_booking_surcharge') ?? 50),
    moduleChangeFee: Number(settings.get('module_change_fee') ?? 50),
    lateBookingDays: Number(settings.get('late_booking_days') ?? 14),
    ambassadorCredit: Number(settings.get('ambassador_credit_amount') ?? 100),
  }
}

/**
 * All pricing setting keys with their default values.
 * Used by the seed script and admin UI.
 */
export const PRICING_SEED_DEFAULTS: Record<string, { value: string; description: string }> = {
  pool_exam_fee: {
    value: '300',
    description: 'Pool seat price (EUR) — standard price per pool exam seat',
  },
  individual_exam_fee: {
    value: '520',
    description: 'Individual exam seat price (EUR) — guaranteed slot, first-come first-served',
  },
  multi_pool_discount_fee: {
    value: '270',
    description: 'Discounted pool seat price (EUR) — for 3+ pools in same event or ambassadors',
  },
  two_seat_bundle_price: {
    value: '980',
    description: 'Two-seat bundle price (EUR) — two exam seats, any modules, valid 12 months',
  },
  four_seat_bundle_price: {
    value: '1900',
    description: 'Four-seat bundle price (EUR) — four exam seats, any modules, valid 12 months',
  },
  resit_exam_fee: {
    value: '480',
    description: 'Resit exam fee (EUR) — for candidates retaking a failed exam outside of bundle',
  },
  group_charter_fee: {
    value: '7500',
    description: 'Organization/Military group charter fee (EUR) — per sitting, up to 28 seats',
  },
  late_booking_surcharge: {
    value: '50',
    description:
      'Late booking surcharge (EUR) — applied to bookings within late_booking_days of exam',
  },
  module_change_fee: {
    value: '50',
    description: 'Module change admin fee (EUR) — for changing module after schedule publication',
  },
  late_booking_days: {
    value: '14',
    description: 'Days before exam event that triggers late booking surcharge',
  },
  ambassador_credit_amount: {
    value: '100',
    description: 'Wallet credit (EUR) awarded when reaching 10 confirmed referrals (Ambassador)',
  },
}
