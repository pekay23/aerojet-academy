import { describe, it, expect } from 'vitest'
import { calculateReferralReward, getReferralStatus, REFERRAL_REWARD_AMOUNT, REWARD_THRESHOLD } from '@/lib/referral/rewards'

describe('lib/referral/rewards', () => {
  describe('REFERRAL_REWARD_AMOUNT', () => {
    it('is a positive number', () => {
      expect(REFERRAL_REWARD_AMOUNT).toBeGreaterThan(0)
    })
  })

  describe('REWARD_THRESHOLD', () => {
    it('is a number', () => {
      expect(typeof REWARD_THRESHOLD).toBe('number')
    })
  })

  describe('calculateReferralReward', () => {
    it('returns reward amount when threshold met', () => {
      const result = calculateReferralReward({ referredCount: 5 })
      expect(result).toBe(REFERRAL_REWARD_AMOUNT)
    })

    it('returns zero when threshold not met', () => {
      const result = calculateReferralReward({ referredCount: 1 })
      expect(result).toBe(0)
    })

    it('returns zero for null input', () => {
      expect(calculateReferralReward(null)).toBe(0)
    })
  })

  describe('getReferralStatus', () => {
    it('returns ACTIVE when reward eligible', () => {
      expect(getReferralStatus({ referredCount: 5 })).toBe('ACTIVE')
    })

    it('returns PENDING when below threshold', () => {
      expect(getReferralStatus({ referredCount: 2 })).toBe('PENDING')
    })

    it('returns REWARDED when already claimed', () => {
      expect(getReferralStatus({ referredCount: 5, rewarded: true })).toBe('REWARDED')
    })
  })
})
