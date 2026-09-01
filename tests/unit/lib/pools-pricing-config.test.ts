import { describe, it, expect } from 'vitest'
import { PRICING_SEED_DEFAULTS } from '@/lib/pools/pricing-config'

describe('lib/pools/pricing-config', () => {
  describe('PRICING_SEED_DEFAULTS', () => {
    it('has all required pricing keys', () => {
      expect(PRICING_SEED_DEFAULTS.pool_exam_fee).toBeDefined()
      expect(PRICING_SEED_DEFAULTS.individual_exam_fee).toBeDefined()
      expect(PRICING_SEED_DEFAULTS.multi_pool_discount_fee).toBeDefined()
      expect(PRICING_SEED_DEFAULTS.two_seat_bundle_price).toBeDefined()
      expect(PRICING_SEED_DEFAULTS.four_seat_bundle_price).toBeDefined()
      expect(PRICING_SEED_DEFAULTS.resit_exam_fee).toBeDefined()
      expect(PRICING_SEED_DEFAULTS.group_charter_fee).toBeDefined()
      expect(PRICING_SEED_DEFAULTS.late_booking_surcharge).toBeDefined()
      expect(PRICING_SEED_DEFAULTS.module_change_fee).toBeDefined()
      expect(PRICING_SEED_DEFAULTS.late_booking_days).toBeDefined()
      expect(PRICING_SEED_DEFAULTS.ambassador_credit_amount).toBeDefined()
    })

    it('has correct default values', () => {
      expect(PRICING_SEED_DEFAULTS.pool_exam_fee.value).toBe('300')
      expect(PRICING_SEED_DEFAULTS.individual_exam_fee.value).toBe('520')
      expect(PRICING_SEED_DEFAULTS.two_seat_bundle_price.value).toBe('980')
      expect(PRICING_SEED_DEFAULTS.four_seat_bundle_price.value).toBe('1900')
      expect(PRICING_SEED_DEFAULTS.group_charter_fee.value).toBe('7500')
    })

    it('has descriptions for all entries', () => {
      for (const entry of Object.values(PRICING_SEED_DEFAULTS)) {
        expect(entry.description.length).toBeGreaterThan(0)
      }
    })
  })
})
